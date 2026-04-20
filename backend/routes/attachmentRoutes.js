const express = require("express");
const router = express.Router();
const { scanAttachmentStream } = require("../controllers/attachmentController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.post("/scan-stream", authenticateToken, scanAttachmentStream);

module.exports = router;
