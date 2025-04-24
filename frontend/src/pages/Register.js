import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [userType, setUserType] = useState("student"); // Default selection
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
  
    try {
      const endpoint = userType === "admin" ? "/api/admin/register" : "/api/student/register";
      const res = await axios.post(`http://localhost:5000${endpoint}`, formData);
  
      setMessage({ text: res.data.message, type: "success" });
  
      // ✅ Redirect after success
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      console.error("Error registering:", error.response?.data || error);
      setMessage({ text: error.response?.data?.message || "❌ Registration failed", type: "error" });
    }
  };
  
  

  return (
    <Container maxWidth="sm">
      <Paper elevation={4} sx={{ padding: 4, marginTop: 4, textAlign: "center" }}>
        <Typography variant="h4">
          <span role="img" aria-label="register">📝</span> Register
        </Typography>

        {message.text && <Alert severity={message.type} sx={{ mt: 2 }}>{message.text}</Alert>}

        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
          <TextField
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />

          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />

          <TextField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>User Type</InputLabel>
            <Select value={userType} onChange={(e) => setUserType(e.target.value)}>
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>

          <Button variant="contained" color="primary" type="submit" fullWidth>
            Register
          </Button>

          <Typography variant="body2" sx={{ mt: 2 }}>
            Already have an account? <a href="/login">Login</a>
          </Typography>
        </form>
      </Paper>
    </Container>
  );
};

export default Register;
