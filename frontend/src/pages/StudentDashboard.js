import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Box,
} from "@mui/material";

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [examRegistered, setExamRegistered] = useState(false);

  const studentId = localStorage.getItem("studentId");

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!studentId) {
        setMessage({ text: "User not logged in!", type: "error" });
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `http://localhost:5000/api/student/${studentId}`
        );
        setStudentData(res.data);
      } catch (err) {
        setMessage({ text: "Error fetching student data", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId]);

  const handleExamRegister = async () => {
    if (!studentData || studentData.attendance < 75 || !studentData.feesPaid) {
      setMessage({
        text: "You are not eligible to register for exams!",
        type: "error",
      });
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/exams/register", {
        studentId,
        subjects: studentData.subjects
          .filter((subject) => subject.type !== "arrear")
          .map((subj) => subj.name),
      });
      setMessage({ text: "✅ Exam registered successfully!", type: "success" });
      setExamRegistered(true);
    } catch (err) {
      setMessage({ text: "❌ Error registering for exam.", type: "error" });
    }
  };

  return (
    <Container maxWidth="md">
      <Paper
        elevation={4}
        sx={{ padding: 4, marginTop: 4, textAlign: "center" }}
      >
        <Typography variant="h4">📚 Exam Registration </Typography>

        {message.text && (
          <Alert severity={message.type} sx={{ mt: 2 }}>
            {message.text}
          </Alert>
        )}

        {loading ? (
          <CircularProgress />
        ) : studentData ? (
          <>
            <Box sx={{ textAlign: "left", marginBottom: 2 }}>
              <Typography variant="h6">👤 Name: {studentData.name}</Typography>
              <Typography variant="h6">
                📊 Attendance: {studentData.attendance}%
              </Typography>
              <Typography variant="h6">
                💰 Fees Paid: {studentData.feesPaid ? "✅ Yes" : "❌ No"}
              </Typography>
            </Box>

            <Typography variant="h5" sx={{ marginTop: 2 }}>
              📌 Subjects:
            </Typography>

            <Box sx={{ marginTop: 2 }}>
              <Typography variant="h6">📜 Regular Subjects:</Typography>
              {studentData.subjects.some((subj) => subj.type !== "arrear") ? (
                <TableContainer component={Paper} sx={{ marginTop: 1 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell>
                          <strong>Subject</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Fees</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {studentData.subjects
                        .filter((subj) => subj.type !== "arrear")
                        .map((subject, index) => (
                          <TableRow key={index}>
                            <TableCell>{subject.name}</TableCell>
                            <TableCell>
                              {subject.fees === "Paid Separately"
                                ? "💰 Paid Separately"
                                : `₹${subject.fees}`}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography sx={{ marginTop: 2, color: "gray" }}>
                  No regular subjects registered
                </Typography>
              )}

              <Typography variant="h6" sx={{ marginTop: 4 }}>
                📜 Arrear Subjects:
              </Typography>
              {studentData.subjects.some((subj) => subj.type === "arrear") ? (
                <TableContainer component={Paper} sx={{ marginTop: 1 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell>
                          <strong>Subject</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Fees</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {studentData.subjects
                        .filter((subj) => subj.type === "arrear")
                        .map((subject, index) => (
                          <TableRow key={index}>
                            <TableCell>{subject.name}</TableCell>
                            <TableCell>
                              {subject.fees === "Paid Separately"
                                ? "💰 Paid Separately"
                                : `₹${subject.fees}`}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography sx={{ marginTop: 2, color: "gray" }}>
                  No arrear subjects registered
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ marginTop: 3, padding: 1.5 }}
              onClick={handleExamRegister}
              disabled={studentData.attendance < 75 || !studentData.feesPaid}
            >
              📝 Register for Exams
            </Button>

            {examRegistered && (
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                sx={{ marginTop: 2, padding: 1.5 }}
                onClick={() => window.open(`/hall-ticket`, "_blank")}
              >
                🎟️ Download Hall Ticket
              </Button>
            )}
          </>
        ) : (
          <Typography>No student data found</Typography>
        )}
      </Paper>
    </Container>
  );
};

export default StudentDashboard;
