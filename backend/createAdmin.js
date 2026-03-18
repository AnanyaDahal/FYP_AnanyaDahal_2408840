const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

mongoose.connect("mongodb+srv://np03cs4a230171_db_user:YQjospSepVRo0zHO@cluster0.1vozob6.mongodb.net/?appName=Cluster0");

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
