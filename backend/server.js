// const express = require("express");
// const mongoose = require('mongoose');
// const cors = require("cors");
// const path = require("path");
// require('dotenv').config({ path: path.resolve(__dirname, "../.env") });

// const app = express(); 

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Simple request logging for debugging
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} | ${req.method} ${req.url} | body: ${JSON.stringify(req.body)}`);
//   next();
// });

// const mongoURI = process.env.MONGO_URI;

// if (!mongoURI) {
//   console.error("MONGO_URI is not set. Please configure it in .env.");
//   process.exit(1);
// }

// mongoose.connect(mongoURI)
//   .then(() => console.log("Connected to MongoDB Atlas (Cloud)"))
//   .catch(err => console.error("MongoDB Connection Error:", err));

// // 6. AUTH + SCANNING ENGINE ROUTES (Restored)
// const authRoutes = require("./routes/auth");
// const urlRoutes = require("./routes/urlRoutes");
// const emailRoutes = require("./routes/emailRoutes");
// const scanRoutes = require("./routes/Scans"); 
// const adminRoutes = require("./routes/admin");

// app.use("/api/auth", authRoutes);
// app.use("/api", urlRoutes);
// app.use("/api", emailRoutes);
// app.use("/api/scans", scanRoutes); 
// app.use("/api/admin", adminRoutes);

// app.get("/", (req, res) => res.send("Backend server is running correctly!"));

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));




// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = express();

// ===== MIDDLEWARE =====
app.use(cors()); // Allow all origins (adjust in production)
app.use(express.json()); // Parse JSON bodies

// Simple request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.url} | body: ${JSON.stringify(req.body)}`);
  next();
});

// ===== MONGODB CONNECTION =====
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("MONGO_URI is not set. Please configure it in .env.");
  process.exit(1);
}

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ===== ROUTES =====
const authRoutes = require("./routes/auth");          // Authentication routes
const urlRoutes = require("./routes/urlRoutes");      // URL scanning routes
const emailRoutes = require("./routes/emailRoutes");  // Email scanning routes
const scanRoutes = require("./routes/Scans");         // Scans retrieval routes
const adminRoutes = require("./routes/admin");        // Admin routes

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/url", urlRoutes);         // Use /api/url for URL endpoints
app.use("/api/email", emailRoutes);     // Use /api/email for Email endpoints
app.use("/api/scans", scanRoutes);
app.use("/api/admin", adminRoutes);

// ===== DEFAULT ROOT =====
app.get("/", (req, res) => res.send("<h2>Backend server is running correctly!</h2>"));

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));