const express = require("express");
const router = express.Router();
const { checkEmail } = require("../controllers/emailController");

router.post("/check-email", checkEmail);

module.exports = router;
