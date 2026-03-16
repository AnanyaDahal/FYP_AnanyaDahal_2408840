// const express = require("express");
// const router = express.Router();
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// /* ===================== SIGNUP (USER ONLY) ===================== */
// router.post("/signup", async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     const existingUser = await User.findOne({ email: email.toLowerCase() });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = new User({
//       name,
//       email: email.toLowerCase(),
//       password: hashedPassword,
//       role: "user" // 🔒 FORCE USER ROLE
//     });

//     await user.save();
//     res.status(201).json({ message: "Signup successful" });

//   } catch (error) {
//     res.status(500).json({ message: "Server error during signup" });
//   }
// });

// /* ===================== LOGIN (USER + ADMIN) ===================== */
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email: email.toLowerCase() });
//     if (!user) {
//       return res.status(400).json({ message: "Account not found" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: "Incorrect password" });
//     }

//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       "SECRET_KEY",
//       { expiresIn: "1d" }
//     );

//     res.status(200).json({
//       message: "Login successful",
//       token,
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       }
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Server error during login" });
//   }
// });

// module.exports = router;





const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* ===================== SIGNUP (USER ONLY) ===================== */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body; // optional role from frontend

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
      role: "user" // 🔒 always force "user" role
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
  try {
    const { email, password } = req.body;

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
      "SECRET_KEY",
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

module.exports = router;