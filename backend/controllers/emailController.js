
// const { analyzeEmail } = require("../utils/emailChecks");
// const fs = require("fs");
// const path = require("path");

// const logsDir = path.join(__dirname, "../logs");
// const logFile = path.join(logsDir, "email-log.txt");
// if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// function logEmailCheck(emailText, result) {
//   const line = `${new Date().toISOString()} - email-length: ${emailText.length} - totalUrls: ${result.totalUrls}\n`;
//   fs.appendFile(logFile, line, err => {
//     if (err) console.error("Failed to write email log:", err);
//   });
// }

// const checkEmail = (req, res) => {
//   console.log("[email] check-email request", { body: req.body });
//   const { emailText } = req.body || {};

//   if (!emailText || typeof emailText !== "string" || !emailText.trim()) {
//     return res.status(400).json({ success: false, message: "Please enter email text." });
//   }

//   const analysis = analyzeEmail(emailText);
//   console.log("[email] analysis result", { totalUrls: analysis.totalUrls });
//   logEmailCheck(emailText, analysis);

//   res.json({
//     success: true,
//     totalUrls: analysis.totalUrls,
//     analysis: analysis.analysis
//   });
// };

// module.exports = { checkEmail };




const { spawn } = require("child_process");
const path = require("path");
const Scan = require("../models/Scans");
const { analyzeEmail } = require("../utils/emailChecks");

const checkEmail = async (req, res) => {
    try {
        const { emailText, userId } = req.body;

        if (!emailText || typeof emailText !== "string" || !emailText.trim()) {
            return res.status(400).json({ success: false, message: "No email text provided." });
        }

        // Step 1: URL-level analysis
        const urlAnalysis = analyzeEmail(emailText);

        // Step 2: Call ML Python script
        const scriptPath = path.join(__dirname, "../ml/Email_Detection_engine.py");

        const pythonPath = process.env.PYTHON_PATH || "python";
        const pythonProcess = spawn(pythonPath, [scriptPath]);

        let pythonData = "";
        let pythonError = "";

        pythonProcess.stdout.on("data", (data) => pythonData += data.toString());
        pythonProcess.stderr.on("data", (data) => pythonError += data.toString());

        // send email text via stdin to avoid argv quoting issues
        try {
            pythonProcess.stdin.write(emailText);
            pythonProcess.stdin.end();
        } catch (e) {
            console.error('Failed to write to Python stdin', e);
        }

        // Timeout after 15 seconds
        const timeout = setTimeout(() => {
            pythonProcess.kill();
        }, 15000);

        pythonProcess.on("close", async (code) => {
            clearTimeout(timeout);

            if (pythonError) {
                console.error("Python Error:", pythonError);
                return res.status(500).json({ success: false, message: "ML processing failed.", details: pythonError });
            }

            let analysis;
            try {
                analysis = JSON.parse(pythonData.trim());
            } catch (err) {
                console.error("JSON parse error:", err, "Python output:", pythonData);
                return res.status(500).json({ success: false, message: "Invalid ML output.", details: pythonData });
            }

            // Step 3: Save scan in MongoDB
            const newScan = new Scan({
                userId,
                type: "email",
                value: emailText,
                status: analysis.status,
                riskScore: analysis.riskScore,
                urls: urlAnalysis.analysis,
                reasons: urlAnalysis.analysis
                    .filter(u => u.isPhishing)
                    .map(u => `Phishing URL detected: ${u.url}`)
            });

            await newScan.save();

            // Step 4: Return combined result (keys expected by frontend)
            res.json({
                success: true,
                status: analysis.status,
                riskScore: analysis.riskScore,
                totalUrls: urlAnalysis.totalUrls,
                analysis: urlAnalysis.analysis
            });
        });

    } catch (err) {
        console.error("checkEmail error:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

module.exports = { checkEmail };