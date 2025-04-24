const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  regNumber: { type: String, required: true, unique: true }, // ✅ Student reg number
  name: { type: String, required: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  email: { type: String, required: true },
  percentage: { type: Number, required: true }, // ✅ Attendance Percentage
  feesPaid: { type: Boolean, required: true }, // ✅ Fees Paid or Not
});

module.exports = mongoose.model("Attendance", AttendanceSchema);
