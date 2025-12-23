

// const { analyzeEmail } = require("../utils/emailChecks");

// exports.checkEmail = (req, res) => {
//     const { emailText } = req.body;

//     if (!emailText || emailText.trim() === "") {
//         return res.status(400).json({
//             success: false,
//             message: "Email content is required."
//         });
//     }

//     const analysis = analyzeEmail(emailText);

//     res.json({
//         success: true,
//         totalUrls: analysis.totalUrls,
//         analysis: analysis.results
//     });
// };


// backend/controllers/emailController.js
const { analyzeEmail } = require("../utils/emailChecks");
const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "../logs");
const logFile = path.join(logsDir, "email-log.txt");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

function logEmailCheck(emailText, result) {
  const line = `${new Date().toISOString()} - email-length: ${emailText.length} - totalUrls: ${result.totalUrls}\n`;
  fs.appendFile(logFile, line, err => {
    if (err) console.error("Failed to write email log:", err);
  });
}

const checkEmail = (req, res) => {
  const { emailText } = req.body || {};

  if (!emailText || typeof emailText !== "string" || !emailText.trim()) {
    return res.status(400).json({ success: false, message: "Please enter email text." });
  }

  const analysis = analyzeEmail(emailText);
  logEmailCheck(emailText, analysis);

  res.json({
    success: true,
    totalUrls: analysis.totalUrls,
    analysis: analysis.analysis
  });
};

module.exports = { checkEmail };
