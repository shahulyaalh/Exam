const express = require("express");
const XLSX = require("xlsx");
const fs = require("fs-extra");
const path = require("path");
const upload = require("../middleware/upload");
const Student = require("../models/Student");
const Arrear = require("../models/Arrear");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");

const router = express.Router();

// 🔧 Helper: Normalize keys
const normalizeKeys = (row) => {
  const normalized = {};
  for (const key in row) {
    normalized[key.trim().toLowerCase()] = row[key];
  }
  return normalized;
};

// ✅ Upload & Process CSV/XLSX File
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filePath = req.file.path;
  const fileType = path.extname(req.file.originalname).toLowerCase();
  const validExtensions = [".xlsx", ".xls", ".csv"];

  if (!validExtensions.includes(fileType)) {
    fs.removeSync(filePath);
    return res.status(400).json({ message: "Unsupported file type" });
  }

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const data = rawData.map(normalizeKeys);

    const uploadType = req.body.uploadType?.trim().toLowerCase();
    console.log(`📂 Uploaded: ${req.file.originalname}`);
    console.log(`📊 Sheet: ${sheetName}`);
    console.log(`📌 Upload Type: ${uploadType}`);
    console.log(`📄 First 5 Rows:`, data.slice(0, 5));

    let processed = false;
    let result = {};

    if (uploadType === "student_list") {
      console.log("📌 Processing Student List...");
      result = await processStudentData(data);
      processed = true;
    } else if (uploadType === "arrear_list") {
      console.log("📌 Processing Arrear List...");
      result = await processArrearData(data);
      processed = true;
    } else if (uploadType === "attendance") {
      console.log("📌 Processing Attendance & Fees...");
      result = await processAttendanceAndFeesData(data);
      processed = true;
    } else if (uploadType === "subjectname") {
      console.log("📌 Processing Subject List...");
      result = await processSubjectData(data);
      processed = true;
    }

    if (!processed) {
      fs.removeSync(filePath);
      return res.status(400).json({ message: "Invalid upload type" });
    }

    fs.removeSync(filePath);
    res.status(200).json({
      message: "✅ File processed successfully!",
      summary: result,
    });
  } catch (error) {
    if (fs.existsSync(filePath)) fs.removeSync(filePath);
    console.error("❌ Error processing file:", error);
    res
      .status(500)
      .json({ message: "Error processing file", error: error.message });
  }
});

// ✅ Process Student Data
const processStudentData = async (data) => {
  let inserted = 0,
    skipped = 0;
  for (const row of data) {
    const reg = row["reg no"];
    const email = row["email"];
    if (!reg || !row["name"]) continue;

    const existingStudent = await Student.findOne({
      $or: [{ regNumber: reg }, { email }],
    });

    if (!existingStudent) {
      await Student.create({
        regNumber: reg,
        name: row["name"],
        email,
        department: row["dep"],
        semester: row["sem"],
        attendance: 0,
        feesPaid: false,
        arrears: [],
        createdAt: new Date(),
      });
      inserted++;
    } else {
      skipped++;
    }
  }
  return { inserted, skipped };
};

// ✅ Process Arrear Data
const processArrearData = async (data) => {
  let inserted = 0;
  for (const row of data) {
    const reg = row["reg no"];
    const arrearSubjects =
      row["arrear sub"]?.split(",").map((s) => s.trim()) || [];

    await Student.updateOne(
      { regNumber: reg },
      { $set: { arrears: arrearSubjects } }
    );

    await Arrear.create({
      regNumber: reg,
      name: row["name"],
      department: row["dep"],
      semester: row["sem"],
      arrears: arrearSubjects,
      createdAt: new Date(),
    });

    inserted++;
  }
  return { inserted };
};

// ✅ Process Subject Data
const processSubjectData = async (data) => {
  let inserted = 0,
    skipped = 0;
  for (const row of data) {
    const code = row["subject code"];
    if (!code) continue;

    const exists = await Subject.findOne({ subjectCode: code });
    if (!exists) {
      await Subject.create({
        subjectCode: code,
        subjectName: row["subject name"],
        department: row["dept"],
        semester: row["sem"],
        cost: row["cost"],
        createdAt: new Date(),
      });
      inserted++;
    } else {
      skipped++;
    }
  }
  return { inserted, skipped };
};

// ✅ Process Attendance & Fees Data
const processAttendanceAndFeesData = async (data) => {
  let inserted = 0,
    updated = 0;
  for (const row of data) {
    const reg = row["reg no"];
    const feesPaid = row["fees status"]?.toLowerCase() === "paid";
    const percentage = row["percentage"];

    const studentUpdate = await Student.updateOne(
      { regNumber: reg },
      { $set: { attendance: percentage, feesPaid } }
    );

    if (studentUpdate.matchedCount > 0) {
      updated++;
    }

    await Attendance.create({
      regNumber: reg,
      name: row["name"],
      department: row["dep"],
      semester: row["sem"],
      email: row["email"],
      percentage,
      feesPaid,
      createdAt: new Date(),
    });

    inserted++;
  }
  return { inserted, updated };
};

// ✅ DELETE all uploaded data and files
router.delete("/delete-all", async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, "../uploads");
    if (fs.existsSync(uploadDir)) {
      fs.emptyDirSync(uploadDir);
      console.log("🧹 All uploaded files removed");
    }

    const studentDelete = await Student.deleteMany({});
    const arrearDelete = await Arrear.deleteMany({});
    const subjectDelete = await Subject.deleteMany({});
    const attendanceDelete = await Attendance.deleteMany({});

    console.log(`🗑️ Deleted Students: ${studentDelete.deletedCount}`);
    console.log(`🗑️ Deleted Arrears: ${arrearDelete.deletedCount}`);
    console.log(`🗑️ Deleted Subjects: ${subjectDelete.deletedCount}`);
    console.log(`🗑️ Deleted Attendance: ${attendanceDelete.deletedCount}`);

    res.status(200).json({
      message: "✅ All uploaded files and data deleted successfully!",
    });
  } catch (error) {
    console.error("❌ Error deleting files/data:", error);
    res.status(500).json({
      message: "Error deleting uploaded files and data",
      error: error.message,
    });
  }
});

module.exports = router;
