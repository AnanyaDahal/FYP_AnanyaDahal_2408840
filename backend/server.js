
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = express();

// MIDDLEWARE
app.use(cors()); // Allow all origins (adjust in production)
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies up to 10mb for base64 file uploads
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Simple request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
  next();
});

//MONGODB CONNECTION 
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("MONGO_URI is not set. Please configure it in .env.");
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// ROUTES 
const authRoutes = require("./routes/auth");          // Authentication routes
const urlRoutes = require("./routes/urlRoutes");      // URL scanning routes
const emailRoutes = require("./routes/emailRoutes");  // Email scanning routes
const scanRoutes = require("./routes/Scans");         // Scans retrieval routes
const adminRoutes = require("./routes/admin");        // Admin routes
const attachmentRoutes = require("./routes/attachmentRoutes"); // Attachment scanning routes

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/url", urlRoutes);         // Use /api/url for URL endpoints
app.use("/api/email", emailRoutes);     // Use /api/email for Email endpoints
app.use("/api/scans", scanRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attachment", attachmentRoutes); // Mount attachment endpoints

// DEFAULT ROOT 
app.get("/", (req, res) => res.send("<h2>Backend server is running correctly!</h2>"));

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));