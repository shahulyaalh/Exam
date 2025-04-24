const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully!");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1);
  }
};

connectDB();

const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");
const examRoutes = require("./routes/examRoutes");
const hallTicketRoutes = require("./routes/hallTicketRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const fileRoutes = require("./routes/fileRoutes");

app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/hallticket", hallTicketRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/files", fileRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
