const mongoose = require("mongoose");

const ExamSchema = new mongoose.Schema({
  studentId: String,
  subjects: [String],
  hallTicketGenerated: Boolean,
});

module.exports = mongoose.model("Exam", ExamSchema);
