const Folder = require("../models/folder.model");
const File = require("../models/file.model");
const AppError = require("../utils/appError");
const { deleteMultipleFilesFromS3 } = require("../services/s3.service");
const { logActivity } = require("../services/activity.service");

/**
 * Create a new folder
 */
const createFolder = async (req, res, next) => {
  try {
    const { name, parentFolder, color } = req.body;
    const userId = req.user._id;

    let path = [];
    let parentFolderDoc = null;

    if (parentFolder) {
      parentFolderDoc = await Folder.findOne({
        _id: parentFolder,
        user: userId,
        isTrash: false,
      });

      if (!parentFolderDoc) {
        return next(new AppError("Parent folder not found", 404));
      }

      // Build ancestry path
      path = [
        ...parentFolderDoc.path,
        { _id: parentFolderDoc._id, name: parentFolderDoc.name },
      ];
    }

    // Check for duplicate name in the same parent directory
    const existingFolder = await Folder.findOne({
      user: userId,
      parentFolder: parentFolder || null,
      name: name.trim(),
      isTrash: false,
    });

    if (existingFolder) {
      return next(
        new AppError("A folder with this name already exists in this location", 400)
      );
    }

    const folder = await Folder.create({
      name: name.trim(),
      user: userId,
      parentFolder: parentFolder || null,
      path,
      color: color || "#4F46E5",
    });

    logActivity({
      user: userId,
      action: "FOLDER_CREATE",
      itemType: "folder",
      itemId: folder._id,
      itemName: folder.name,
      details: { parentFolder: folder.parentFolder, color: folder.color },
      req,
    });

    res.status(201).json({
      success: true,
      folder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get contents of root or a specific folder (subfolders, files, breadcrumbs)
 */
const getFolderContents = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { parentFolder } = req.query;

    let targetParentId = null;
    let currentFolder = null;
    let breadcrumbs = [];

    if (parentFolder && parentFolder !== "root" && parentFolder !== "null") {
      currentFolder = await Folder.findOne({
        _id: parentFolder,
        user: userId,
        isTrash: false,
      });

      if (!currentFolder) {
        return next(new AppError("Folder not found", 404));
      }

      targetParentId = currentFolder._id;
      breadcrumbs = [
        ...currentFolder.path,
        { _id: currentFolder._id, name: currentFolder.name },
      ];
    }

    // Fetch immediate subfolders
    const folders = await Folder.find({
      user: userId,
      parentFolder: targetParentId,
      isTrash: false,
    }).sort({ name: 1 });

    // Fetch immediate files
    const files = await File.find({
      user: userId,
      folder: targetParentId,
      isTrash: false,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      currentFolder,
      breadcrumbs,
      folders,
      files,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single folder details by ID
 */
const getFolderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const folder = await Folder.findOne({
      _id: id,
      user: userId,
      isTrash: false,
    });

    if (!folder) {
      return next(new AppError("Folder not found", 404));
    }

    const breadcrumbs = [
      ...folder.path,
      { _id: folder._id, name: folder.name },
    ];

    const subfolders = await Folder.find({
      user: userId,
      parentFolder: folder._id,
      isTrash: false,
    }).sort({ name: 1 });

    const files = await File.find({
      user: userId,
      folder: folder._id,
      isTrash: false,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      folder,
      breadcrumbs,
      subfolders,
      files,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update folder (Rename, change color, toggle favorite)
 */
const updateFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, color, isFavorite } = req.body;
    const userId = req.user._id;

    const folder = await Folder.findOne({
      _id: id,
      user: userId,
      isTrash: false,
    });

    if (!folder) {
      return next(new AppError("Folder not found", 404));
    }

    const oldName = folder.name;

    // If renaming, check for conflict in the same directory
    if (name && name.trim() !== folder.name) {
      const duplicate = await Folder.findOne({
        user: userId,
        parentFolder: folder.parentFolder,
        name: name.trim(),
        _id: { $ne: folder._id },
        isTrash: false,
      });

      if (duplicate) {
        return next(
          new AppError("A folder with this name already exists in this location", 400)
        );
      }

      folder.name = name.trim();

      // Update name inside descendant folders' path arrays
      await Folder.updateMany(
        { user: userId, "path._id": folder._id },
        { $set: { "path.$[elem].name": folder.name } },
        { arrayFilters: [{ "elem._id": folder._id }] }
      );

      logActivity({
        user: userId,
        action: "FOLDER_RENAME",
        itemType: "folder",
        itemId: folder._id,
        itemName: folder.name,
        details: { oldName, newName: folder.name },
        req,
      });
    }

    if (color !== undefined) folder.color = color;
    if (isFavorite !== undefined) folder.isFavorite = isFavorite;

    await folder.save();

    res.status(200).json({
      success: true,
      folder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Move folder to another parent folder (with circular reference check)
 */
const moveFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { targetParentFolderId } = req.body;
    const userId = req.user._id;

    const folder = await Folder.findOne({
      _id: id,
      user: userId,
      isTrash: false,
    });

    if (!folder) {
      return next(new AppError("Folder not found", 404));
    }

    const newParentId = targetParentFolderId || null;

    // Cannot move folder into itself
    if (newParentId && newParentId.toString() === folder._id.toString()) {
      return next(new AppError("Cannot move a folder into itself", 400));
    }

    let newPath = [];

    if (newParentId) {
      const targetParent = await Folder.findOne({
        _id: newParentId,
        user: userId,
        isTrash: false,
      });

      if (!targetParent) {
        return next(new AppError("Target parent folder not found", 404));
      }

      // Check if targetParent is inside the current folder's descendants (cycle check)
      const isDescendant = targetParent.path.some(
        (p) => p._id.toString() === folder._id.toString()
      );
      if (isDescendant) {
        return next(
          new AppError("Cannot move a folder into one of its subfolders", 400)
        );
      }

      newPath = [
        ...targetParent.path,
        { _id: targetParent._id, name: targetParent.name },
      ];
    }

    // Check for duplicate name in destination
    const duplicate = await Folder.findOne({
      user: userId,
      parentFolder: newParentId,
      name: folder.name,
      _id: { $ne: folder._id },
      isTrash: false,
    });

    if (duplicate) {
      return next(
        new AppError(
          "A folder with the same name already exists in the destination",
          400
        )
      );
    }

    const previousParent = folder.parentFolder;
    folder.parentFolder = newParentId;
    folder.path = newPath;
    await folder.save();

    // Update path for all descendant folders
    const descendants = await Folder.find({
      user: userId,
      "path._id": folder._id,
    });

    for (const desc of descendants) {
      const folderIndexInPath = desc.path.findIndex(
        (p) => p._id.toString() === folder._id.toString()
      );
      const remainingPath = desc.path.slice(folderIndexInPath + 1);
      desc.path = [
        ...newPath,
        { _id: folder._id, name: folder.name },
        ...remainingPath,
      ];
      await desc.save();
    }

    logActivity({
      user: userId,
      action: "FOLDER_MOVE",
      itemType: "folder",
      itemId: folder._id,
      itemName: folder.name,
      details: { previousParent, targetParent: newParentId },
      req,
    });

    res.status(200).json({
      success: true,
      message: "Folder moved successfully",
      folder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete (move folder and all contents to Trash)
 */
const trashFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const folder = await Folder.findOne({
      _id: id,
      user: userId,
      isTrash: false,
    });

    if (!folder) {
      return next(new AppError("Folder not found", 404));
    }

    const now = new Date();

    // 1. Trash the folder itself
    folder.isTrash = true;
    folder.trashedAt = now;
    await folder.save();

    // 2. Find all descendant folder IDs
    const descendantFolders = await Folder.find({
      user: userId,
      "path._id": folder._id,
    });
    const allFolderIds = [folder._id, ...descendantFolders.map((f) => f._id)];

    // 3. Mark descendant folders as trash
    await Folder.updateMany(
      { _id: { $in: allFolderIds } },
      { $set: { isTrash: true, trashedAt: now } }
    );

    // 4. Mark all files in these folders as trash
    await File.updateMany(
      { user: userId, folder: { $in: allFolderIds } },
      { $set: { isTrash: true, trashedAt: now } }
    );

    logActivity({
      user: userId,
      action: "FOLDER_TRASH",
      itemType: "folder",
      itemId: folder._id,
      itemName: folder.name,
      details: { affectedFoldersCount: allFolderIds.length },
      req,
    });

    res.status(200).json({
      success: true,
      message: "Folder and all its contents moved to Trash",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore folder and its contents from Trash
 */
const restoreFolder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const folder = await Folder.findOne({
      _id: id,
      user: userId,
      isTrash: true,
    });

    if (!folder) {
      return next(new AppError("Folder not found in Trash", 404));
    }

    // Check if original parent folder is still in trash or nonexistent
    if (folder.parentFolder) {
      const parentDoc = await Folder.findOne({
        _id: folder.parentFolder,
        user: userId,
        isTrash: false,
      });

      // If parent is not active, restore to root
      if (!parentDoc) {
        folder.parentFolder = null;
        folder.path = [];
      }
    }

    folder.isTrash = false;
    folder.trashedAt = null;
    await folder.save();

    // Find descendant folders and restore them
    const descendantFolders = await Folder.find({
      user: userId,
      "path._id": folder._id,
    });
    const allFolderIds = [folder._id, ...descendantFolders.map((f) => f._id)];

    await Folder.updateMany(
      { _id: { $in: allFolderIds } },
      { $set: { isTrash: false, trashedAt: null } }
    );

    await File.updateMany(
      { user: userId, folder: { $in: allFolderIds } },
      { $set: { isTrash: false, trashedAt: null } }
    );

    logActivity({
      user: userId,
      action: "FOLDER_RESTORE",
      itemType: "folder",
      itemId: folder._id,
      itemName: folder.name,
      req,
    });

    res.status(200).json({
      success: true,
      message: "Folder and its contents restored successfully",
      folder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Permanently delete folder, all subfolders, and all files (including S3 files)
 */
const deleteFolderPermanently = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const folder = await Folder.findOne({
      _id: id,
      user: userId,
    });

    if (!folder) {
      return next(new AppError("Folder not found", 404));
    }

    // 1. Collect all folder IDs (this folder + all descendants)
    const descendantFolders = await Folder.find({
      user: userId,
      "path._id": folder._id,
    });
    const allFolderIds = [folder._id, ...descendantFolders.map((f) => f._id)];

    // 2. Find all files in these folders
    const files = await File.find({
      user: userId,
      folder: { $in: allFolderIds },
    });

    // 3. Delete files from AWS S3
    const s3Keys = files.map((f) => f.s3Key).filter(Boolean);
    if (s3Keys.length > 0) {
      await deleteMultipleFilesFromS3(s3Keys);
    }

    // 4. Delete file records from MongoDB
    await File.deleteMany({
      user: userId,
      folder: { $in: allFolderIds },
    });

    // 5. Delete all folders from MongoDB
    await Folder.deleteMany({
      _id: { $in: allFolderIds },
    });

    logActivity({
      user: userId,
      action: "FOLDER_DELETE_PERMANENT",
      itemType: "folder",
      itemId: folder._id,
      itemName: folder.name,
      details: { deletedFoldersCount: allFolderIds.length, deletedFilesCount: files.length },
      req,
    });

    res.status(200).json({
      success: true,
      message: "Folder, subfolders, and files deleted permanently",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFolder,
  getFolderContents,
  getFolderById,
  updateFolder,
  moveFolder,
  trashFolder,
  restoreFolder,
  deleteFolderPermanently,
};
