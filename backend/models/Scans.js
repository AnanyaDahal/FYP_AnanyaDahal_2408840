const mongoose = require('mongoose');

const ScanSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, default: 'url' },
    value: { type: String, required: true }, // The URL checked
    status: { type: String, required: true }, // Malicious, Suspicious, Safe
    riskScore: { type: Number },
    reasons: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scan', ScanSchema);