const express = require("express");
const router = express.Router();
const {
  createFolder,
  getFolderContents,
  getFolderById,
  updateFolder,
  moveFolder,
  trashFolder,
  restoreFolder,
  deleteFolderPermanently,
  downloadFolderAsZip,
} = require("../controllers/folder.controller");
const { protect } = require("../middleware/auth.middleware");
const {
  validateCreateFolder,
  validateUpdateFolder,
  validateMoveFolder,
} = require("../validators/folder.validator");

// All folder routes require authentication
router.use(protect);

router.post("/", validateCreateFolder, createFolder);
router.get("/", getFolderContents);
router.get("/:id", getFolderById);
router.get("/:id/download", downloadFolderAsZip);
router.patch("/:id", validateUpdateFolder, updateFolder);
router.patch("/:id/move", validateMoveFolder, moveFolder);
router.delete("/:id", trashFolder);
router.post("/:id/restore", restoreFolder);
router.delete("/:id/permanent", deleteFolderPermanently);

module.exports = router;
