import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  TextField,
  CircularProgress,
  Alert,
} from "@mui/material";

const ExamUpdate = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  // ✅ Fetch subjects from the backend
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/admin/subjects");
      setSubjects(res.data);
    } catch (err) {
      console.error("❌ Error fetching subjects:", err);
      setErrorMessage("❌ Error fetching subjects from the database.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update Exam Schedule
  const handleUpdateSchedule = async (subjectId, examSchedule) => {
    if (!examSchedule) {
      alert("⚠️ Please enter a valid exam schedule.");
      return;
    }

    try {
      await axios.patch(`http://localhost:5000/api/admin/subjects/${subjectId}`, {
        examSchedule,
      });

      alert("✅ Exam schedule updated successfully!");
      fetchSubjects(); // Refresh subjects list
    } catch (err) {
      console.error("❌ Error updating exam schedule:", err);
      alert("❌ Failed to update exam schedule.");
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} style={{ padding: 20, marginTop: 20 }}>
        <Typography variant="h4" align="center" gutterBottom>
          📅 Exam Schedule Management
        </Typography>

        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {loading ? (
          <CircularProgress />
        ) : subjects.length === 0 ? (
          <Typography color="error">❌ No subjects found in the database.</Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Subject Name</strong></TableCell>
                <TableCell><strong>Exam Schedule</strong></TableCell>
                <TableCell><strong>Update</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject._id}>
                  <TableCell>{subject.subjectName}</TableCell>
                  <TableCell>
                    <TextField
                      type="datetime-local"
                      value={subject.examSchedule || ""}
                      onChange={(e) => {
                        const newSchedule = e.target.value;
                        setSubjects((prev) =>
                          prev.map((s) =>
                            s._id === subject._id ? { ...s, examSchedule: newSchedule } : s
                          )
                        );
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleUpdateSchedule(subject._id, subject.examSchedule)}
                    >
                      Update
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Container>
  );
};

export default ExamUpdate;
