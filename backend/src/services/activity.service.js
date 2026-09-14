const Activity = require("../models/activity.model");

/**
 * Log a user activity event asynchronously
 * @param {Object} params
 * @param {string|ObjectId} params.user - User ID
 * @param {string} params.action - Action enum (e.g. 'FILE_UPLOAD')
 * @param {string} params.itemType - 'file' | 'folder' | 'share'
 * @param {string|ObjectId} [params.itemId] - Target ID
 * @param {string} params.itemName - Display name of item
 * @param {Object} [params.details] - Additional context object
 * @param {Object} [params.req] - Express request object for IP & User-Agent
 */
const logActivity = async ({
  user,
  action,
  itemType,
  itemId = null,
  itemName,
  details = {},
  req = null,
}) => {
  try {
    let ip = null;
    let userAgent = null;

    if (req) {
      ip =
        req.headers["x-forwarded-for"] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.ip ||
        null;
      userAgent = req.headers["user-agent"] || null;
    }

    await Activity.create({
      user,
      action,
      itemType,
      itemId,
      itemName,
      details,
      ip,
      userAgent,
    });
  } catch (error) {
    // Log error but do not throw to prevent blocking main user request
    console.error("Failed to record user activity:", error.message);
  }
};

module.exports = {
  logActivity,
};
