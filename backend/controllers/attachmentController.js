const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const Scan = require("../models/Scans");

exports.scanAttachmentStream = async (req, res) => {
  try {
    const { name, data, userId } = req.body;

    if (!name || !data || !userId) {
      return res.status(400).json({ message: "File name, base64 data, and userId are required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const send = (evt) => {
      res.write(`data: ${JSON.stringify(evt)}\n\n`);
    };

    send({ type: "progress", stage: "start", message: "Receiving attachment payload." });

    // Extract base64 clean data
    const matches = data.match(/^data:(.+);base64,(.+)$/);
    let base64Clean = data;
    if (matches && matches.length === 3) {
      base64Clean = matches[2];
    }

    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate safe temp filename
    const sanitizedFilename = name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const tempFilePath = path.join(tempDir, `scan_${Date.now()}_${sanitizedFilename}`);

    send({ type: "progress", stage: "write", message: "Decrypting attachment stream onto sandbox." });
    fs.writeFileSync(tempFilePath, Buffer.from(base64Clean, "base64"));

    send({ type: "progress", stage: "ml", message: "Running threat intelligence heuristic scans." });

    const scriptPath = path.join(__dirname, "../ml/Attachment_Detection_engine.py");
    const pythonProcess = spawn("python", [scriptPath, tempFilePath]);

    let outputData = "";
    pythonProcess.stdout.on("data", (chunk) => {
      outputData += chunk.toString();
    });

    pythonProcess.on("close", async (code) => {
      // Clean up temp file
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (err) {
        console.error("Temp file cleanup failure:", err);
      }

      if (code !== 0) {
        send({ type: "error", message: "Threat Intelligence Engine Crash" });
        return res.end();
      }

      try {
        const jsonMatch = outputData.match(/\{.*\}/s);
        if (!jsonMatch) throw new Error("Unreadable engine response");

        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed.type === "done") {
          const payload = parsed.payload;

          // Save to database as attachment scan!
          const newScan = new Scan({
            userId,
            type: "attachment",
            value: `${name} (SHA-256: ${payload.fileHash.substring(0, 10)}...)`,
            status: payload.status,
            riskScore: payload.riskScore,
            reasons: payload.reasons,
          });

          await newScan.save();

          send({ type: "done", payload });
        } else {
          send({ type: "error", message: parsed.message || "Threat scan failed" });
        }
      } catch (err) {
        console.error("JSON parse failure in attachment scan:", outputData, err);
        send({ type: "error", message: "Threat signature response unreadable" });
      }
      res.end();
    });

  } catch (error) {
    console.error("Attachment controller failure:", error);
    res.write(`data: ${JSON.stringify({ type: "error", message: "Scan controller crashed" })}\n\n`);
    res.end();
  }
};
