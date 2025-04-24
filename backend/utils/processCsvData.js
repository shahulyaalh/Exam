const Student = require("../models/Student");
const Arrear = require("../models/Arrear");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");

// ✅ Process Student List CSV
const processStudentData = async (data) => {
  console.log("🔹 Processing Student List...");
  for (const row of data) {
    console.log(`➡️ Checking Student: ${row.Name} - ${row["Reg no"]}`);

    const existingStudent = await Student.findOne({ regNumber: row["Reg no"] });

    if (!existingStudent) {
      console.log(`✅ Inserting Student: ${row.Name} - ${row["Reg no"]}`);
      await Student.create({
        regNumber: row["Reg no"],
        name: row.Name,
        email: row.Email,
        department: row.Dep,
        semester: row.Sem,
        attendance: 0,
        feesPaid: false,
        arrears: [],
      });
    } else {
      console.log(`⚠️ Student ${row["Reg no"]} already exists. Skipping...`);
    }
  }
};

// ✅ Process Arrear List CSV
const processArrearData = async (data) => {
  console.log("🔹 Processing Arrear List...");
  for (const row of data) {
    console.log(`➡️ Processing Arrears for ${row.Name} - ${row["Reg no"]}`);
    const arrearSubjects = row["Arrear sub"].split(",");

    await Student.updateOne(
      { regNumber: row["Reg no"] },
      { $set: { arrears: arrearSubjects } }
    );

    await Arrear.create({
      regNumber: row["Reg no"],
      name: row.Name,
      department: row.Dep,
      semester: row.Sem,
      arrears: arrearSubjects,
    });

    console.log(`✅ Inserted Arrear for ${row.Name} - ${arrearSubjects.join(", ")}`);
  }
};

// ✅ Process Subject List CSV
const processSubjectData = async (data) => {
  console.log("🔹 Processing Subject List...");
  for (const row of data) {
    console.log(`➡️ Processing Subject: ${row["Subject Name"]} (${row["Subject Code"]})`);
    const existingSubject = await Subject.findOne({ subjectCode: row["Subject Code"] });

    if (!existingSubject) {
      await Subject.create({
        subjectCode: row["Subject Code"],
        subjectName: row["Subject Name"],
        department: row.Dept,
        semester: row.Sem,
        cost: row.Cost,
      });
      console.log(`✅ Inserted Subject: ${row["Subject Name"]}`);
    } else {
      console.log(`⚠️ Subject ${row["Subject Code"]} already exists. Skipping...`);
    }
  }
};

// ✅ Process Attendance & Fees Status CSV
const processAttendanceAndFeesData = async (data) => {
  console.log("🔹 Processing Attendance & Fees Status...");
  for (const row of data) {
    console.log(`➡️ Processing Attendance for ${row.Name} - ${row["Reg no"]}`);

    const feesPaid = row["Fees Status"] === "Paid";

    await Student.updateOne(
      { regNumber: row["Reg no"] },
      { $set: { attendance: row.Percentage, feesPaid } }
    );

    await Attendance.create({
      regNumber: row["Reg no"],
      name: row.Name,
      department: row.Dep,
      semester: row.Sem,
      email: row.Email,
      percentage: row.Percentage,
      feesPaid,
    });

    console.log(`✅ Attendance Updated for ${row.Name} - ${row.Percentage}%`);
  }
};

module.exports = {
  processStudentData,
  processArrearData,
  processSubjectData,
  processAttendanceAndFeesData,
};
