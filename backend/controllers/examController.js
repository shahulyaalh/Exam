const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
require("pdfkit-table");

const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Arrear = require("../models/Arrear");
const Exam = require("../models/Exam");

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendHallTicket = async (req, res) => {
  try {
    const { studentId } = req.body;
    console.log(`📩 Sending Hall Ticket for Student ID: ${studentId}`);

    if (!studentId) {
      return res.status(400).json({ message: "❌ Student ID is required" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "❌ Student not found" });
    }

    console.log(
      `📌 Student Info: ${student.name}, Dept: ${student.department}, Sem: ${student.semester}`
    );

    let exam = await Exam.findOne({ studentId });

    if (!exam) {
      const subjects = await Subject.find({
        semester: student.semester,
        department: student.department,
      });

      console.log(
        "📚 Subjects fetched for this student:",
        subjects.map((s) => s.subjectName)
      );

      if (!subjects.length) {
        return res
          .status(400)
          .json({ message: "❌ No subjects found for department/semester" });
      }

      exam = new Exam({
        studentId,
        subjects: subjects.map((s) => s._id),
      });

      await exam.save();
      console.log(
        "📘 New Exam record created with subjects:",
        subjects.map((s) => s.subjectName)
      );
    }

    console.log("🧾 Subject IDs in exam record:", exam.subjects);

    const regularSubjects = await Subject.find({
      _id: { $in: exam.subjects },
    }).select("subjectName subjectCode examSchedule");

    console.log(
      "✅ Regular subjects fetched:",
      regularSubjects.map((s) => s.subjectName)
    );

    const arrearSubjects = [];
    const arrearData = await Arrear.findOne({ regNumber: student.regNumber });

    if (arrearData?.arrears?.length) {
      console.log("🧮 Arrear subject codes:", arrearData.arrears);

      const matchedArrears = await Subject.find({
        subjectCode: { $in: arrearData.arrears },
      }).select("subjectName subjectCode examSchedule");

      console.log(
        "✅ Matched arrear subjects:",
        matchedArrears.map((a) => a.subjectName)
      );
      arrearSubjects.push(...matchedArrears);
    }

    if (!regularSubjects.length && !arrearSubjects.length) {
      return res
        .status(404)
        .json({ message: "❌ No subjects (regular or arrear) found" });
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

    const doc = new PDFDocument({ margin: 40 });
    const fileName = `hall_ticket_${studentId}.pdf`;
    const filePath = `./uploads/${fileName}`;
    const fileStream = fs.createWriteStream(filePath);
    doc.pipe(fileStream);

    const imagePath = path.join(__dirname, "../assets/college_navbar.jpeg");
    if (fs.existsSync(imagePath)) {
      doc.image(imagePath, { fit: [500, 100], align: "center" });
    }

    doc.moveDown(1);
    doc.fontSize(18).text(`🎓 Hall Ticket`, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`Name: ${student.name}`);
    doc.text(`Reg. Number: ${student.regNumber}`);
    doc.text(`Department: ${student.department}`);
    doc.text(`Semester: ${student.semester}`);
    doc.moveDown(1);

    const table = {
      headers: ["Subject Name", "Subject Code", "Type", "Exam Schedule"],
      rows: allSubjects.map((sub) => [
        sub.name,
        sub.code,
        sub.type,
        sub.examSchedule,
      ]),
    };

    await doc.table(table, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(12),
      prepareRow: (row, i) => doc.font("Helvetica").fontSize(11),
    });

    doc.moveDown(1);
    doc.text(`Attendance: ${student.attendance}%`);
    doc.text(`Fees Paid: ${student.feesPaid ? "✅ Yes" : "❌ No"}`);
    doc.end();

    fileStream.on("finish", async () => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: student.email,
        subject: "🎟️ Your Hall Ticket",
        text: `Hello ${student.name},\n\nYour hall ticket is ready. Please find the attached PDF.\n\nGood luck!\n- Exam Department`,
        attachments: [{ filename: fileName, path: filePath }],
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${student.email}`);
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
