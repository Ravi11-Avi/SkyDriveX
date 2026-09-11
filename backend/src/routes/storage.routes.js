const express = require("express");
const router = express.Router();
const { getStorageSummary } = require("../controllers/storage.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.get("/summary", getStorageSummary);

module.exports = router;
