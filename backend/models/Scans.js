// const mongoose = require('mongoose');

// const ScanSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     type: { type: String, default: 'url' },
//     value: { type: String, required: true }, // The URL checked
//     status: { type: String, required: true }, // Malicious, Suspicious, Safe
//     riskScore: { type: Number },
//     reasons: [{ type: String }],
//     createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Scan', ScanSchema);


const mongoose = require('mongoose');

const ScanSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['url', 'email'], required: true },
    value: { type: String, required: true }, // URL or email text
    status: { type: String, required: true, enum: ['Safe', 'Suspicious', 'Phishing'] },
    riskScore: { type: Number }, // 0-100
    reasons: [{ type: String }], // Optional explanations
    urls: [{ // For emails containing multiple URLs
        url: String,
        isPhishing: Boolean,
        reason: String
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update `updatedAt` on every save
ScanSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Scan', ScanSchema);