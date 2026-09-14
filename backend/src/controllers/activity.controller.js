const Activity = require("../models/activity.model");

/**
 * Get paginated activity history for the current user
 */
const getActivities = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      action,
      itemType,
      page = 1,
      limit = 20,
      startDate,
      endDate,
    } = req.query;

    const query = { user: userId };

    if (action) {
      query.action = action;
    }

    if (itemType) {
      query.itemType = itemType;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [activities, total] = await Promise.all([
      Activity.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Activity.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      count: activities.length,
      activities,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear activity history for the current user
 */
const clearActivities = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await Activity.deleteMany({ user: userId });

    res.status(200).json({
      success: true,
      message: "Activity history cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivities,
  clearActivities,
};
