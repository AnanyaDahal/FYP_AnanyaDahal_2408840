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
