const { spawn } = require("child_process");
const path = require("path");
const Scan = require("../models/Scans");

exports.checkEmailStream = async (req, res) => {
  try {
    const { emailText, userId } = req.body;
    if (!emailText) return res.status(400).json({ message: "Email text required" });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const scriptPath = path.join(__dirname, "../ml/Email_Detection_engine.py");
    // Use "python3" if on Linux/Mac, "python" on Windows
    const pythonProcess = spawn("python", [scriptPath]);

    pythonProcess.stdin.write(emailText);
    pythonProcess.stdin.end();

    let buffer = "";

    pythonProcess.stdout.on("data", async (data) => {
      buffer += data.toString();
      let lines = buffer.split("\n");
      buffer = lines.pop(); // Keep partial line in buffer

      for (let line of lines) {
        if (!line.trim()) continue;
        try {
          const parsedLog = JSON.parse(line);

          if (parsedLog.type === "done") {
            if (userId) {
              const newScan = new Scan({
                userId,
                type: "email",
                value: emailText.substring(0, 100) + "...", // Don't store massive text in 'value'
                status: parsedLog.payload.status,
                riskScore: parsedLog.payload.riskScore,
                urls: parsedLog.payload.linkAnalysis.map(u => ({
                    url: u.url,
                    isPhishing: u.status === "Malicious",
                    reason: u.reasons.join(", ")
                })),
                reasons: parsedLog.payload.reasons
              });
              await newScan.save();
            }
            res.write(`data: ${JSON.stringify(parsedLog)}\n\n`);
            res.end();
          } else {
            res.write(`data: ${JSON.stringify(parsedLog)}\n\n`);
          }
        } catch (err) {
          console.log("Python log noise suppressed:", line);
        }
      }
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error("PYTHON STDERR:", data.toString());
    });

    pythonProcess.on("close", (code) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: "error", message: "Process ended unexpectedly" })}\n\n`);
        res.end();
      }
    });

  } catch (error) {
    console.error("Controller Error:", error);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: "error", message: "Internal Server Error" })}\n\n`);
      res.end();
    }
  }
};