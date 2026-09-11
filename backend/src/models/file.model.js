const mongoose = require("mongoose");
const { CATEGORIES } = require("../helpers/fileCategory.helper");

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "File name is required"],
      trim: true,
      maxlength: [255, "File name cannot exceed 255 characters"],
    },
    originalName: {
      type: String,
      required: [true, "Original file name is required"],
      trim: true,
    },
    s3Key: {
      type: String,
      required: [true, "S3 Key is required"],
      unique: true,
    },
    s3Url: {
      type: String,
      default: "",
    },
    mimeType: {
      type: String,
      required: [true, "MIME type is required"],
    },
    size: {
      type: Number,
      required: [true, "File size is required"],
      min: [0, "File size cannot be negative"],
    },
    extension: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: Object.values(CATEGORIES),
      default: CATEGORIES.OTHER,
      index: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "File must belong to a user"],
      index: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isTrash: {
      type: Boolean,
      default: false,
      index: true,
    },
    trashedAt: {
      type: Date,
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
fileSchema.index({ user: 1, folder: 1, isTrash: 1 });
fileSchema.index({ user: 1, category: 1, isTrash: 1 });
fileSchema.index({ user: 1, isFavorite: 1, isTrash: 1 });
fileSchema.index({ user: 1, isTrash: 1 });
fileSchema.index({ name: "text", originalName: "text", tags: "text" });

const File = mongoose.model("File", fileSchema);

module.exports = File;
