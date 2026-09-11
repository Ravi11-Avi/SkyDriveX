const express = require("express");
const router = express.Router();
const { getTrashItems, emptyTrash } = require("../controllers/trash.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.get("/", getTrashItems);
router.delete("/empty", emptyTrash);

module.exports = router;
