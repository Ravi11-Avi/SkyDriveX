const Folder = require("../models/folder.model");
const File = require("../models/file.model");
const { deleteMultipleFilesFromS3 } = require("../services/s3.service");

/**
 * Get all items currently in Trash (both folders and files)
 */
const getTrashItems = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [folders, files] = await Promise.all([
      Folder.find({ user: userId, isTrash: true }).sort({ trashedAt: -1 }),
      File.find({ user: userId, isTrash: true }).sort({ trashedAt: -1 }),
    ]);

    res.status(200).json({
      success: true,
      folders,
      files,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Permanently empty all items in Trash
 */
const emptyTrash = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Find all trashed files
    const trashedFiles = await File.find({ user: userId, isTrash: true });
    const s3Keys = trashedFiles.map((f) => f.s3Key).filter(Boolean);

    // 2. Delete S3 objects
    if (s3Keys.length > 0) {
      await deleteMultipleFilesFromS3(s3Keys);
    }

    // 3. Delete files from DB
    await File.deleteMany({ user: userId, isTrash: true });

    // 4. Delete folders from DB
    await Folder.deleteMany({ user: userId, isTrash: true });

    res.status(200).json({
      success: true,
      message: "Trash emptied successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrashItems,
  emptyTrash,
};
