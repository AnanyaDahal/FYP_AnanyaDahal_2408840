const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* SIGNUP (USER ONLY) */
router.post("/signup", async (req, res) => {
  console.log("[auth] signup request", { body: req.body });
  try {
    const { name, email, password, role } = req.body; // optional role from frontend

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Force role to "user" 
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "user" // always force "user" role
    });

    await user.save();

    res.status(201).json({ message: "Signup successful" });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
});

/*  LOGIN (USER + ADMIN)  */
router.post("/login", async (req, res) => {
  console.log("[auth] login request", { body: req.body });
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: "JWT secret is not configured" });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Account not found" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Create JWT token with id and role
    const token = jwt.sign(
      { id: user._id, role: user.role },
      jwtSecret,
      { expiresIn: "1d" }
    );

    // Send role in response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role 
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

/* FORGOT PASSWORD (6-DIGIT CODE FLOW) */
router.post("/forgot-password", async (req, res) => {
  console.log("[auth] forgot-password request", { body: req.body });
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "A valid email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "A valid email is required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Do not reveal account existence.
      return res.json({ message: "If this email exists, a reset code has been sent." });
    }

    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Save token + expiry
    user.resetToken = code;
    user.resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save();

    const emailUser = process.env.FORGET_PASSWORD_EMAIL_USER;
    const emailPass = process.env.FORGET_PASSWORD_EMAIL_PASS;
    if (!emailUser || !emailPass) {
      console.warn("WARNING: Email credentials not configured. Code is:", code);
      return res.status(200).json({ 
        message: "If this email exists, a reset code has been sent.",
        note: "SMTP email not configured, using code in console for local testing",
        debugCode: code // send debugCode in development if no env configured so user doesn't get stuck!
      });
    }

    // Email setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.sendMail({
      to: normalizedEmail,
      subject: "Password Reset Verification Code - PhishGuard",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0f1115; color: #ffffff; padding: 30px; border-radius: 15px; border: 1px solid #22d3ee; max-width: 500px; margin: auto;">
          <h2 style="color: #22d3ee; text-align: center; font-style: italic; text-transform: uppercase;">PhishGuard Security</h2>
          <hr style="border-color: #22d3ee; opacity: 0.2;" />
          <p style="font-size: 16px;">We received a request to reset your password. Use the following verification code to proceed:</p>
          <div style="background-color: #1a1e26; border: 1px dashed #22d3ee; padding: 20px; border-radius: 10px; margin: 30px 0; text-align: center;">
            <h1 style="font-size: 36px; color: #22d3ee; letter-spacing: 5px; margin: 0; font-family: monospace;">${code}</h1>
          </div>
          <p style="font-size: 13px; color: #9ca3af;">This code is valid for 10 minutes. If you did not make this request, you can safely ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: "If this email exists, a reset code has been sent." });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* VERIFY CODE */
router.post("/verify-code", async (req, res) => {
  console.log("[auth] verify-code request", { body: req.body });
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: "Email and verification code are required" });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetToken: code,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    res.json({ message: "Verification successful" });
  } catch (error) {
    console.error("Verify code error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* RESET PASSWORD (WITH 6-DIGIT CODE) */
router.post("/reset-password/:token", async (req, res) => {
  console.log("[auth] reset-password request", { params: req.params, body: req.body });
  try {
    const { token } = req.params; // this is the 6-digit code
    const { password, email } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Missing reset token" });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    // Find by token and verify email if provided, to ensure security
    const query = {
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    };
    if (email) {
      query.email = email.toLowerCase();
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clear token fields
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* MIDDLEWARE REQUIREMENT IN THIS FILE FOR PROFILE */
const { authenticateToken } = require("../middleware/authMiddleware");

/* GET PROFILE */
router.get("/profile", authenticateToken, async (req, res) => {
  console.log("[auth] get-profile request", { userId: req.user.id });
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* PROFILE UPDATE (NAME & EMAIL) */
router.put("/profile/update", authenticateToken, async (req, res) => {
  console.log("[auth] profile-update request", { userId: req.user.id, body: req.body });
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Check if email is already in use by another user
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(), 
      _id: { $ne: req.user.id } 
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already taken by another account" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email: email.toLowerCase() },
      { new: true }
    ).select("-password");

    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* PROFILE UPDATE PASSWORD */
router.put("/profile/password", authenticateToken, async (req, res) => {
  console.log("[auth] profile-password request", { userId: req.user.id });
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Old password and new password are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check current password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Password Complexity Rules Check
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&.\-_+#=])[A-Za-z\d@$!%*?&.\-_+#=]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: "New password must include 1 letter, 1 number, 1 special character, and be at least 8 characters long." 
      });
    }

    // Hash and Save
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* PROFILE UPDATE AVATAR */
router.put("/profile/avatar", authenticateToken, async (req, res) => {
  console.log("[auth] profile-avatar request", { userId: req.user.id });
  try {
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({ message: "Avatar base64 data is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar },
      { new: true }
    ).select("-password");

    res.json({ message: "Avatar updated successfully", user });
  } catch (error) {
    console.error("Avatar update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* PROFILE REMOVE AVATAR */
router.delete("/profile/avatar", authenticateToken, async (req, res) => {
  console.log("[auth] profile-avatar-remove request", { userId: req.user.id });
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: null },
      { new: true }
    ).select("-password");

    res.json({ message: "Avatar removed successfully", user });
  } catch (error) {
    console.error("Avatar remove error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;