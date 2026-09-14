const express = require("express");
const router = express.Router();
const {
  getActivities,
  clearActivities,
} = require("../controllers/activity.controller");
const { protect } = require("../middleware/auth.middleware");

// All activity routes require user authentication
router.use(protect);

router.get("/", getActivities);
router.delete("/clear", clearActivities);

module.exports = router;
