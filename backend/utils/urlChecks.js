// utils/urlChecks.js

// Example blacklist
const blacklist = ["malicious.com", "phishy.net", "fakebank.org"];

// Check if URL is phishing
function checkPhishing(urlObj) {
    let isPhishing = false;
    let reason = "";

    if (blacklist.includes(urlObj.hostname)) {
        isPhishing = true;
        reason = "URL is blacklisted.";
    } 
    else if (urlObj.hostname.split("-").length > 2) {
        isPhishing = true;
        reason = "Suspicious domain format.";
    } 
    else if (/^\d{1,3}(\.\d{1,3}){3}$/.test(urlObj.hostname)) {
        isPhishing = true;
        reason = "IP address used as hostname.";
    }

    return { isPhishing, reason };
}

// Native URL validation
function isValidUrl(url) {
    try {
        new URL(url); // Will throw if invalid
        return true;
    } catch (err) {
        return false;
    }
}

module.exports = { checkPhishing, isValidUrl };
