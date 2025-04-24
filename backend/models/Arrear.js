const mongoose = require("mongoose");

const ArrearSchema = new mongoose.Schema({
  regNumber: { type: String, required: true, unique: false }, // ✅ Student reg number
  name: { type: String, required: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  arrears: { type: [String], required: true }, // ✅ List of arrear subjects
});

module.exports = mongoose.model("Arrear", ArrearSchema);
