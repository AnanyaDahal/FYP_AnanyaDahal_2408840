const express = require('express');
const router = express.Router();
const { checkUrl } = require('../controllers/urlController');
const Scan = require('../models/Scans');
const { authenticateToken } = require('../middleware/authMiddleware');

// 1. Analyze URL (Calls Python Engine)
router.post('/analyze', authenticateToken, (req, res, next) => {
    const { userId, url } = req.body || {};

    if (!userId || !url) {
        return res.status(400).json({ message: "userId and url are required" });
    }

    if (String(req.user.id) !== String(userId)) {
        return res.status(403).json({ message: "Forbidden" });
    }

    return checkUrl(req, res, next);
});

// 2. Fetch All History for a User
router.get('/history/:userId', authenticateToken, async (req, res) => {
    try {
        if (String(req.user.id) !== String(req.params.userId)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const scans = await Scan.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(scans);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch scan history" });
    }
});

// 3. Fetch Single Scan for the Detailed Report Page
router.get('/report/:id', authenticateToken, async (req, res) => {
    try {
        const scan = await Scan.findById(req.params.id);
        if (!scan) return res.status(404).json({ message: "Report not found" });

        if (String(scan.userId) !== String(req.user.id)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        res.json(scan);
    } catch (err) {
        res.status(500).json({ message: "Error retrieving report details" });
    }
});

module.exports = router;