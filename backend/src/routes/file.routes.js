const express = require("express");
const router = express.Router();
const {
  uploadFiles,
  getFiles,
  getFileById,
  getDownloadUrl,
  getViewUrl,
  streamLocalFile,
  updateFile,
  moveFile,
  trashFile,
  restoreFile,
  deleteFilePermanently,
  batchTrashFiles,
  batchRestoreFiles,
  batchDeleteFiles,
  batchMoveFiles,
} = require("../controllers/file.controller");
const { protect } = require("../middleware/auth.middleware");
const { uploadMultiple } = require("../middleware/upload.middleware");
const {
  validateUpdateFile,
  validateMoveFile,
  validateBatchFiles,
  validateBatchMoveFiles,
} = require("../validators/file.validator");

// Public stream route for local storage mode (also accessible via shared link tokens)
router.get("/stream/*key", streamLocalFile);

// All other file endpoints require authentication
router.use(protect);

router.post("/upload", uploadMultiple, uploadFiles);
router.get("/", getFiles);

// Batch operations
router.post("/batch-trash", validateBatchFiles, batchTrashFiles);
router.post("/batch-restore", validateBatchFiles, batchRestoreFiles);
router.delete("/batch-permanent", validateBatchFiles, batchDeleteFiles);
router.patch("/batch-move", validateBatchMoveFiles, batchMoveFiles);

// Single file operations
router.get("/:id", getFileById);
router.get("/:id/download", getDownloadUrl);
router.get("/:id/view", getViewUrl);
router.patch("/:id", validateUpdateFile, updateFile);
router.patch("/:id/move", validateMoveFile, moveFile);
router.delete("/:id", trashFile);
router.post("/:id/restore", restoreFile);
router.delete("/:id/permanent", deleteFilePermanently);

module.exports = router;
