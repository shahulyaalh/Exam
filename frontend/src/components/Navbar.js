import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Button, Box } from "@mui/material";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem("token");
  const user = localStorage.getItem("studentName") ? "student" : "admin";
  console.log(isAuthenticated);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Helper to style active button
  const isActive = (path) => location.pathname === path;
  console.log(location.pathname);

  return (
    <AppBar position="static">
      <Toolbar sx={{ px: 3, display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            color={isActive("/") ? "secondary" : "inherit"}
            component={Link}
            to="/"
          >
            Home
          </Button>

          {!isAuthenticated ? (
            <>
              <Button
                color={isActive("/register") ? "secondary" : "inherit"}
                component={Link}
                to="/register"
              >
                Register
              </Button>
              <Button
                color={isActive("/login") ? "secondary" : "inherit"}
                component={Link}
                to="/login"
              >
                Login
              </Button>
            </>
          ) : (
            <>
              {user == "student" && (
                <>
                  <Button
                    color={
                      isActive("/student-dashboard") ? "secondary" : "inherit"
                    }
                    component={Link}
                    to="/student-dashboard"
                  >
                    Exam Registration
                  </Button>
                  {/* <Button
                    color={isActive("/hall-ticket") ? "secondary" : "inherit"}
                    component={Link}
                    to="/hall-ticket"
                  >
                    Hall Ticket
                  </Button> */}
                </>
              )}
              {user == "admin" && (
                <Button
                  color={isActive("/admin-dashboard") ? "secondary" : "inherit"}
                  component={Link}
                  to="/admin-dashboard"
                >
                  Admin Panel
                </Button>
              )}
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
