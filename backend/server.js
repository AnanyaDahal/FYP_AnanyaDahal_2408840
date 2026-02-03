const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const bcrypt = require('bcryptjs');
const User = require('./models/User'); 
require('dotenv').config();

const app = express(); 

// Middleware
app.use(cors());
app.use(express.json());

// 3. FIX: Restored your actual MongoDB URI
const mongoURI = "mongodb+srv://np03cs4a230171_db_user:YQjospSepVRo0zHO@cluster0.1vozob6.mongodb.net/?appName=Cluster0";

mongoose.connect(mongoURI)
  .then(() => console.log("Connected to MongoDB Atlas (Cloud)"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// 4. SIGNUP ROUTE
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "This email is already in use." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ 
      name, 
      email: email.toLowerCase(), 
      password: hashedPassword 
    });
    
    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Signup Detail Error:", error); // This shows why it failed in your terminal
    res.status(500).json({ message: "Server error during signup" });
  }
});

// 5. LOGIN ROUTE (Restored)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: "Account not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    res.status(200).json({ 
      message: "Login successful", 
      user: { _id: user._id, email: user.email, name: user.name } 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
});

// 6. SCANNING ENGINE ROUTES (Restored)
const urlRoutes = require("./routes/urlRoutes");
const emailRoutes = require("./routes/emailRoutes");
const scanRoutes = require("./routes/Scans"); 

app.use("/api", urlRoutes);
app.use("/api", emailRoutes);
app.use("/api/scans", scanRoutes); 

app.get("/", (req, res) => res.send("Backend server is running correctly!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));