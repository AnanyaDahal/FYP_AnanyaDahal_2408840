// const { detectKeywords, detectFakeSender, extractLinks } = require("../utils/emailChecks");

// exports.analyseEmail = (req, res) => {
//     const { sender, subject, body } = req.body;

//     const keywords = detectKeywords(subject + " " + body);
//     const fakeSender = detectFakeSender(sender);
//     const links = extractLinks(body);

//     let score = 0;
//     if (keywords.length > 0) score += 30;
//     if (fakeSender) score += 30;
//     if (links.length > 0) score += 40;

//     let status = "SAFE";
//     if (score >= 40) status = "SUSPICIOUS";
//     if (score >= 60) status = "PHISHING";

//     res.json({
//         sender,
//         subject,
//         riskScore: score,
//         keywords,
//         suspiciousLinks: links,
//         fakeSender,
//         status
//     });
// };

// controllers/emailController.js

const { analyzeEmail } = require("../utils/emailChecks");

exports.checkEmail = (req, res) => {
    const { emailText } = req.body;

    if (!emailText || emailText.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Email content is required."
        });
    }

    const analysis = analyzeEmail(emailText);

    res.json({
        success: true,
        totalUrls: analysis.totalUrls,
        analysis: analysis.results
    });
};
