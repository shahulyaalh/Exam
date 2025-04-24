const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  fees: { type: String, required: true },
  type: { type: String, required: true }, // "regular" or "arrear"
  examSchedule: { type: String, required: true }, // e.g., "2025-05-10"
});

const Subject = mongoose.model("Subject", subjectSchema);
module.exports = Subject;
