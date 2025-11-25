// // utils/emailChecks.js

// const { checkPhishing, isValidUrl } = require("./urlChecks");

// // Extract URLs from text using regex
// function extractUrls(text) {
//     const urlRegex = /(https?:\/\/[^\s]+)/g;
//     return text.match(urlRegex) || [];
// }

// // Analyze all URLs in the email
// function analyzeEmail(emailText) {
//     const urls = extractUrls(emailText);
//     const results = urls.map(url => {
//         if (!isValidUrl(url)) {
//             return { url, isPhishing: false, reason: "Invalid URL format" };
//         }
//         const urlObj = new URL(url);
//         const { isPhishing, reason } = checkPhishing(urlObj);
//         return { url, isPhishing, reason: isPhishing ? reason : "No obvious phishing detected" };
//     });

//     return { totalUrls: urls.length, results };
// }

// module.exports = { extractUrls, analyzeEmail };


// backend/utils/emailChecks.js
const { isPhishingUrl, normalizeUrlInput } = require("./urlChecks");

// Regex to extract http/https URLs
const urlRegex = /https?:\/\/[^\s"'>)]+/gi;

// Also capture www.example.com (no protocol)
const wwwRegex = /\bwww\.[^\s"'>)]+/gi;

function extractUrls(text) {
  if (!text || typeof text !== "string") return [];
  const urls = [];
  const found = text.match(urlRegex) || [];
  const foundWww = text.match(wwwRegex) || [];

  // Normalize and deduplicate
  for (const u of found) urls.push(u.trim());
  for (const w of foundWww) urls.push(normalizeUrlInput(w.trim()));
  return Array.from(new Set(urls));
}

function analyzeEmail(emailText) {
  const urls = extractUrls(emailText);
  const results = urls.map(url => {
    const detection = isPhishingUrl(url);
    return {
      url,
      isPhishing: detection.isPhishing,
      reason: detection.reason
    };
  });

  return { totalUrls: urls.length, analysis: results };
}

module.exports = { extractUrls, analyzeEmail };
