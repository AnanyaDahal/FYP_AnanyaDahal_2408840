const express = require('express');
const router = express.Router();
const { checkUrl } = require('../controllers/urlController');

router.post('/analyze', checkUrl);

module.exports = router;