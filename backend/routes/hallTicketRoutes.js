const express = require("express");
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Exam = require("../models/Exam");
const Subject = require("../models/Subject");
const Arrear = require("../models/Arrear");

const router = express.Router();



// ✅ Fetch Hall Ticket Data
router.get("/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "❌ Invalid student ID format" });
    }

    // ✅ Check if student exists
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "❌ Student not found!" });

    console.log(`📡 Fetching Hall Ticket for Student: ${student.name} (Reg No: ${student.regNumber})`);

    // ✅ Fetch Regular Subjects based on Semester & Department with Exam Schedule
    const regularSubjects = await Subject.find({
      semester: student.semester,
      department: student.department,
    }).select("subjectName subjectCode examSchedule");

    console.log("✅ Regular Subjects Fetched:", regularSubjects);

    // ✅ Fetch Arrear Subjects from Arrear Collection
    const arrearData = await Arrear.findOne({ regNumber: student.regNumber });

    let arrearSubjects = [];

    if (arrearData && arrearData.arrears.length > 0) {
      console.log("✅ Fetching Arrear Subjects for:", arrearData.arrears);

      // ✅ Ensure arrear subjects exist in `subjects` collection
      arrearSubjects = await Subject.find({
        subjectCode: { $in: arrearData.arrears },
      }).select("subjectName subjectCode examSchedule");

      if (arrearSubjects.length === 0) {
        console.log("⚠️ No matching arrear subjects found in Subject collection!");
      }
    } else {
      console.log("⚠️ No Arrear Subjects Found for Student!");
    }

    console.log("✅ Arrear Subjects Fetched:", arrearSubjects);

    // ✅ Format Data for Response
    const formattedSubjects = [
      ...regularSubjects.map((sub) => ({
        name: sub.subjectName,
        type: "regular",
        examSchedule: sub.examSchedule || "📅 Not Scheduled",
      })),
      ...arrearSubjects.map((sub) => ({
        name: sub.subjectName,
        type: "arrear",
        examSchedule: sub.examSchedule || "📅 Not Scheduled",
      })),
    ];

    res.status(200).json({
      studentName: student.name,
      attendance: student.attendance,
      feesPaid: student.feesPaid,
      subjects: formattedSubjects,
    });
  } catch (error) {
    console.error("❌ Error fetching hall ticket:", error);
    res.status(500).json({ message: "❌ Error fetching hall ticket" });
  }
});


module.exports = router;





