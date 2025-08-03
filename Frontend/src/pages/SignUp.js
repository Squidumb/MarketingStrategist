import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import LogoImg from "../assets/Ntt_Logo.png"; // Update with PNB logo if applicable
import "animate.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1e3a8a", // Blue for buttons
    },
    secondary: {
      main: "#060829", // Use for hover effect
    },
    text: {
      primary: "#060829", // Dark blue for text
      secondary: "#e0e0e0", // Light grey for secondary text
    },
  },
  typography: {
    fontFamily: "'Raleway', sans-serif",
  },
});

const SignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Invalid email format")
      .matches(/@nttdata\.com$/, "Must be an @nttdata.com email")
      .required("Email is required"),
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
      .matches(/[a-z]/, "Password must contain at least one lowercase letter")
      .matches(/[0-9]/, "Password must contain at least one number")
      .matches(
        /[^a-zA-Z0-9]/,
        "Password must contain at least one special character"
      )
      .required("Password is required"),
  });

  const handleSubmit = async (values) => {
    navigate("/login");
    return;
    try {
      const response = await fetch("http://localhost:5001/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (response.ok) {
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error during sign-up:", error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <div
        style={{
          height: "100vh",
          overflow: "hidden",
          backgroundColor: "rgba(194, 225, 235, 0.59)",
        }}
      >
        <header
          className="d-flex text-white p-3 animate__animated animate__fadeInDown"
          style={{
            background: "linear-gradient(90deg, #060829 0%, #1c59c2 100%)", // Navbar gradient
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <img
            src={LogoImg}
            alt="Logo"
            className="ms-3"
            style={{ height: "60px" }}
          />
          <nav></nav>
        </header>

        <div className="container d-flex justify-content-center align-items-center h-100">
          <div
            className="animate__animated animate__fadeInUp"
            style={{ width: "100%", maxWidth: "400px" }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                padding: "2rem",
                border: `2px solid ${theme.palette.primary.main}`,
                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
                width: "90%",
                maxWidth: "420px",
              }}
            >
              <h2
                className="text-center mb-4"
                style={{
                  fontFamily: theme.typography.fontFamily,
                  color: theme.palette.primary.main,
                  fontWeight: "600",
                  fontSize: "1.5rem",
                }}
              >
                Sign Up
              </h2>

              <Formik
                initialValues={{ email: "", password: "" }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="mb-3">
                      <label
                        htmlFor="email"
                        className="form-label"
                        style={{
                          fontFamily: theme.typography.fontFamily,
                          color: theme.palette.text.primary,
                          fontSize: "1rem",
                        }}
                      >
                        Email
                      </label>
                      <Field
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="user@nttdata.com"
                        style={{
                          backgroundColor: "#f7f7f7",
                          border: "1px solid #ddd",
                          color: "#333",
                          borderRadius: "4px",
                        }}
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="text-danger mt-1"
                        style={{
                          fontFamily: theme.typography.fontFamily,
                          color: "#e74c3c",
                          fontSize: "0.8rem",
                          marginTop: "0.25rem",
                        }}
                      />
                    </div>

                    <div className="mb-4 position-relative">
                      <label
                        htmlFor="password"
                        className="form-label"
                        style={{
                          fontFamily: theme.typography.fontFamily,
                          color: theme.palette.text.primary,
                          fontSize: "1rem",
                        }}
                      >
                        Password
                      </label>
                      <Field
                        type={showPassword ? "text" : "password"}
                        name="password"
                        className="form-control"
                        placeholder="At least 8 characters"
                        style={{
                          backgroundColor: "#f7f7f7",
                          border: "1px solid #ddd",
                          color: "#333",
                          borderRadius: "4px",
                        }}
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "35px",
                          cursor: "pointer",
                          color: "#333",
                        }}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </span>
                      <ErrorMessage
                        name="password"
                        component="div"
                        className="text-danger mt-1"
                        style={{
                          fontFamily: theme.typography.fontFamily,
                          fontSize: "0.8rem",
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn w-100 py-2"
                      disabled={isSubmitting}
                      style={{
                        fontFamily: theme.typography.fontFamily,
                        fontWeight: "600",
                        backgroundColor: theme.palette.primary.main,
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        transition: "background-color 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor =
                          theme.palette.secondary.main;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor =
                          theme.palette.primary.main;
                      }}
                    >
                      {isSubmitting ? "Signing up..." : "Sign Up"}
                    </button>
                  </Form>
                )}
              </Formik>
              <div className="text-center mt-3">
                <span style={{ color: "black" }}>Already a user? </span>
                <Link to="/login" style={{ color: theme.palette.primary.main }}>
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default SignUp;
