const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

mongoose.connect("mongodb://127.0.0.1:27017/YOUR_DB_NAME");

async function createAdmin() {

  const hashedPassword = await bcrypt.hash("admin@123", 10);

  const admin = new User({
    name: "Admin",
    email: "admin@system.com",
    password: hashedPassword,
    role: "admin"
  });

  await admin.save();

  console.log("Admin created successfully");
  process.exit();
}

createAdmin();