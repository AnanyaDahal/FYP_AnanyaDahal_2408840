const { validateURL, checkHTTPS, checkLength, detectSuspiciousChars } = require("../utils/urlChecks");

exports.analyseURL = (req, res) => {
    const { url } = req.body;

    if (!url) return res.json({ error: "URL is required" });

    const result = {
        valid: validateURL(url),
        https: checkHTTPS(url),
        length: checkLength(url),
        suspiciousChars: detectSuspiciousChars(url),
    };

    let score = 0;
    if (!result.https) score += 20;
    if (result.length === "long") score += 20;
    if (result.suspiciousChars.length > 0) score += 40;

    let status = "SAFE";
    if (score >= 40) status = "SUSPICIOUS";
    if (score >= 60) status = "PHISHING";

    res.json({
        url,
        analysis: result,
        score,
        status
    });
};
