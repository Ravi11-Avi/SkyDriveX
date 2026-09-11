const mongoose = require("mongoose");
const File = require("../models/file.model");
const Folder = require("../models/folder.model");

// Default quota: 15 GB (in bytes)
const DEFAULT_STORAGE_QUOTA = 15 * 1024 * 1024 * 1024;

/**
 * Get storage usage summary and breakdown for the authenticated user
 */
const getStorageSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const maxQuota = parseInt(process.env.STORAGE_QUOTA_BYTES || DEFAULT_STORAGE_QUOTA, 10);

    // Aggregate files by category (only active files, not trashed)
    const categoryAggregation = await File.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          isTrash: false,
        },
      },
      {
        $group: {
          _id: "$category",
          totalSize: { $sum: "$size" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Aggregate trashed files size
    const trashAggregation = await File.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          isTrash: true,
        },
      },
      {
        $group: {
          _id: null,
          totalTrashSize: { $sum: "$size" },
          trashCount: { $sum: 1 },
        },
      },
    ]);

    // Count folders
    const totalFolders = await Folder.countDocuments({
      user: userId,
      isTrash: false,
    });

    let usedBytes = 0;
    let totalFiles = 0;
    const breakdown = {
      image: { size: 0, count: 0 },
      video: { size: 0, count: 0 },
      audio: { size: 0, count: 0 },
      document: { size: 0, count: 0 },
      pdf: { size: 0, count: 0 },
      archive: { size: 0, count: 0 },
      code: { size: 0, count: 0 },
      other: { size: 0, count: 0 },
    };

    categoryAggregation.forEach((cat) => {
      usedBytes += cat.totalSize;
      totalFiles += cat.count;
      if (breakdown[cat._id]) {
        breakdown[cat._id] = {
          size: cat.totalSize,
          count: cat.count,
        };
      } else {
        breakdown.other.size += cat.totalSize;
        breakdown.other.count += cat.count;
      }
    });

    const trashBytes = trashAggregation.length > 0 ? trashAggregation[0].totalTrashSize : 0;
    const trashFilesCount = trashAggregation.length > 0 ? trashAggregation[0].trashCount : 0;
    const usedPercentage = Math.min(100, Number(((usedBytes / maxQuota) * 100).toFixed(2)));

    res.status(200).json({
      success: true,
      storage: {
        usedBytes,
        trashBytes,
        maxQuota,
        usedPercentage,
        totalFiles,
        totalFolders,
        trashFilesCount,
        breakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStorageSummary,
};
