const path = require("path");
const { v4: uuidv4 } = require("uuid");
const File = require("../models/file.model");
const Folder = require("../models/folder.model");
const AppError = require("../utils/appError");
const {
  uploadFileToS3,
  getPresignedDownloadUrl,
  getPresignedViewUrl,
  deleteFileFromS3,
} = require("../services/s3.service");
const { getFileCategory } = require("../helpers/fileCategory.helper");
const { logActivity } = require("../services/activity.service");

/**
 * Upload single or multiple files
 */
const uploadFiles = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { folder } = req.body;

    // Collect files from req.file or req.files
    const rawFiles = req.files || (req.file ? [req.file] : []);
    if (rawFiles.length === 0) {
      return next(new AppError("Please provide at least one file to upload", 400));
    }

    // Verify folder if provided
    let folderDoc = null;
    let targetFolderId = null;

    if (folder && folder !== "null" && folder !== "root") {
      folderDoc = await Folder.findOne({
        _id: folder,
        user: userId,
        isTrash: false,
      });

      if (!folderDoc) {
        return next(new AppError("Destination folder not found", 404));
      }
      targetFolderId = folderDoc._id;
    }

    const uploadedFiles = [];

    for (const file of rawFiles) {
      const ext = path.extname(file.originalname).replace(".", "").toLowerCase();
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const s3Key = `users/${userId}/${Date.now()}-${uuidv4()}-${sanitizedName}`;

      // 1. Upload to AWS S3
      const { s3Url } = await uploadFileToS3(file.buffer, s3Key, file.mimetype);

      // 2. Determine Category
      const category = getFileCategory(file.mimetype, file.originalname);

      // 3. Save File Document in MongoDB
      const fileDoc = await File.create({
        name: file.originalname,
        originalName: file.originalname,
        s3Key,
        s3Url,
        mimeType: file.mimetype,
        size: file.size,
        extension: ext,
        category,
        folder: targetFolderId,
        user: userId,
      });

      uploadedFiles.push(fileDoc);

      // Log activity
      logActivity({
        user: userId,
        action: "FILE_UPLOAD",
        itemType: "file",
        itemId: fileDoc._id,
        itemName: fileDoc.name,
        details: {
          size: fileDoc.size,
          category: fileDoc.category,
          folder: targetFolderId,
        },
        req,
      });
    }

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List files with filtering, search, and pagination
 */
const getFiles = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      folder,
      category,
      isFavorite,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 50,
    } = req.query;

    const query = {
      user: userId,
      isTrash: false,
    };

    // Folder filtering
    if (folder !== undefined) {
      if (folder === "null" || folder === "root") {
        query.folder = null;
      } else if (folder) {
        query.folder = folder;
      }
    }

    // Category filtering
    if (category) {
      query.category = category.toLowerCase();
    }

    // Favorite filtering
    if (isFavorite !== undefined) {
      query.isFavorite = isFavorite === "true";
    }

    // Search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { originalName: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [files, total] = await Promise.all([
      File.find(query).sort(sortOptions).skip(skip).limit(limitNum),
      File.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      files,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get file details by ID
 */
