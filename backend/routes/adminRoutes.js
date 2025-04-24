const express = require("express");
const multer = require("multer");
const path = require("path");
const File = require("../models/File");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const mongoose = require("mongoose");

const router = express.Router();

// File Storage Setup
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });


router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ✅ Check if admin already exists
    let admin = await Admin.findOne({ email });
    if (admin) return res.status(400).json({ message: "Admin already registered" });

    // ✅ Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ Save admin
    admin = new Admin({ name, email, password: hashedPassword });
    await admin.save();

    res.status(201).json({ message: "✅ Admin registered successfully!" });
  } catch (err) {
    res.status(500).json({ message: "❌ Error registering admin", error: err.message });
  }
});

// ✅ Admin Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token, adminId: admin._id, message: "✅ Admin login successful!" });
  } catch (err) {
    res.status(500).json({ message: "❌ Error logging in", error: err.message });
  }
});

// Upload arrear, attendance, or semester details
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "File upload failed" });

  const file = new File({
    fileName: req.file.filename,
    filePath: req.file.path,
    uploadType: req.body.uploadType, // "arrears", "attendance", "semester"
  });

  await file.save();
  res.json({ message: "File uploaded successfully", file });
});

// Fetch all uploaded files
router.get("/uploads", async (req, res) => {
  const files = await File.find();
  res.json(files);
});

router.get("/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Error fetching students", error: err.message });
  }
});

router.patch("/students/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const { attendance, feesPaid } = req.body;

    console.log(`🔄 Updating Student ID: ${studentId}, Attendance: ${attendance}, FeesPaid: ${feesPaid}`);

    // ✅ Validate studentId format
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "❌ Invalid student ID format" });
    }

    // ✅ Find and update student
    const student = await Student.findByIdAndUpdate(
      studentId,
      { attendance, feesPaid },
      { new: true, runValidators: true } // Ensures validation rules are applied
    );

    if (!student) {
      console.log("❌ Student not found!");
      return res.status(404).json({ message: "❌ Student not found" });
    }

    console.log("✅ Student updated successfully:", student);
    res.json({ message: "✅ Student updated successfully", student });

  } catch (err) {
    console.error("❌ Error updating student:", err);
    res.status(500).json({ message: "❌ Internal Server Error", error: err.message });
  }
});


// ✅ Fetch all subjects (for Admin Dashboard)
router.get("/subjects", async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: "❌ Error fetching subjects", error: err.message });
  }
});

// ✅ Update Exam Schedule for a Subject
router.patch("/subjects/:subjectId", async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { examSchedule } = req.body;

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: "❌ Invalid subject ID format" });
    }

    const subject = await Subject.findByIdAndUpdate(
      subjectId,
      { examSchedule },
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({ message: "❌ Subject not found" });
    }

    res.json({ message: "✅ Exam schedule updated!", subject });
  } catch (err) {
    console.error("❌ Error updating exam schedule:", err);
    res.status(500).json({ message: "❌ Internal Server Error", error: err.message });
  }
});

module.exports = router;




