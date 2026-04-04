const { spawn } = require("child_process");
const path = require("path");
const Scan = require("../models/Scans");

exports.checkEmailStream = async (req, res) => {
  try {
    const { emailText, userId } = req.body;

    if (!emailText) {
      return res.status(400).json({ message: "Email text is required" });
    }

    // 1. Setup SSE Headers for Streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // 2. Define path to your Python script
    const scriptPath = path.join(__dirname, "../ml/Email_Detection_engine.py");
    
    // NOTE: If you use a virtual environment, change "python" to the venv path
    // Example: path.join(__dirname, "../ml/venv/Scripts/python.exe")
    const pythonProcess = spawn("python", [scriptPath]);

    // 3. Send email text to Python
    pythonProcess.stdin.write(emailText);
    pythonProcess.stdin.end();

    let buffer = ""; 

    // 4. Listen to Python's live output
    pythonProcess.stdout.on("data", async (data) => {
      buffer += data.toString();
      
      // Split by newlines to handle multiple logs arriving at once
      let lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete chunks in the buffer

      for (let line of lines) {
        if (line.trim() === "") continue;

        try {
          const parsedLog = JSON.parse(line);

          if (parsedLog.type === "progress") {
             // Send live progress directly to React
             res.write(`data: ${JSON.stringify(parsedLog)}\n\n`);
          } 
          else if (parsedLog.type === "done") {
             // Save to database before closing
             if (userId) {
                try {
                  const newScan = new Scan({
                    userId,
                    type: "email",
                    value: emailText,
                    status: parsedLog.payload.status,
                    riskScore: parsedLog.payload.riskScore,
                    urls: parsedLog.payload.linkAnalysis,
                    reasons: parsedLog.payload.reasons
                  });
                  await newScan.save();
                } catch (dbErr) {
                  console.error("DB Save Error:", dbErr);
                }
             }

             // Send final result and close connection
             res.write(`data: ${JSON.stringify(parsedLog)}\n\n`);
             res.end();
          } 
          else if (parsedLog.type === "error") {
             res.write(`data: ${JSON.stringify(parsedLog)}\n\n`);
             res.end();
          }
        } catch (err) {
          // Ignore non-JSON output (like Python warnings)
        }
      }
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python Error: ${data}`);
    });

    pythonProcess.on("close", (code) => {
      if (!res.writableEnded && code !== 0) {
        res.write(`data: ${JSON.stringify({ type: "error", message: "Python engine crashed." })}\n\n`);
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