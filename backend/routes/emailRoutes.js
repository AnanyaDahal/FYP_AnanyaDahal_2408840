// const express = require("express");
// const { analyseEmail } = require("../controllers/emailController");

// const router = express.Router();

// router.post("/analyse", analyseEmail);

// module.exports = router;


// routes/emailRoutes.js

const express = require("express");
const router = express.Router();
const { checkEmail } = require("../controllers/emailController");

router.post("/check-email", checkEmail);

module.exports = router;
