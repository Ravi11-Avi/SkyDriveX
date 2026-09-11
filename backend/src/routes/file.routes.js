const express = require("express");
const router = express.Router();
const {
  uploadFiles,
  getFiles,
  getFileById,
  getDownloadUrl,
  getViewUrl,
  updateFile,
  moveFile,
  trashFile,
  restoreFile,
  deleteFilePermanently,
} = require("../controllers/file.controller");
const { protect } = require("../middleware/auth.middleware");
const { uploadMultiple } = require("../middleware/upload.middleware");
const {
  validateUpdateFile,
  validateMoveFile,
} = require("../validators/file.validator");

// All file endpoints require authentication
router.use(protect);

router.post("/upload", uploadMultiple, uploadFiles);
router.get("/", getFiles);
router.get("/:id", getFileById);
router.get("/:id/download", getDownloadUrl);
router.get("/:id/view", getViewUrl);
router.patch("/:id", validateUpdateFile, updateFile);
router.patch("/:id/move", validateMoveFile, moveFile);
router.delete("/:id", trashFile);
router.post("/:id/restore", restoreFile);
router.delete("/:id/permanent", deleteFilePermanently);

module.exports = router;
