const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* ===================== SIGNUP (USER ONLY) ===================== */
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

    // Force role to "user" (do not allow clients to create admins via signup)
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

/* ===================== LOGIN (USER + ADMIN) ===================== */
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
        role: user.role // important for frontend to redirect correctly
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

/* ===================== FORGOT PASSWORD ===================== */
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
      return res.json({ message: "If this email exists, a reset link has been sent" });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");

    // Save token + expiry
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save();

    const emailUser = process.env.FORGET_PASSWORD_EMAIL_USER;
    const emailPass = process.env.FORGET_PASSWORD_EMAIL_PASS;
    if (!emailUser || !emailPass) {
      return res.status(500).json({ message: "Email credentials are not configured" });
    }

    // Email setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetLink = `${frontendBaseUrl}/reset-password/${token}`;

    await transporter.sendMail({
      to: normalizedEmail,
      subject: "Password Reset",
      html: `
        <h3>Password Reset Request</h3>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 10 minutes.</p>
      `,
    });

    res.json({ message: "If this email exists, a reset link has been sent" });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===================== RESET PASSWORD ===================== */
router.post("/reset-password/:token", async (req, res) => {
  console.log("[auth] reset-password request", { params: req.params, body: req.body });
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Missing reset token" });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

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

module.exports = router;