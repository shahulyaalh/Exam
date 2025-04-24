import React, { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [userType, setUserType] = useState("student");
  const [formData, setFormData] = useState({
    regNumber: "", // ✅ For student login
    email: "", // ✅ For admin login
    password: "", // ✅ For admin login
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Handle Login Submission for Student & Admin
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setLoading(true);

    try {
      let endpoint = "";
      let payload = {};

      if (userType === "admin") {
        endpoint = "/api/admin/login";
        payload = { email: formData.email, password: formData.password };
      } else {
        endpoint = "/api/student/login";
        payload = { regNumber: formData.regNumber }; // ✅ Only regNumber for students
      }

      const res = await axios.post(`http://localhost:5000${endpoint}`, payload);

      // ✅ Store user details in local storage
      localStorage.setItem("token", res.data.token || "");
      localStorage.setItem("studentId", res.data.studentId || "");
      localStorage.setItem("studentName", res.data.name || "");

      setMessage({ text: "✅ Login successful! Redirecting...", type: "success" });

      setTimeout(() => {
        navigate(userType === "admin" ? "/admin-dashboard" : "/student-dashboard");
      }, 1500);
    } catch (error) {
      setMessage({
        text: "❌ Invalid credentials. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={4} sx={{ padding: 4, marginTop: 4, textAlign: "center" }}>
        <Typography variant="h4">🔐 Login</Typography>

        {message.text && <Alert severity={message.type} sx={{ mt: 2 }}>{message.text}</Alert>}

        <form onSubmit={handleLogin} style={{ marginTop: 20 }}>
          {/* ✅ Select User Type */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>User Type</InputLabel>
            <Select value={userType} onChange={(e) => setUserType(e.target.value)}>
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>

          {/* ✅ Show Reg No for Students & Email/Password for Admins */}
          {userType === "student" ? (
            <TextField
              label="Registration Number"
              name="regNumber"
              value={formData.regNumber}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
          ) : (
            <>
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
            </>
          )}

          <Button variant="contained" color="primary" type="submit" fullWidth disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>

          {userType === "admin" && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Don't have an account? <a href="/register">Register</a>
            </Typography>
          )}
        </form>
      </Paper>
    </Container>
  );
};

export default Login;