const getFileById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const file = await File.findOne({
      _id: id,
      user: userId,
      isTrash: false,
    });

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    res.status(200).json({
      success: true,
      file,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate secure presigned download URL
 */
const getDownloadUrl = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const file = await File.findOne({
      _id: id,
      user: userId,
    });

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    const downloadUrl = await getPresignedDownloadUrl(file.s3Key, file.originalName);

    logActivity({
      user: userId,
      action: "FILE_DOWNLOAD",
      itemType: "file",
      itemId: file._id,
      itemName: file.name,
      req,
    });

    res.status(200).json({
      success: true,
      fileName: file.originalName,
      downloadUrl,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate secure presigned preview/view URL
 */
const getViewUrl = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const file = await File.findOne({
      _id: id,
      user: userId,
    });

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    const viewUrl = await getPresignedViewUrl(file.s3Key, file.mimeType);

    res.status(200).json({
      success: true,
      viewUrl,
      file,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update file properties (Rename, favorite, tags)
 */
const updateFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, isFavorite, tags } = req.body;
    const userId = req.user._id;

    const file = await File.findOne({
      _id: id,
      user: userId,
      isTrash: false,
    });

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    const oldName = file.name;
    if (name !== undefined) file.name = name.trim();
    if (isFavorite !== undefined) file.isFavorite = isFavorite;
    if (tags !== undefined) file.tags = tags;

    await file.save();

    if (name && name.trim() !== oldName) {
      logActivity({
        user: userId,
        action: "FILE_RENAME",
        itemType: "file",
        itemId: file._id,
        itemName: file.name,
        details: { oldName, newName: file.name },
        req,
      });
    }

    res.status(200).json({
      success: true,
      message: "File updated successfully",
      file,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Move file to a different folder
 */
const moveFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { targetFolderId } = req.body;
    const userId = req.user._id;

    const file = await File.findOne({
      _id: id,
      user: userId,
      isTrash: false,
    });

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    let newFolderId = null;

    if (targetFolderId && targetFolderId !== "root" && targetFolderId !== "null") {
      const destinationFolder = await Folder.findOne({
        _id: targetFolderId,
        user: userId,
        isTrash: false,
      });

      if (!destinationFolder) {
        return next(new AppError("Target destination folder not found", 404));
      }
      newFolderId = destinationFolder._id;
    }

    const previousFolder = file.folder;
    file.folder = newFolderId;
    await file.save();

    logActivity({
      user: userId,
      action: "FILE_MOVE",
      itemType: "file",
      itemId: file._id,
      itemName: file.name,
      details: { previousFolder, targetFolder: newFolderId },
      req,
    });

    res.status(200).json({
      success: true,
      message: "File moved successfully",
      file,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete file (Move to Trash)
 */
const trashFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const file = await File.findOne({
      _id: id,
      user: userId,
      isTrash: false,
    });

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    file.isTrash = true;
    file.trashedAt = new Date();
    await file.save();

    logActivity({
      user: userId,
      action: "FILE_TRASH",
      itemType: "file",
      itemId: file._id,
      itemName: file.name,
      req,
    });

    res.status(200).json({
      success: true,
      message: "File moved to Trash",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore file from Trash
 */
const restoreFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const file = await File.findOne({
      _id: id,
      user: userId,
      isTrash: true,
    });

    if (!file) {
      return next(new AppError("File not found in Trash", 404));
    }

    // Check if the folder where file originally belonged is still active
    if (file.folder) {
      const folderExists = await Folder.findOne({
        _id: file.folder,
        user: userId,
        isTrash: false,
      });

      if (!folderExists) {
        file.folder = null; // Move to root if parent folder was trashed or deleted
      }
    }

    file.isTrash = false;
    file.trashedAt = null;
    await file.save();

    logActivity({
      user: userId,
      action: "FILE_RESTORE",
      itemType: "file",
      itemId: file._id,
      itemName: file.name,
      req,
    });

    res.status(200).json({
      success: true,
      message: "File restored successfully",
      file,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Permanently delete file from MongoDB and AWS S3
 */
const deleteFilePermanently = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const file = await File.findOne({
      _id: id,
      user: userId,
    });

    if (!file) {
      return next(new AppError("File not found", 404));
    }

    // 1. Delete from AWS S3
    if (file.s3Key) {
      await deleteFileFromS3(file.s3Key);
    }

    // 2. Delete from MongoDB
    await File.findByIdAndDelete(file._id);

    logActivity({
      user: userId,
      action: "FILE_DELETE_PERMANENT",
      itemType: "file",
      itemId: file._id,
      itemName: file.name,
      req,
    });

    res.status(200).json({
      success: true,
      message: "File deleted permanently",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFiles,
  getFiles,
  getFileById,
  getDownloadUrl,
  getViewUrl,
  updateFile,
  moveFile,
  trashFile,
  restoreFile,
  deleteFilePermanently,
};
