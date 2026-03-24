const path = require("path");
require('dotenv').config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not set in .env");
}

mongoose.connect(process.env.MONGO_URI);

async function createAdmin() {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminPassword || !adminEmail) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    }

    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = new User({
      name: "Admin",
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      role: "admin"
    });

    await admin.save();

    console.log("Admin created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Failed to create admin:", error.message);
    process.exit(1);
  }
}

createAdmin();
