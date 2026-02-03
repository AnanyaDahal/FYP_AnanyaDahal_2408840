const { spawn } = require("child_process");
const path = require("path");
const Scan = require("../models/Scans");

const checkUrl = async (req, res) => {
    const { url, userId } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, message: "No URL provided" });
    }

    // Path to your Python script
    const scriptPath = path.join(__dirname, "../ml/URL_Detection_engine.py");
    
    // Start Python process
    const pythonProcess = spawn("python", [scriptPath, url]);

    let pythonData = "";
    let pythonError = "";

    pythonProcess.stdout.on("data", (data) => {
        pythonData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
        pythonError += data.toString();
    });

    pythonProcess.on("close", async (code) => {
        if (code !== 0) {
            console.error("Python Error:", pythonError);
            return res.status(500).json({ success: false, message: "ML Engine Crash" });
        }

        try {
            // FIX: Clean the data string to remove hidden newlines or spaces
            const cleanData = pythonData.trim();
            const analysis = JSON.parse(cleanData);

            // Save to MongoDB Atlas
            const newScan = new Scan({
                userId: userId,
                type: "url",
                value: url,
                status: analysis.status,
                riskScore: analysis.riskScore,
                reasons: analysis.reasons
            });

            await newScan.save();

            // Send clean response to Frontend
            res.json({
                success: true,
                status: analysis.status,
                riskScore: analysis.riskScore,
                reasons: analysis.reasons
            });

        } catch (err) {
            console.error("JSON Parse Error. Raw Data:", `"${pythonData}"`);
            res.status(500).json({ success: false, message: "Engine response unreadable" });
        }
    });
};

module.exports = { checkUrl };