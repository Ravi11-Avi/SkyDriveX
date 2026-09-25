const File = require("../models/file.model");
const Folder = require("../models/folder.model");
const Share = require("../models/share.model");
const User = require("../models/user.model");
const { deleteMultipleFiles } = require("../services/storage.service");
const { TRASH_RETENTION_DAYS } = require("../constants");

/**
 * Perform background cleanup of expired trash, shares, and reset tokens
 */
const runCleanup = async () => {
  try {
    const now = new Date();
    const trashCutoff = new Date(now.getTime() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    // 1. Purge Files in Trash older than retention policy (30 days)
    const expiredFiles = await File.find({
      isTrash: true,
      trashedAt: { $lt: trashCutoff },
    });

    if (expiredFiles.length > 0) {
      const s3Keys = expiredFiles.map((f) => f.s3Key).filter(Boolean);
      await deleteMultipleFiles(s3Keys);
      await File.deleteMany({ _id: { $in: expiredFiles.map((f) => f._id) } });
      console.log(`[Job:Cleanup] Purged ${expiredFiles.length} expired file(s) from trash.`);
    }

    // 2. Purge Folders in Trash older than retention policy
    const expiredFolders = await Folder.deleteMany({
      isTrash: true,
      trashedAt: { $lt: trashCutoff },
    });
    if (expiredFolders.deletedCount > 0) {
      console.log(`[Job:Cleanup] Purged ${expiredFolders.deletedCount} expired folder(s) from trash.`);
    }

    // 3. Deactivate Expired Share Links
    const expiredShares = await Share.updateMany(
      {
        isActive: true,
        expiresAt: { $ne: null, $lt: now },
      },
      {
        $set: { isActive: false },
      }
    );
    if (expiredShares.modifiedCount > 0) {
      console.log(`[Job:Cleanup] Deactivated ${expiredShares.modifiedCount} expired share link(s).`);
    }

    // 4. Clean Stale Password Reset Tokens
    const clearedTokens = await User.updateMany(
      {
        passwordResetExpires: { $lt: now },
        passwordResetToken: { $ne: null },
      },
      {
        $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
      }
    );
    if (clearedTokens.modifiedCount > 0) {
      console.log(`[Job:Cleanup] Cleared ${clearedTokens.modifiedCount} stale password reset token(s).`);
    }
  } catch (error) {
    console.error("[Job:Cleanup] Error running background cleanup job:", error.message);
  }
};

/**
 * Schedule periodic background cleanup job
 * @param {number} intervalMs - Interval in milliseconds (default: every 1 hour)
 */
const startCleanupJob = (intervalMs = 60 * 60 * 1000) => {
  // Run once shortly after startup
  setTimeout(runCleanup, 5000);

  // Schedule recurring execution
  const intervalId = setInterval(runCleanup, intervalMs);
  return intervalId;
};

module.exports = {
  runCleanup,
  startCleanupJob,
};
