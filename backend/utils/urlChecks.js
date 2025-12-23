// // utils/urlChecks.js

// // Example blacklist
// const blacklist = ["malicious.com", "phishy.net", "fakebank.org"];

// // Check if URL is phishing
// function checkPhishing(urlObj) {
//     let isPhishing = false;
//     let reason = "";

//     if (blacklist.includes(urlObj.hostname)) {
//         isPhishing = true;
//         reason = "URL is blacklisted.";
//     } 
//     else if (urlObj.hostname.split("-").length > 2) {
//         isPhishing = true;
//         reason = "Suspicious domain format.";
//     } 
//     else if (/^\d{1,3}(\.\d{1,3}){3}$/.test(urlObj.hostname)) {
//         isPhishing = true;
//         reason = "IP address used as hostname.";
//     }

//     return { isPhishing, reason };
// }

// // Native URL validation
// function isValidUrl(url) {
//     try {
//         new URL(url); // Will throw if invalid
//         return true;
//     } catch (err) {
//         return false;
//     }
// }

// module.exports = { checkPhishing, isValidUrl };

// backend/utils/urlChecks.js
const fs = require("fs");
const path = require("path");

// Load blacklist from JSON file
const blacklistPath = path.join(__dirname, "../blacklist.json");
let blacklist = [];
try {
  if (fs.existsSync(blacklistPath)) {
    blacklist = JSON.parse(fs.readFileSync(blacklistPath, "utf8")).map(s => s.toLowerCase());
  }
} catch (err) {
  console.error("Error reading blacklist.json:", err);
  blacklist = [];
}

// Common brand list to detect typo-squatting (expandable)
const wellKnownBrands = ["google", "facebook", "paypal", "apple", "amazon", "microsoft"];

// Suspicious domain patterns (regex)
const suspiciousPatterns = [
  /login[-\w]*\./i,
  /secure[-\w]*\./i,
  /\bverify[-\w]*\./i,
  /account[-\w]*\./i,
  /update[-\w]*\./i,
  /-secure\./i,
];

// Suspicious TLDs that are commonly abused (you can extend this list)
const suspiciousTLDs = ["cf", "tk", "ml", "ga", "gq", "xyz", "pw", "top", "site", "online"];

function normalizeUrlInput(raw) {
  // Add protocol if missing to allow URL() to parse
  if (!/^https?:\/\//i.test(raw)) {
    return "http://" + raw.trim();
  }
  return raw.trim();
}

function isIpHostname(hostname) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

function countDots(hostname) {
  return (hostname.match(/\./g) || []).length;
}

function containsBrandTypo(hostnameLower) {
  for (const brand of wellKnownBrands) {
    // detect simple leetspeak: e -> 3, o -> 0
    const leet = brand.replace(/o/g, "0").replace(/e/g, "3").replace(/i/g, "1").replace(/a/g, "4");
    if (hostnameLower.includes(brand) && hostnameLower !== brand && !hostnameLower.endsWith(`.${brand}`)) {
      // e.g. mygoogle-something
      return true;
    }
    if (hostnameLower.includes(leet)) {
      return true;
    }
    // Misspelling heuristic: brand with one char replaced or extra char (naive)
    if (hostnameLower.includes(brand.slice(0, 3)) && hostnameLower.length <= brand.length + 3) {
      // possible near-match (heuristic)
      return true;
    }
  }
  return false;
}

function checkSuspiciousTld(hostname) {
  const parts = hostname.split(".");
  const tld = parts[parts.length - 1];
  return suspiciousTLDs.includes(tld);
}

function checkForRedirectParams(search) {
  // simple rule: presence of redirect or next query param is suspicious
  if (!search) return false;
  return /(\?|&)(redirect|next|url|target)=/i.test(search);
}

/**
 * Main phishing detection function.
 * Input: `urlStr` (string) - raw user input or normalized url string
 * Returns: { isPhishing: boolean, reason: string }
 */
function isPhishingUrl(urlStr) {
  try {
    const normalized = normalizeUrlInput(urlStr);
    const u = new URL(normalized);
    const hostname = u.hostname.toLowerCase();

    // 1. Blacklist exact host or host contains blacklisted domain
    for (const blocked of blacklist) {
      if (hostname === blocked || hostname.endsWith(`.${blocked}`)) {
        return { isPhishing: true, reason: "Hostname is blacklisted." };
      }
    }

    // 2. IP address used as hostname -> suspicious
    if (isIpHostname(hostname)) {
      return { isPhishing: true, reason: "IP address used as hostname." };
    }

    // 3. Excessive subdomains (e.g., a.b.c.d.e.example.com) -> suspicious
    const dots = countDots(hostname);
    if (dots >= 4) {
      return { isPhishing: true, reason: "Excessive subdomains — possible obfuscation." };
    }

    // 4. Suspicious patterns
    for (const pat of suspiciousPatterns) {
      if (pat.test(hostname)) {
        return { isPhishing: true, reason: "Hostname matches suspicious pattern (login/secure/etc.)." };
      }
    }

    // 5. Brand-typo detection (heuristic)
    if (containsBrandTypo(hostname)) {
      return { isPhishing: true, reason: "Hostname contains possible brand-typo or leetspeak." };
    }

    // 6. Suspicious TLDs
    if (checkSuspiciousTld(hostname)) {
      return { isPhishing: true, reason: "Hostname uses a suspicious TLD commonly abused by attackers." };
    }

    // 7. Strange query params like redirect= or next=
    if (checkForRedirectParams(u.search)) {
      return { isPhishing: true, reason: "URL contains redirect-like query parameters." };
    }

    // 8. Hyphen-heavy or long hostnames
    if (hostname.split("-").length > 3 || hostname.length > 60) {
      return { isPhishing: true, reason: "Suspicious domain format (many hyphens or very long hostname)." };
    }

    // If none matched, return safe
    return { isPhishing: false, reason: "No obvious phishing indicators detected." };
  } catch (err) {
    // Parsing failure => treat as invalid elsewhere
    return { isPhishing: false, reason: "Invalid URL parsing." };
  }
}

// Extract components safely (returns null if not parseable)
function extractComponents(urlStr) {
  try {
    const normalized = normalizeUrlInput(urlStr);
    const u = new URL(normalized);
    return {
      protocol: u.protocol,
      hostname: u.hostname,
      pathname: u.pathname,
      search: u.search
    };
  } catch (err) {
    return null;
  }
}

module.exports = { isPhishingUrl, extractComponents, normalizeUrlInput };

