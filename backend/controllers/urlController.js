// controllers/urlController.js

const { checkPhishing, isValidUrl } = require("../utils/urlChecks");

exports.checkUrl = (req, res) => {
    const { url } = req.body;

    // Validate URL using native JS
    if (!url || !isValidUrl(url)) {
        return res.status(400).json({
            success: false,
            message: "Invalid URL format."
        });
    }

    // Parse URL
    const urlObj = new URL(url);
    const components = {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
        search: urlObj.search
    };

    // Check phishing
    const { isPhishing, reason } = checkPhishing(urlObj);

    // Send JSON response
    res.json({
        success: true,
        url,
        components,
        isPhishing,
        reason: isPhishing ? reason : "No obvious phishing detected."
    });
};
