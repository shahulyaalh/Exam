const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  regNumber: { type: String, required: true, unique: true }, // ✅ Registration Number for CSV students
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true }, // ✅ Add Department
  semester: { type: Number, required: true }, // ✅ Add Semester
  attendance: { type: Number, default: Math.floor(Math.random() * 100) },
  feesPaid: { type: Boolean, default: false },
  arrears: { type: [String], default: [] }, // ✅ Store arrears subjects
  password: { type: String, required: false }, // ✅ Make password optional
});

module.exports = mongoose.model("Student", StudentSchema);
