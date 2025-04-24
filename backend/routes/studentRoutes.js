const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Arrear = require("../models/Arrear");
const Exam = require("../models/Exam");

const router = express.Router();

/*  
========================================================
✅ Student Login (Using Registration Number Only)
========================================================
*/
router.post("/login", async (req, res) => {
  try {
    const { regNumber } = req.body;

    if (!regNumber) {
      return res.status(400).json({ message: "❌ Registration number is required!" });
    }

    const student = await Student.findOne({ regNumber });

    if (!student) {
      return res.status(400).json({ message: "❌ Student not found. Check your registration number!" });
    }

    // ✅ Generate JWT Token (if needed)
    const token = jwt.sign({ studentId: student._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      token,
      studentId: student._id,
      name: student.name,
      semester: student.semester,
      department: student.department,
      message: "✅ Login successful!",
    });
  } catch (err) {
    console.error("❌ Error during login:", err);
    res.status(500).json({ message: "❌ Server error", error: err.message });
  }
});

/*  
========================================================
✅ Fetch Student Data along with Subjects & Arrears
========================================================
*/
router.get("/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "❌ Student not found!" });
    }

    // ✅ Fetch Regular Subjects based on Semester & Department
    const regularSubjects = await Subject.find({
      semester: student.semester,
      department: student.department,
    });

    // ✅ Fetch Arrear Subjects from Arrear Collection
    const arrearData = await Arrear.findOne({ regNumber: student.regNumber });
    let arrearSubjects = [];

    if (arrearData && arrearData.arrears.length > 0) {
      arrearSubjects = await Subject.find({ subjectName: { $in: arrearData.arrears } })
        .select("subjectName subjectCode cost examSchedule")
        .lean();
    }

    // ✅ Log to confirm data retrieval
    console.log("📡 Regular Subjects Fetched:", regularSubjects);
    console.log("📡 Arrear Subjects Fetched:", arrearSubjects);

    // ✅ Format Data for Response
    const formattedSubjects = [
      ...regularSubjects.map((subj) => ({
        name: subj.subjectName,
        code: subj.subjectCode,
        type: "regular",
        fees: `₹${subj.cost}`,
        examSchedule: subj.examSchedule || "📅 Not Scheduled",
      })),
      ...arrearSubjects.map((sub) => ({
        name: sub.subjectName,
        code: sub.subjectCode,
        type: "arrear",
        fees: "Paid Separately",
        examSchedule: sub.examSchedule || "📅 Not Scheduled",
      })),
    ];

    // ✅ Fetch Registered Exam Subjects
    const examData = await Exam.findOne({ studentId: student._id });

    res.json({
      ...student.toObject(),
      subjects: formattedSubjects,
      registeredSubjects: examData ? examData.subjects : [],
    });
  } catch (err) {
    console.error("❌ Error fetching student details:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});



/*  
========================================================
✅ Student Registers for Exams
========================================================
*/
router.post("/register-exam", async (req, res) => {
  try {
    const { studentId, subjects } = req.body;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "❌ Student not found" });

    if (student.attendance < 75) return res.status(403).json({ message: "❌ Low attendance" });
    if (!student.feesPaid) return res.status(403).json({ message: "❌ Fees not paid" });

    // ✅ Store Exam Data with Selected Subjects
    const exam = await Exam.findOneAndUpdate(
      { studentId },
      { studentId, subjects, hallTicketGenerated: false },
      { upsert: true, new: true }
    );

    res.json({ message: "✅ Exam registered successfully!", exam });
  } catch (err) {
    console.error("❌ Error registering exam:", err);
    res.status(500).json({ message: "❌ Error registering for exam", error: err.message });
  }
});

/*  
========================================================
✅ Generate Hall Ticket for Student
========================================================
*/
router.get("/hallticket/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "❌ Student not found" });

    const exam = await Exam.findOne({ studentId });
    if (!exam) {
      return res.status(404).json({ message: "❌ No registered exams found for this student." });
    }

    res.json({
      studentName: student.name,
      attendance: student.attendance,
      feesPaid: student.feesPaid,
      subjects: exam.subjects,
      hallTicketGenerated: exam.hallTicketGenerated,
    });
  } catch (err) {
    res.status(500).json({ message: "❌ Error fetching hall ticket data", error: err.message });
  }
});

/*  
========================================================
✅ Admin: Add Subject
========================================================
*/
router.post("/admin/add-subject", async (req, res) => {
  try {
    const { name, code, fees, type, department, semester } = req.body;

    // ✅ Check if subject exists
    const existingSubject = await Subject.findOne({ code });
    if (existingSubject) {
      return res.status(400).json({ message: "❌ Subject code already exists" });
    }

    const newSubject = new Subject({ name, code, fees, type, department, semester });
    await newSubject.save();

    res.status(201).json({ message: "✅ Subject added successfully!" });
  } catch (err) {
    res.status(500).json({ message: "❌ Error adding subject", error: err.message });
  }
});

/*  
========================================================
✅ Fetch All Subjects (For Students)
========================================================
*/
router.get("/subjects", async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: "❌ Error fetching subjects", error: err.message });
  }
});

module.exports = router;
