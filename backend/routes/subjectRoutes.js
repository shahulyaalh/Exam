const express = require("express");
const Subject = require("../models/Subject"); // Ensure this model exists
const router = express.Router();

// Admin: Add Subject
router.post("/admin/add-subject", async (req, res) => {
  try {
    const { name, code, fees, type, examSchedule } = req.body; // Get examSchedule from request

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ code });
    if (existingSubject) {
      return res
        .status(400)
        .json({ message: "❌ Subject code already exists!" });
    }

    // Create and save the subject with exam schedule
    const newSubject = new Subject({ name, code, fees, type, examSchedule });
    await newSubject.save();

    res
      .status(201)
      .json({
        message: "✅ Subject added successfully with exam schedule!",
        subject: newSubject,
      });
  } catch (err) {
    console.error("Error adding subject:", err);
    res.status(500).json({ message: "❌ Server error", error: err.message });
  }
});

// Fetch All Subjects
router.get("/admin/subjects", async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (err) {
    console.error("Error fetching subjects:", err);
    res.status(500).json({ message: "❌ Server error" });
  }
});

// Fetch Subjects for Exams
router.get("/api/exams/subjects", async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (err) {
    console.error("Error fetching subjects for exams:", err);
    res.status(500).json({ message: "❌ Server error" });
  }
});

module.exports = router;
