// // controllers/urlController.js

// const { checkPhishing, isValidUrl } = require("../utils/urlChecks");

// exports.checkUrl = (req, res) => {
//     const { url } = req.body;

//     // 
//     // Validate URL using native JS
//     if (!url || !isValidUrl(url)) {
//         return res.status(400).json({
//             success: false,
//             message: "Invalid URL format."
//         });
//     }

//     // Parse URL
//     const urlObj = new URL(url);
//     const components = {
//         protocol: urlObj.protocol,
//         hostname: urlObj.hostname,
//         pathname: urlObj.pathname,
//         search: urlObj.search
//     };

//     // Check phishing
//     const { isPhishing, reason } = checkPhishing(urlObj);

//     // Send JSON response
//     res.json({
//         success: true,
//         url,
//         components,
//         isPhishing,
//         reason: isPhishing ? reason : "No obvious phishing detected."
//     });

//     let processedUrl = url;
// if (!/^https?:\/\//i.test(url)) {
//     processedUrl = "http://" + url;
// }

// try {
//     const urlObj = new URL(processedUrl);
//     // continue with phishing check...
// } catch {
//     return res.status(400).json({ success: false, message: "Invalid URL format." });
// }

// };


// backend/controllers/urlController.js
const { isPhishingUrl, extractComponents, normalizeUrlInput } = require("../utils/urlChecks");
const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "../logs");
const logFile = path.join(logsDir, "url-log.txt");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// Helper log
function logUrlCheck(url, result) {
  const line = `${new Date().toISOString()} - URL: ${url} - Phishing: ${result.isPhishing} - Reason: ${result.reason}\n`;
  fs.appendFile(logFile, line, err => {
    if (err) console.error("Failed to write URL log:", err);
  });
}

const checkUrl = (req, res) => {
  const { url } = req.body || {};

  if (!url || typeof url !== "string" || !url.trim()) {
    return res.status(400).json({ success: false, message: "Please enter a URL." });
  }

  const normalized = normalizeUrlInput(url);
  const components = extractComponents(normalized);
  if (!components) {
    return res.status(400).json({ success: false, message: "Invalid URL format." });
  }

  const result = isPhishingUrl(normalized);
  logUrlCheck(normalized, result);

  res.json({
    success: true,
    url: normalized,
    components,
    isPhishing: result.isPhishing,
    reason: result.reason
  });
};

module.exports = { checkUrl };
