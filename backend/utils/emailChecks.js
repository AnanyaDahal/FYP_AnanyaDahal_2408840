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
