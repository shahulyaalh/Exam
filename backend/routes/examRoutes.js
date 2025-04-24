const express = require("express");
const router = express.Router();

const { registerForExam } = require("../controllers/examController");
const { sendHallTicket } = require("../controllers/hallTicketController");

// ✅ Register for exam
router.post("/register", registerForExam);

// ✅ Send hall ticket via email
router.post("/send-hallticket", sendHallTicket);

module.exports = router;
