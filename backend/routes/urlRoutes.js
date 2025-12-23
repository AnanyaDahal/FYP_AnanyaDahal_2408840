// // routes/urlRoutes.js

// const express = require("express");
// const router = express.Router();
// const { checkUrl } = require("../controllers/urlController");

// router.post("/check-url", checkUrl);

// module.exports = router;


// backend/routes/urlRoutes.js
const express = require("express");
const router = express.Router();
const { checkUrl } = require("../controllers/urlController");

router.post("/check-url", checkUrl);

module.exports = router;
