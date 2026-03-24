const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Scan = require("../models/Scans");
const { authenticateToken, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken, requireAdmin);

function mapStatusSummary(summary = {}) {
  return {
    Safe: summary.Safe || 0,
    Suspicious: summary.Suspicious || 0,
    Phishing: (summary.Malicious || 0) + (summary.Phishing || 0),
  };
}

router.get("/stats", async (req, res) => {
  try {
    const [
      totalUsers,
      totalScans,
      threatsDetected,
      totalAdmins,
      recentScans,
      scansByStatus,
      scansByType,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Scan.countDocuments(),
      Scan.countDocuments({ status: { $in: ["Malicious", "Suspicious"] } }),
      User.countDocuments({ role: "admin" }),
      Scan.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .select("value status riskScore createdAt userId type")
        .populate("userId", "name email"),
      Scan.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Scan.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
    ]);

    const statusSummary = scansByStatus.reduce((acc, item) => {
      acc[item._id || "Unknown"] = item.count;
      return acc;
    }, {});

    const typeSummary = scansByType.reduce((acc, item) => {
      acc[item._id || "Unknown"] = item.count;
      return acc;
    }, {});

    res.json({
      totalUsers,
      totalAdmins,
      totalScans,
      threatsDetected,
      statusSummary,
      scanResultSummary: mapStatusSummary(statusSummary),
      typeSummary,
      recentScans,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Failed to fetch admin dashboard stats" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find({})
      .select("name email role createdAt")
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.get("/scans", async (req, res) => {
  try {
    const scans = await Scan.find({})
      .select("value status riskScore createdAt type userId")
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ scans });
  } catch (error) {
    console.error("Admin scans error:", error);
    res.status(500).json({ message: "Failed to fetch scans" });
  }
});

router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot delete another admin account" });
    }

    await Promise.all([
      User.findByIdAndDelete(id),
      Scan.deleteMany({ userId: id }),
    ]);

    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return res.status(500).json({ message: "Failed to delete user" });
  }
});

module.exports = router;