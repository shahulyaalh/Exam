import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const ExamRegistration = () => {
  const [subjects, setSubjects] = useState([]); // Store available subjects
  const [selectedSubjects, setSelectedSubjects] = useState([]); // Store selected subjects
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [studentInfo, setStudentInfo] = useState(null);

  const studentId = localStorage.getItem("studentId");
  const navigate = useNavigate(); // Hook for redirection

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!studentId) {
          setMessage({ text: "User not logged in!", type: "error" });
          navigate("/login"); // Redirect to login page
          return;
        }

        // Fetch subjects and student data
        const [subjectRes, studentRes] = await Promise.all([
          axios.get("http://localhost:5000/api/exams/subjects"),
          axios.get(`http://localhost:5000/api/student/${studentId}`),
        ]);

        setSubjects(subjectRes.data);
        setStudentInfo(studentRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setMessage({ text: "Error fetching data", type: "error" });
      }
    };
    fetchData();
  }, [studentId, navigate]);

  const handleSubjectChange = (subject) => {
    setSelectedSubjects((prev) =>
      prev.some((s) => s._id === subject._id)
        ? prev.filter((s) => s._id !== subject._id)
        : [...prev, subject]
    );
  };

  const validateForm = () => {
    if (!studentInfo) return "No student data found!";
    if (studentInfo.attendance < 75)
      return "Attendance must be at least 75% to register!";
    if (!studentInfo.feesPaid) return "Fees must be paid before registering.";
    if (selectedSubjects.length === 0)
      return "Please select at least one subject.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errorMessage = validateForm();
    if (errorMessage) {
      setMessage({ text: errorMessage, type: "error" });
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/exams/register-exam",
        {
          studentId,
          subjects: selectedSubjects.map((sub) => sub._id), // Send Subject IDs instead of names
        }
      );

      setMessage({ text: res.data.message, type: "success" });
      setSelectedSubjects([]); // Clear selected subjects after successful registration
      navigate("/hall-ticket"); // Redirect to Hall Ticket page after registration
    } catch (err) {
      setMessage({ text: "Error registering for the exam", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} style={{ padding: 20, marginTop: 30 }}>
        <Typography variant="h4" align="center">
          Exam Registration
        </Typography>

        {message.text && (
          <Alert severity={message.type} style={{ marginBottom: 10 }}>
            {message.text}
          </Alert>
        )}

        {studentInfo && (
          <>
            <span>
              <Typography variant="h6">
                📊 Attendance: {studentInfo.attendance}%
              </Typography>
              <Typography variant="h6">
                💰 Fees Paid: {studentInfo.feesPaid ? "✅ Yes" : "❌ No"}
              </Typography>
            </span>
          </>
        )}

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Typography variant="h6" gutterBottom>
              📚 Select Subjects:
            </Typography>
            {subjects.length > 0 ? (
              subjects.map((subject) => (
                <FormControlLabel
                  key={subject._id} // Use unique ID
                  control={
                    <Checkbox
                      checked={selectedSubjects.some(
                        (s) => s._id === subject._id
                      )}
                      onChange={() => handleSubjectChange(subject)}
                    />
                  }
                  label={`${subject.name} (${subject.code}) - ₹${subject.fees}`}
                />
              ))
            ) : (
              <Typography color="error">❌ No subjects available.</Typography>
            )}
          </FormGroup>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            style={{ marginTop: 20 }}
          >
            {loading ? "Submitting registration..." : "📝 Register"}
            {loading && <CircularProgress size={24} />}
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default ExamRegistration;
