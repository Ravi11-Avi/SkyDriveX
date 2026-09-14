const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const shareSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ["file", "folder"],
      required: [true, "Item type is required"],
    },
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Share link must belong to a user"],
      index: true,
    },
    shareToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    isPasswordProtected: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      default: null,
      select: false,
    },
    permission: {
      type: String,
      enum: ["view", "download"],
      default: "view",
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    downloadsCount: {
      type: Number,
      default: 0,
    },
    lastAccessedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if provided
shareSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.isPasswordProtected = true;
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
shareSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return true;
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if share link has expired
shareSchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;
  return new Date() > new Date(this.expiresAt);
};

const Share = mongoose.model("Share", shareSchema);

module.exports = Share;
