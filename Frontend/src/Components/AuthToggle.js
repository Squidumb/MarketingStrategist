import React, { useState } from "react";
import { Login } from "./Login";
import { SignUp } from "./SignUp";
import "./AuthToggle.css"; // Create a CSS file for styles

const AuthToggle = () => {
  const [isLogin, setIsLogin] = useState(true);

  const handleToggle = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="auth-container">
      <div className="slider-container">
        <button
          className={`toggle-button ${isLogin ? "active" : ""}`}
          onClick={() => setIsLogin(true)}
        >
          Login
        </button>
        <button
          className={`toggle-button ${!isLogin ? "active" : ""}`}
          onClick={() => setIsLogin(false)}
        >
          Sign Up
        </button>
      </div>
      <div className="form-container">{isLogin ? <Login /> : <SignUp />}</div>
    </div>
  );
};

export default AuthToggle;
