const express = require("express");
const router = express.Router();
const {
  createShareLink,
  getMyShares,
  updateShareLink,
  revokeShareLink,
  getPublicShare,
  verifyPublicSharePassword,
  downloadSharedFile,
  viewSharedFile,
} = require("../controllers/share.controller");
const { protect } = require("../middleware/auth.middleware");
const {
  validateCreateShare,
  validateUpdateShare,
  validateVerifyPassword,
} = require("../validators/share.validator");
const { shareVerifyLimiter } = require("../middleware/rateLimit.middleware");

// ==========================================
// Public Endpoints (Accessible by Guests/Recipients)
// ==========================================
router.get("/public/:token", getPublicShare);
router.post("/public/:token/verify", shareVerifyLimiter, validateVerifyPassword, verifyPublicSharePassword);
router.get("/public/:token/download", downloadSharedFile);
router.get("/public/:token/view", viewSharedFile);

// ==========================================
// Authenticated Endpoints (For Link Owners)
// ==========================================
router.post("/", protect, validateCreateShare, createShareLink);
router.get("/", protect, getMyShares);
router.patch("/:id", protect, validateUpdateShare, updateShareLink);
router.delete("/:id", protect, revokeShareLink);

module.exports = router;
