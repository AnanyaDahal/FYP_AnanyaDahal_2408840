const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const path = require("path");
require('dotenv').config({ path: path.resolve(__dirname, "../.env") });

const app = express(); 

// Middleware
app.use(cors());
app.use(express.json());

// Simple request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.url} | body: ${JSON.stringify(req.body)}`);
  next();
});

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("MONGO_URI is not set. Please configure it in .env.");
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => console.log("Connected to MongoDB Atlas (Cloud)"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// 6. AUTH + SCANNING ENGINE ROUTES (Restored)
const authRoutes = require("./routes/auth");
const urlRoutes = require("./routes/urlRoutes");
const emailRoutes = require("./routes/emailRoutes");
const scanRoutes = require("./routes/Scans"); 
const adminRoutes = require("./routes/admin");

app.use("/api/auth", authRoutes);
app.use("/api", urlRoutes);
app.use("/api", emailRoutes);
app.use("/api/scans", scanRoutes); 
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => res.send("Backend server is running correctly!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));