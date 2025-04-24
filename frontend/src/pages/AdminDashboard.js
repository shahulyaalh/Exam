import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ text: "", type: "" });
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(true);

  useEffect(() => {
    fetchStudents();
    fetchUploadedFiles();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await axios.get("http://localhost:5000/api/admin/students");
      setStudents(res.data);
    } catch (err) {
      console.error("❌ Error fetching students:", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchUploadedFiles = async () => {
    try {
      setLoadingFiles(true);
      const res = await axios.get("http://localhost:5000/api/files/uploads");
      setUploadedFiles(res.data);
    } catch (err) {
      console.error("❌ Error fetching files:", err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadType) {
      setUploadMessage({
        text: "⚠️ Please select a file and an upload type!",
        type: "error",
      });
      return;
    }

    setUploading(true);
    setUploadMessage({ text: "", type: "" });

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("uploadType", uploadType);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/files/upload",
        formData
      );
      setUploadMessage({ text: `✅ ${res.data.message}`, type: "success" });
      setSelectedFile(null);
      setUploadType("");
      fetchUploadedFiles();
      fetchStudents();
    } catch (err) {
      console.error("❌ File upload failed:", err);
      setUploadMessage({
        text: "❌ Upload failed! Please try again.",
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/admin/students/${studentId}`);
      alert("✅ Student removed successfully!");
      setStudents((prev) => prev.filter((s) => s._id !== studentId));
    } catch (err) {
      console.error("❌ Error deleting student:", err);
      alert("❌ Failed to remove student.");
    }
  };

  const handleUpdateStudent = async (studentId, updatedData) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/admin/students/${studentId}`,
        updatedData,
        { headers: { "Content-Type": "application/json" } }
      );
      alert("✅ Student updated successfully!");
      fetchStudents();
    } catch (err) {
      console.error("❌ Error updating student:", err.response?.data || err.message);
      alert("❌ Failed to update student.");
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/files/uploads/${fileId}`);
      alert("✅ File deleted successfully!");
      fetchUploadedFiles();
    } catch (err) {
      console.error("❌ Error deleting file:", err);
      alert("❌ Failed to delete file.");
    }
  };

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* File Upload Section */}
      <div style={{ marginBottom: 20 }}>
        <input type="file" onChange={handleFileChange} />
        <Select
          value={uploadType}
          onChange={(e) => setUploadType(e.target.value)}
          displayEmpty
          style={{ marginLeft: 10, marginRight: 10, minWidth: 180 }}
        >
          <MenuItem value="" disabled>
            Select Upload Type
          </MenuItem>
          <MenuItem value="student_list">📋 Student List</MenuItem>
          <MenuItem value="arrear_list">❌ Arrear Student List</MenuItem>
          <MenuItem value="attendance">📊 Attendance & Fees</MenuItem>
          <MenuItem value="subjectname">📚 Subjects & Codes</MenuItem>
        </Select>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload File"}
        </Button>
        {uploadMessage.text && (
          <Typography
            style={{
              color: uploadMessage.type === "success" ? "green" : "red",
              marginTop: 10,
            }}
          >
            {uploadMessage.text}
          </Typography>
        )}
      </div>

      {/* Uploaded Files Section */}
      <Typography variant="h5" style={{ marginTop: 20 }}>
        Uploaded Files
      </Typography>
      {loadingFiles ? (
        <CircularProgress />
      ) : uploadedFiles.length === 0 ? (
        <Typography>No files uploaded yet.</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>File Name</strong></TableCell>
              <TableCell><strong>Upload Type</strong></TableCell>
              <TableCell><strong>Uploaded At</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {uploadedFiles.map((file) => (
              <TableRow key={file._id}>
                <TableCell>{file.originalName || file.filename}</TableCell>
                <TableCell>{file.uploadType}</TableCell>
                <TableCell>{new Date(file.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleDeleteFile(file._id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Student Table */}
      <Typography variant="h5" style={{ marginTop: 40 }}>
        Registered Students
      </Typography>
      {loadingStudents ? (
        <CircularProgress />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Attendance (%)</strong></TableCell>
              <TableCell><strong>Fees Status</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student._id}>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    value={student.attendance}
                    onChange={(e) => {
                      const newAttendance = e.target.value;
                      setStudents((prev) =>
                        prev.map((s) =>
                          s._id === student._id ? { ...s, attendance: newAttendance } : s
                        )
                      );
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={student.feesPaid ? "Paid" : "Pending"}
                    onChange={(e) =>
                      setStudents((prev) =>
                        prev.map((s) =>
                          s._id === student._id
                            ? { ...s, feesPaid: e.target.value === "Paid" }
                            : s
                        )
                      )
                    }
                  >
                    <MenuItem value="Paid">Paid</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() =>
                      handleUpdateStudent(student._id, {
                        attendance: student.attendance,
                        feesPaid: student.feesPaid,
                      })
                    }
                  >
                    Update
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleDeleteStudent(student._id)}
                    style={{ marginLeft: 10 }}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Button
        variant="contained"
        color="primary"
        style={{ marginTop: 20 }}
        onClick={() => (window.location.href = "/exam-update")}
      >
        ✏️ Update Exam Schedule
      </Button>
    </Paper>
  );
};

export default AdminDashboard;
