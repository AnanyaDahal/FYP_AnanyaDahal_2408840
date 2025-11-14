const { detectKeywords, detectFakeSender, extractLinks } = require("../utils/emailChecks");

exports.analyseEmail = (req, res) => {
    const { sender, subject, body } = req.body;

    const keywords = detectKeywords(subject + " " + body);
    const fakeSender = detectFakeSender(sender);
    const links = extractLinks(body);

    let score = 0;
    if (keywords.length > 0) score += 30;
    if (fakeSender) score += 30;
    if (links.length > 0) score += 40;

    let status = "SAFE";
    if (score >= 40) status = "SUSPICIOUS";
    if (score >= 60) status = "PHISHING";

    res.json({
        sender,
        subject,
        riskScore: score,
        keywords,
        suspiciousLinks: links,
        fakeSender,
        status
    });
};
