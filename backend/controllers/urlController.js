
const { spawn } = require("child_process");
const path = require("path");
const validUrl = require("valid-url");
const Scan = require("../models/Scans");

const runUrlAnalysis = ({ url, userId, onProgress = () => {} }) => {
    return new Promise((resolve, reject) => {
        if (!url || !userId) return reject(new Error("Missing URL or User ID"));
        if (!validUrl.isUri(url)) return reject(new Error("Invalid URL format"));

        onProgress({ stage: "parse", message: "Validating URL format." });

        const scriptPath = path.join(__dirname, "../ml/URL_Detection_engine.py");
        const pythonPath = process.env.PYTHON_PATH || "python";

        onProgress({ stage: "ml", message: "Running URL detection engine." });
        const pythonProcess = spawn(pythonPath, [scriptPath, url]);

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
                return reject(new Error("ML Engine Crash"));
            }

            try {
                // BUG FIX: Use regex to find the JSON block. 
                // This prevents crashes if Python prints library warnings (like sklearn versions).
                const jsonMatch = pythonData.match(/\{.*\}/s);
                if (!jsonMatch) throw new Error("No valid JSON found in output");
                
                const response = JSON.parse(jsonMatch[0]);

                // BUG FIX: Handle the 'payload' wrapper you added in the Python Script
                const analysis = response.type === "done" ? response.payload : response;

                if (!analysis || !analysis.status) {
                    throw new Error("Analysis results missing in engine output");
                }

                onProgress({ stage: "persist", message: "Saving URL scan to database." });
                const newScan = new Scan({
                    userId,
                    type: "url",
                    value: url,
                    status: analysis.status,
                    riskScore: analysis.riskScore,
                    reasons: analysis.reasons,
                });

                await newScan.save();

                // Final payload for the frontend
                const payload = {
                    success: true,
                    status: analysis.status,
                    riskScore: analysis.riskScore,
                    reasons: analysis.reasons,
                };

                onProgress({ stage: "done", message: "URL analysis complete." });
                resolve(payload);
            } catch (err) {
                console.error("JSON Parse Error. Raw Data:", `"${pythonData}"`, err);
                reject(new Error("Engine response unreadable"));
            }
        });
    });
};

const checkUrl = async (req, res) => {
    console.log("[url] analyze request", { body: req.body });
    const { url, userId } = req.body || {};

    try {
        const payload = await runUrlAnalysis({ url, userId });
        res.json(payload);
    } catch (err) {
        const message = err.message || "ML Engine Crash";
        const statusCode = message.includes("No URL") || message.includes("No userId") || message.includes("Invalid URL")
            ? 400
            : 500;
        res.status(statusCode).json({ success: false, message });
    }
};

const checkUrlStream = async (req, res) => {
    const { url, userId } = req.body || {};

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") {
        res.flushHeaders();
    }

    const send = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
        send({ type: "progress", stage: "start", message: "Starting URL analysis." });
        const payload = await runUrlAnalysis({
            url,
            userId,
            onProgress: (evt) => send({ type: "progress", ...evt }),
        });

        send({ type: "done", payload });
        res.end();
    } catch (err) {
        send({ type: "error", message: err.message || "ML Engine Crash" });
        res.end();
    }
};

module.exports = { checkUrl, checkUrlStream };