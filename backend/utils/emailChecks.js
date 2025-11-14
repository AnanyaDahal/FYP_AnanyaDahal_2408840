// utils/emailChecks.js

const { checkPhishing, isValidUrl } = require("./urlChecks");

// Extract URLs from text using regex
function extractUrls(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
}

// Analyze all URLs in the email
function analyzeEmail(emailText) {
    const urls = extractUrls(emailText);
    const results = urls.map(url => {
        if (!isValidUrl(url)) {
            return { url, isPhishing: false, reason: "Invalid URL format" };
        }
        const urlObj = new URL(url);
        const { isPhishing, reason } = checkPhishing(urlObj);
        return { url, isPhishing, reason: isPhishing ? reason : "No obvious phishing detected" };
    });

    return { totalUrls: urls.length, results };
}

module.exports = { extractUrls, analyzeEmail };
