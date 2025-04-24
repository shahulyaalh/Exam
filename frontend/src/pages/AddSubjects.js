import React, { useState } from "react";
import axios from "axios";
import { Container, TextField, Button, Typography, Alert } from "@mui/material";

const AddSubjects = () => {
  const [subjectData, setSubjectData] = useState({
    name: "",
    code: "",
    fees: "",
    type: "regular",
    examSchedule: "" // ✅ New Exam Schedule Field
  });

  const [message, setMessage] = useState({ text: "", type: "" });

  const handleChange = (e) => {
    setSubjectData({ ...subjectData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/subjects/admin/add-subject", subjectData);
      setMessage({ text: res.data.message, type: "success" });
      setSubjectData({ name: "", code: "", fees: "", type: "regular", examSchedule: "" });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "❌ Server error", type: "error" });
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" align="center" gutterBottom>
        ➕ Add New Subject
      </Typography>

      {message.text && <Alert severity={message.type}>{message.text}</Alert>}

      <form onSubmit={handleSubmit}>
        <TextField label="Subject Name" name="name" fullWidth margin="normal" required onChange={handleChange} value={subjectData.name} />
        <TextField label="Subject Code" name="code" fullWidth margin="normal" required onChange={handleChange} value={subjectData.code} />
        <TextField label="Fees" name="fees" type="number" fullWidth margin="normal" required onChange={handleChange} value={subjectData.fees} />
        <TextField label="Type (regular/arrear)" name="type" fullWidth margin="normal" required onChange={handleChange} value={subjectData.type} />
        
        {/* ✅ New Exam Schedule Field */}
        <TextField
          label="Exam Schedule (e.g., March 15, 2024 | 10:00 AM - 12:00 PM)"
          name="examSchedule"
          fullWidth
          margin="normal"
          required
          onChange={handleChange}
          value={subjectData.examSchedule}
        />

        <Button type="submit" variant="contained" color="primary" fullWidth style={{ marginTop: 20 }}>
          Submit
        </Button>
      </form>
    </Container>
  );
};

export default AddSubjects;
