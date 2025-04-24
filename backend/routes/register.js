// routes/examRoutes.js
const express = require("express");
const { registerForExam } = require("../controllers/examController");
const router = express.Router();

router.post("/register", registerForExam);

module.exports = router;
