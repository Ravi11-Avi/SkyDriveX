const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Folder name is required"],
      trim: true,
      maxlength: [100, "Folder name cannot exceed 100 characters"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Folder must belong to a user"],
      index: true,
    },
    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
      index: true,
    },
    // Ancestor path array for fast breadcrumb rendering and subtree lookups
    path: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Folder",
        },
        name: {
          type: String,
        },
      },
    ],
    color: {
      type: String,
      default: "#4F46E5",
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
  },
  {
    timestamps: true,
  }
);

// Compound index for finding immediate contents within a directory
folderSchema.index({ user: 1, parentFolder: 1, isTrash: 1 });
folderSchema.index({ user: 1, isTrash: 1 });
folderSchema.index({ user: 1, isFavorite: 1, isTrash: 1 });

const Folder = mongoose.model("Folder", folderSchema);

module.exports = Folder;
