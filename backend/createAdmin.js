require('dotenv').config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI || "mongodb+srv://np03cs4a230171_db_user:YQjospSepVRo0zHO@cluster0.1vozob6.mongodb.net/?appName=Cluster0");

async function createAdmin() {

  const adminPassword = process.env.ADMIN_PASSWORD || "admin@123";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@system.com";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = new User({
    name: "Admin",
    email: adminEmail,
    password: hashedPassword,
    role: "admin"
  });

  await admin.save();

  console.log("Admin created successfully");
  process.exit();
}

createAdmin();
