const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Share = require("../models/share.model");
const File = require("../models/file.model");
const Folder = require("../models/folder.model");
const AppError = require("../utils/appError");
const {
  getPresignedDownloadUrl,
  getPresignedViewUrl,
} = require("../services/s3.service");
const { logActivity } = require("../services/activity.service");

const JWT_SECRET = process.env.JWT_SECRET || "fallback-jwt-secret-key-123456";

/**
 * Helper to construct public share URL
 */
const getShareUrl = (token) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  return `${frontendUrl}/share/${token}`;
};

/**
 * Create a new share link (Authenticated)
 */
const createShareLink = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      itemType,
      itemId,
      permission = "view",
      password,
      expiresInHours,
      expiresAt,
    } = req.body;

    let targetItem = null;

    if (itemType === "file") {
      targetItem = await File.findOne({
        _id: itemId,
        user: userId,
        isTrash: false,
      });
      if (!targetItem) return next(new AppError("File not found", 404));
    } else if (itemType === "folder") {
      targetItem = await Folder.findOne({
        _id: itemId,
        user: userId,
        isTrash: false,
      });
      if (!targetItem) return next(new AppError("Folder not found", 404));
    }

    // Generate random 32-char hex token
    const shareToken = crypto.randomBytes(16).toString("hex");

    // Calculate expiration
    let expirationDate = null;
    if (expiresInHours) {
      expirationDate = new Date(Date.now() + parseInt(expiresInHours, 10) * 3600 * 1000);
    } else if (expiresAt) {
      expirationDate = new Date(expiresAt);
    }

    const shareData = {
      itemType,
      file: itemType === "file" ? itemId : null,
      folder: itemType === "folder" ? itemId : null,
      user: userId,
      shareToken,
      permission,
      expiresAt: expirationDate,
      isPasswordProtected: Boolean(password),
    };

    if (password) {
      shareData.password = password;
    }

    const share = await Share.create(shareData);

    // Asynchronously log activity
    logActivity({
      user: userId,
      action: "SHARE_CREATED",
      itemType,
      itemId,
      itemName: targetItem.name,
      details: {
        shareToken,
        permission,
        isPasswordProtected: Boolean(password),
        expiresAt: expirationDate,
      },
      req,
    });

    res.status(201).json({
      success: true,
      message: "Share link created successfully",
      share: {
        ...share.toObject(),
        shareUrl: getShareUrl(shareToken),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all active and inactive share links for current user (Authenticated)
 */
const getMyShares = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const shares = await Share.find({ user: userId })
      .populate("file", "name mimeType size category s3Url")
      .populate("folder", "name color")
      .sort({ createdAt: -1 });

    const formattedShares = shares.map((s) => ({
      ...s.toObject(),
      shareUrl: getShareUrl(s.shareToken),
      isExpired: s.isExpired(),
    }));

    res.status(200).json({
      success: true,
      count: formattedShares.length,
      shares: formattedShares,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update share link settings (Authenticated)
 */
const updateShareLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { permission, password, removePassword, expiresAt, isActive } = req.body;

    const share = await Share.findOne({ _id: id, user: userId });
    if (!share) {
      return next(new AppError("Share link not found", 404));
    }

    if (permission !== undefined) share.permission = permission;
    if (expiresAt !== undefined) share.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) share.isActive = isActive;

    if (removePassword) {
      share.password = null;
      share.isPasswordProtected = false;
    } else if (password) {
      share.password = password; // Will be hashed by pre-save hook
      share.isPasswordProtected = true;
    }

    await share.save();

    res.status(200).json({
      success: true,
      message: "Share link updated successfully",
      share: {
        ...share.toObject(),
        shareUrl: getShareUrl(share.shareToken),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revoke/Delete share link (Authenticated)
 */
const revokeShareLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const share = await Share.findOneAndDelete({ _id: id, user: userId });
    if (!share) {
      return next(new AppError("Share link not found", 404));
    }

    logActivity({
      user: userId,
      action: "SHARE_REVOKED",
      itemType: share.itemType,
      itemId: share.file || share.folder,
      itemName: `Share token: ${share.shareToken}`,
      details: { shareToken: share.shareToken },
      req,
    });

    res.status(200).json({
      success: true,
      message: "Share link revoked successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public Endpoint: Get Shared Item info (Public / Guest)
 */
const getPublicShare = async (req, res, next) => {
  try {
    const { token } = req.params;

    const share = await Share.findOne({ shareToken: token, isActive: true })
      .populate("file", "name originalName mimeType size category extension createdAt")
      .populate("folder", "name color createdAt");

    if (!share) {
      return next(new AppError("Share link not found or has been disabled", 404));
    }

    if (share.isExpired()) {
      return next(new AppError("This share link has expired", 410));
    }

    // Update views count and last accessed time
    share.viewsCount += 1;
    share.lastAccessedAt = new Date();
    await share.save();

    // If password protected, only reveal that a password is required
    if (share.isPasswordProtected) {
      return res.status(200).json({
        success: true,
        requiresPassword: true,
        isPasswordProtected: true,
        itemType: share.itemType,
        itemName: share.itemType === "file" ? share.file?.name : share.folder?.name,
        permission: share.permission,
      });
    }

    // If folder, also fetch immediate children inside the shared folder
    let subfolders = [];
    let files = [];
    if (share.itemType === "folder" && share.folder) {
      subfolders = await Folder.find({
        parentFolder: share.folder._id,
        isTrash: false,
      }).sort({ name: 1 });

      files = await File.find({
        folder: share.folder._id,
        isTrash: false,
      }).sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      requiresPassword: false,
      isPasswordProtected: false,
      itemType: share.itemType,
      permission: share.permission,
      item: share.itemType === "file" ? share.file : share.folder,
      subfolders,
      files,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public Endpoint: Verify password for protected share link (Public / Guest)
 */
const verifyPublicSharePassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const share = await Share.findOne({ shareToken: token, isActive: true })
      .select("+password")
      .populate("file", "name originalName mimeType size category extension createdAt")
      .populate("folder", "name color createdAt");

    if (!share) {
      return next(new AppError("Share link not found or disabled", 404));
    }

    if (share.isExpired()) {
      return next(new AppError("This share link has expired", 410));
    }

    const isMatch = await share.comparePassword(password);
    if (!isMatch) {
      return next(new AppError("Incorrect password. Please try again.", 401));
    }

    // Generate temporary share access token (valid 1 hour)
    const shareAccessToken = jwt.sign(
      { shareId: share._id, shareToken: share.shareToken },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    let subfolders = [];
    let files = [];
    if (share.itemType === "folder" && share.folder) {
      subfolders = await Folder.find({
        parentFolder: share.folder._id,
        isTrash: false,
      }).sort({ name: 1 });

      files = await File.find({
        folder: share.folder._id,
        isTrash: false,
      }).sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      message: "Password verified",
      shareAccessToken,
      itemType: share.itemType,
      permission: share.permission,
      item: share.itemType === "file" ? share.file : share.folder,
      subfolders,
      files,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to verify password token if share link is password-protected
 */
const checkShareAccess = async (share, req) => {
  if (!share.isPasswordProtected) return true;

  const authHeader = req.headers["x-share-token"] || req.query.shareAccessToken;
  if (!authHeader) {
    throw new AppError("Password verification required to access this content", 403);
  }

  try {
    const decoded = jwt.verify(authHeader, JWT_SECRET);
    return decoded.shareToken === share.shareToken;
  } catch (err) {
    throw new AppError("Invalid or expired share access session. Please re-enter password.", 403);
  }
};

/**
 * Public Endpoint: Download shared file (Public / Guest)
 */
const downloadSharedFile = async (req, res, next) => {
  try {
    const { token } = req.params;

    const share = await Share.findOne({ shareToken: token, isActive: true }).populate("file");
    if (!share || !share.file) {
      return next(new AppError("Shared file not found or inactive", 404));
    }

    if (share.isExpired()) {
      return next(new AppError("This share link has expired", 410));
    }

    await checkShareAccess(share, req);

    share.downloadsCount += 1;
    await share.save();

    const downloadUrl = await getPresignedDownloadUrl(
      share.file.s3Key,
      share.file.originalName,
      3600
    );

    res.status(200).json({
      success: true,
      fileName: share.file.originalName,
      downloadUrl,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public Endpoint: Preview/View shared file (Public / Guest)
 */
const viewSharedFile = async (req, res, next) => {
  try {
    const { token } = req.params;

    const share = await Share.findOne({ shareToken: token, isActive: true }).populate("file");
    if (!share || !share.file) {
      return next(new AppError("Shared file not found or inactive", 404));
    }

    if (share.isExpired()) {
      return next(new AppError("This share link has expired", 410));
    }

    await checkShareAccess(share, req);

    const viewUrl = await getPresignedViewUrl(
      share.file.s3Key,
      share.file.mimeType,
      3600
    );

    res.status(200).json({
      success: true,
      mimeType: share.file.mimeType,
      fileName: share.file.name,
      viewUrl,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createShareLink,
  getMyShares,
  updateShareLink,
  revokeShareLink,
  getPublicShare,
  verifyPublicSharePassword,
  downloadSharedFile,
  viewSharedFile,
};
