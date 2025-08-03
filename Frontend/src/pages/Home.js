import React from "react";
import "animate.css";
import LogoImg from "../assets/Ntt_Logo.png"; // Update with PNB logo if applicable
import "bootstrap-icons/font/bootstrap-icons.css";
import { useNavigate } from "react-router-dom";
import homeGif from "../assets/home.gif";

function Home() {
  const navigate = useNavigate();
  const channels = [
    {
      name: "Facebook",
      strategy: "Audiences",
      icon: "bi-facebook",
    },
    {
      name: "Google Ads",
      strategy: "Intent",
      icon: "bi-google",
    },
    {
      name: "Instagram",
      strategy: "Stories",
      icon: "bi-instagram",
    },
    {
      name: "YouTube",
      strategy: "Videos",
      icon: "bi-youtube",
    },
    {
      name: "Twitter",
      strategy: "Trends",
      icon: "bi-twitter",
    },
    {
      name: "Email",
      strategy: "Personal",
      icon: "bi-envelope",
    },
  ];

  const navbarBlue = "linear-gradient(90deg, #060829 0%, #1c59c2 100%)";
  const buttonBlue = "#1e3a8a";
  const buttonHover = "#0e1013";
  const sidebarBlue = "#1c59c2";

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "rgba(194, 225, 235, 0.59)",
      }}
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700&display=swap');
        `}
      </style>

      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          className="d-flex text-white p-3 animate__animated animate__fadeInDown"
          style={{
            background: navbarBlue, // Navbar blue background
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
          }}
        >
          <img
            src={LogoImg}
            alt="Logo"
            className="me-3"
            style={{ height: "60px" }}
          />
        </header>

        <div className="container-fluid h-100">
          <div className="row h-100 align-items-center">
            <div className="col-md-6">
              <div
                className="text-center text-md-start px-4 animate__animated animate__fadeInLeft"
                style={{ maxWidth: "800px", marginLeft: "30px" }}
              >
                <p
                  className="display-3 fw-bold mb-4 animate__animated animate__fadeInDown"
                  style={{
                    fontFamily: "'Raleway', sans-serif",
                    color: "rgb(3, 35, 90)", // Sidebar blue text
                    fontSize: "2.5rem",
                    textShadow: "2px 2px 8px rgba(0,0,0,0.5)",
                  }}
                >
                  MarWin
                </p>

                <p
                  className="fw-medium mb-4 animate__animated animate__fadeIn animate__delay-1s"
                  style={{
                    fontFamily: "'Raleway', sans-serif",
                    color: sidebarBlue, // Sidebar blue text
                    fontSize: "1.5rem",
                  }}
                >
                  Agentic AI powered Marketing Strategist for Winning Campaigns
                </p>

                <button
                  className="btn btn-lg mt-3 px-4 animate__animated animate__fadeInUp animate__delay-2s"
                  style={{
                    fontFamily: "'Raleway', sans-serif",
                    fontWeight: "600",
                    fontSize: "1.2rem",
                    backgroundColor: buttonBlue, // Blue button background
                    color: "#ffffff", // White text
                    border: `2px solid ${sidebarBlue}`, // Sidebar blue border
                    borderRadius: "8px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                    transition: "background-color 0.3s",
                  }}
                  onClick={() => navigate("/signup")}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = buttonHover)
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = buttonBlue)
                  }
                >
                  Get Started
                </button>
              </div>
            </div>

            <div className="col-md-6 d-none d-md-flex justify-content-center align-items-center">
              <div
                className="animate__animated animate__fadeInRight"
                style={{
                  position: "relative",
                  width: "500px",
                  height: "500px",
                }}
              >
                <div
                  className="animate__animated animate__zoomIn animate__delay-1s"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "200px",
                    height: "200px",
                    borderRadius: "100%",
                    backgroundColor: "rgba(28, 89, 194, 0.1)", // Light blue background
                    border: `2px solid ${sidebarBlue}`, // Sidebar blue border
                    overflow: "hidden",
                    zIndex: "1",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={homeGif}
                      alt="Home GIF"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                </div>

                {channels.map((channel, index) => {
                  const angle = index * 60 - 90;
                  const radian = (angle * Math.PI) / 180;
                  const radius = 160; // Adjust radius for better fit

                  return (
                    <div
                      key={index}
                      className="animate__animated animate__zoomIn"
                      style={{
                        animationDelay: `${index * 0.1 + 0.5}s`,
                        position: "absolute",
                        left: `calc(50% + ${radius * Math.cos(radian)}px)`,
                        top: `calc(50% + ${radius * Math.sin(radian)}px)`,
                        transform: "translate(-50%, -50%)",
                        width: "80px", // Adjust size for better fit
                        height: "80px",
                        backgroundColor: "#ffffff", // White background
                        backdropFilter: "blur(5px)",
                        border: `2px solid ${sidebarBlue}`,
                        borderRadius: "12px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "5px",
                        textAlign: "center",
                        boxShadow: "0 0 10px rgba(28, 89, 194, 0.25)", // Blue shadow
                        zIndex: "3",
                      }}
                    >
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          backgroundColor: buttonBlue, // Blue button background
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: "5px",
                        }}
                      >
                        <i
                          className={`bi ${channel.icon}`}
                          style={{
                            color: "#ffffff", // White text for icon
                            fontSize: "1rem",
                          }}
                        ></i>
                      </div>
                      <div
                        style={{
                          fontFamily: "'Raleway', sans-serif",
                          color: sidebarBlue, // Sidebar blue text
                          fontWeight: "600",
                          fontSize: "0.75rem",
                          marginBottom: "2px",
                        }}
                      >
                        {channel.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Raleway', sans-serif",
                          color: sidebarBlue, // Sidebar blue text
                          fontWeight: "500",
                          fontSize: "0.65rem",
                          lineHeight: "1.1",
                        }}
                      >
                        {channel.strategy}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
