const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Activity must belong to a user"],
      index: true,
    },
    action: {
      type: String,
      enum: [
        "FILE_UPLOAD",
        "FILE_DOWNLOAD",
        "FILE_RENAME",
        "FILE_MOVE",
        "FILE_TRASH",
        "FILE_RESTORE",
        "FILE_DELETE_PERMANENT",
        "FOLDER_CREATE",
        "FOLDER_RENAME",
        "FOLDER_MOVE",
        "FOLDER_TRASH",
        "FOLDER_RESTORE",
        "FOLDER_DELETE_PERMANENT",
        "FOLDER_DOWNLOAD",
        "SHARE_CREATED",
        "SHARE_REVOKED",
        "PROFILE_UPDATE",
        "PASSWORD_CHANGE",
      ],
      required: true,
      index: true,
    },
    itemType: {
      type: String,
      enum: ["file", "folder", "share", "user"],
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    itemName: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ user: 1, createdAt: -1 });

const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;
