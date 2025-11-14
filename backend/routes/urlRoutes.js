const express = require("express");
const { analyseURL } = require("../controllers/urlController");

const router = express.Router();

router.post("/analyse", analyseURL);

module.exports = router;
