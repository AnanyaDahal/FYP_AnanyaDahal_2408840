const express = require('express');
const router = express.Router();
const { checkUrl } = require('../controllers/urlController');
const Scan = require('../models/Scans');

// 1. Analyze URL (Calls Python Engine)
router.post('/analyze', checkUrl);

// 2. Fetch All History for a User
router.get('/history/:userId', async (req, res) => {
    try {
        const scans = await Scan.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(scans);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch scan history" });
    }
});

// 3. Fetch Single Scan for the Detailed Report Page
router.get('/report/:id', async (req, res) => {
    try {
        const scan = await Scan.findById(req.params.id);
        if (!scan) return res.status(404).json({ message: "Report not found" });
        res.json(scan);
    } catch (err) {
        res.status(500).json({ message: "Error retrieving report details" });
    }
});

module.exports = router;