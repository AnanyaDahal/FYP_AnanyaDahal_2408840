const express = require("express");
const router = express.Router();

const { checkEmailStream } = require("../controllers/emailController");

router.post("/check-email-stream", checkEmailStream);

module.exports = router;
