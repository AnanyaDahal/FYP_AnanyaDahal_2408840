const express = require("express");
const { analyseEmail } = require("../controllers/emailController");

const router = express.Router();

router.post("/analyse", analyseEmail);

module.exports = router;
