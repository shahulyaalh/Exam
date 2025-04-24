// controllers/examController.js
const Student = require("../models/Student"); // Assuming your student model is here

const registerForExam = async (req, res) => {
  const { studentId, subjects } = req.body;

  try {
    // Fetch the student from the database
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found!" });
    }

    // Check attendance and fees eligibility
    if (student.attendance < 75) {
      return res.status(400).json({ message: "Attendance is less than 75%" });
    }

    if (!student.feesPaid) {
      return res.status(400).json({ message: "Fees are not paid" });
    }

    // Register the student for exams
    student.examRegistered = true;
    student.examSubjects = subjects; // Array of subject names or IDs
    await student.save();

    res.status(200).json({ message: "Successfully registered for exams" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerForExam };
