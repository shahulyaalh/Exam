const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const Exam = require("../models/Exam");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Arrear = require("../models/Arrear");
const fs = require("fs");
require("dotenv").config();

// ✅ Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Controller: Send Hall Ticket
exports.sendHallTicket = async (req, res) => {
  try {
    const { studentId } = req.body;
    console.log(`📩 Request to send Hall Ticket for Student ID: ${studentId}`);

    if (!studentId) {
      return res.status(400).json({ message: "❌ Student ID is required" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "❌ Student not found" });
    }

    let exam = await Exam.findOne({ studentId });
    if (!exam) {
      const subjects = await Subject.find({
        semester: student.semester,
        department: student.department,
      });

      if (!subjects.length) {
        return res
          .status(400)
          .json({ message: "❌ No subjects found for this student" });
      }

      exam = new Exam({
        studentId,
        subjects: subjects.map((sub) => sub._id),
      });
      await exam.save();
    }

    const regularSubjects = await Subject.find({
      _id: { $in: exam.subjects },
    }).select("subjectName subjectCode examSchedule");

    const arrearSubjects = [];
    const arrearData = await Arrear.findOne({ regNumber: student.regNumber });

    if (arrearData?.arrears?.length) {
      const matchedArrears = await Subject.find({
        subjectCode: { $in: arrearData.arrears },
      }).select("subjectName subjectCode examSchedule");
      arrearSubjects.push(...matchedArrears);
    }

    if (!regularSubjects.length && !arrearSubjects.length) {
      return res
        .status(404)
        .json({ message: "❌ No subjects found for this student" });
    }

    const allSubjects = [
      ...regularSubjects.map((sub) => ({
        name: sub.subjectName,
        code: sub.subjectCode,
        examSchedule: sub.examSchedule || "📅 Not Scheduled",
        type: "✅ Regular",
      })),
      ...arrearSubjects.map((sub) => ({
        name: sub.subjectName,
        code: sub.subjectCode,
        examSchedule: sub.examSchedule || "📅 Not Scheduled",
        type: "❌ Arrear",
      })),
    ];

    const doc = new PDFDocument();
    const fileName = `hall_ticket_${studentId}.pdf`;
    const filePath = `./uploads/${fileName}`;
    const fileStream = fs.createWriteStream(filePath);
    doc.pipe(fileStream);

    doc
      .fontSize(16)
      .text(`Hall Ticket for ${student.name}`, { align: "center" });
    doc.moveDown(2);
    doc.fontSize(12).text("Subjects to Write:");
    allSubjects.forEach((sub) => {
      doc.text(`${sub.name} (${sub.code}) [${sub.type}] - ${sub.examSchedule}`);
    });
    doc.moveDown(1);
    doc.text(`Attendance: ${student.attendance}%`, { continued: true });
    doc.text(`   Fees Paid: ${student.feesPaid ? "✅ Yes" : "❌ No"}`);
    doc.end();

    fileStream.on("finish", async () => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: student.email,
        subject: "🎟️ Your Hall Ticket",
        text: `Hello ${student.name},\n\nYour hall ticket is ready. Please find the attached PDF.\n\nGood luck!\nExam Department`,
        attachments: [{ filename: fileName, path: filePath }],
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to: ${student.email}`);
        res.json({ message: "📩 Hall Ticket sent successfully!" });
      } catch (error) {
        console.error("❌ Email sending failed:", error);
        res
          .status(500)
          .json({ message: "❌ Failed to send email", error: error.message });
      } finally {
        fs.unlink(filePath, (err) => {
          if (err) console.error("❌ Failed to delete PDF:", err);
        });
      }
    });
  } catch (error) {
    console.error("❌ Unexpected Error:", error);
    res
      .status(500)
      .json({ message: "❌ Error sending Hall Ticket", error: error.message });
  }
};
