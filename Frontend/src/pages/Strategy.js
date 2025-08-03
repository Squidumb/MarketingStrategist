import React, { useState } from "react";
import { Card, Form, Button } from "react-bootstrap";
import {
  FiZap,
  FiUser,
  FiDownload,
  FiArrowLeft,
  FiMenu,
  FiMail,
  FiEdit2,
  FiAward,
  FiBookmark,
} from "react-icons/fi";
import { jsPDF } from "jspdf";
import { Document, Paragraph, Packer, TextRun } from "docx";
import Sidebar from "../Components/Sidebar";
import ReactMarkdown from "react-markdown";
import { useNavigate, Link, useLocation } from "react-router-dom";
import StageLoader from "../Components/ProgressBar";
import MarwinLogo from "../assets/logo.png";
import "./Strategy.css";
import "../App.css";
import Alert from "@mui/material/Alert";
import { FaTwitter } from "react-icons/fa";
import { FaXing } from "react-icons/fa"; // Assuming this is the icon for X
import XLogo from "../assets/x-logo.png";

export default function CampaignStrategyPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [generatedStrategy, setGeneratedStrategy] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStage, setCurrentStage] = useState(-1);
  const [alertMessage, setAlertMessage] = useState(null);
  const [tweetMessage, setTweetMessage] = useState(null);
  const stages = ["Querying", "Retrieving", "Generating"];

  const [samplePrompts, setSamplePrompts] = useState([
    "Generate me an instagram campaign for my top 2 performing categories",
    "Create a campaign plan for Housing Loans using brick by brick as the theme",
    "There are new government schemes coming up, search for them and generate me a professional Twitter post introducing them!",
  ]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setCurrentStage(0);
    setGeneratedStrategy("");

    for (let i = 0; i < stages.length; i++) {
      setCurrentStage(i);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Each stage takes 2 seconds
    }
    try {
      const response = await fetch(
        "http://localhost:5001/campaign-strategy",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_name: selectedCategory,
          }),
        }
      );

      const data = await response.json();
      console.log("selectedCategory", selectedCategory);

      setGeneratedStrategy(data.response);
    } catch (error) {
      console.error("Error generating strategy:", error);
      setGeneratedStrategy(
        "⚠️ Failed to generate strategy. Please try again later."
      );
    } finally {
      setIsLoading(false);
      setCurrentStage(-1);
    }
  };

  const handleSendEmail = async () => {
    const toEmail = document.getElementById("toEmail").value;

    if (!toEmail) {
      alert("Please enter email address");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5001/send-email",

        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            toEmail: toEmail,
            content: generatedStrategy,
          }),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAlertMessage("Email sent successfully!");
    } catch (error) {
      console.error("Error:", error);
      setAlertMessage("Failed to send email. Try again!");
    }
  };

  const handleDownload = async (format) => {
    try {
      if (format === "pdf") {
        const doc = new jsPDF();
        const lines = doc.splitTextToSize(generatedStrategy, 180);
        let y = 20;

        lines.forEach((line) => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 20, y);
          y += 7;
        });

        doc.save("campaign_strategy.pdf");
      } else if (format === "docx") {
        const doc = new Document({
          sections: [
            {
              properties: {},
              children: generatedStrategy.split("\n").map(
                (line) =>
                  new Paragraph({
                    children: [new TextRun(line)],
                  })
              ),
            },
          ],
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "campaign_strategy.docx";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const element = document.createElement("a");
        const file = new Blob([generatedStrategy], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = `campaign_strategy.${format}`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to generate document. Please try again.");
    }
  };

  const handlePostToTwitter = async () => {
    // Regular expression to capture quoted strings
    const quoteRegex = /"(.*?)"/;

    // Match the strategy against the regex
    const match = generatedStrategy.match(quoteRegex);

    // Extract the first quoted content
    const strategy = match ? match[1] : "";

    console.log("Extracted Strategy:", strategy); // Debugging

    if (strategy) {
      try {
        const response = await fetch("http://localhost:5001/post-to-twitter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strategy: strategy,
          }),
        });

        const result = await response.json();
        console.log("Response from server:", result); // Debugging

        if (response.ok) {
          setTweetMessage(result.message);
        } else {
          setTweetMessage(`Error: ${result.error}`);
        }
      } catch (error) {
        console.error("Error posting to Twitter:", error);
        setTweetMessage("Failed to post to Twitter. Please try again later.");
      }
    } else {
      setTweetMessage("No valid strategy found in the generated content.");
    }
  };

  return (
    <div className="main">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div
        className="main-content"
        style={{ marginLeft: sidebarOpen ? "250px" : "0" }}
      >
        <header
          className="dashboard-header"
          style={{ position: "sticky", top: 0, zIndex: 1000 }}
        >
          <div className="header-left" style={{ marginRight: "auto" }}>
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FiMenu size={30} />
            </button>
          </div>

          <div
            className="header-center"
            style={{
              position: "absolute",
              left: sidebarOpen ? "calc(50% + 120px)" : "50%",
              transform: "translateX(-50%)",
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              letterSpacing: "1px",
              transition: "left 0.3s ease",
            }}
          >
            <img src={MarwinLogo} alt="Marwin Logo" className="logo" />
          </div>

          <div className="header-actions">
            <Link
              to="/dashboard"
              className={`link-button${
                location.pathname === "/dashboard" ? "active" : ""
              }`}
            >
              Dashboard
            </Link>
            <div className="user-dropdown">
              <button
                className="user-profile"
                onClick={() => {
                  setShowDropdown(!showDropdown);
                  console.log("Dropdown state:", showDropdown);
                }}
              >
                <FiUser size={23} />
              </button>

              {showDropdown && (
                <div
                  style={{
                    position: "absolute",
                    right: "2rem",
                    background: "#ffffff",
                    border: "1px solid rgba(0, 112, 192, 0.3)",
                    borderRadius: "8px",
                    padding: "0.5rem 0",
                    minWidth: "160px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <button
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "none",
                      border: "none",
                      color: "rgba(0, 112, 192, 0.95)",
                      textAlign: "left",
                      cursor: "pointer",
                      fontFamily: "'Roboto', sans-serif",
                      fontSize: "0.85rem",
                      transition:
                        "background-color 0.3s ease, color                     s ease",
                    }}
                    onClick={() => navigate("/")}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "rgba(0, 112, 192, 0.1)";
                      e.target.style.color = "#060829";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "none";
                      e.target.style.color = "rgba(0, 112, 192, 0.95)";
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {!generatedStrategy ? (
          <div>
            <Card
              style={{
                border: "2px solid #060829",
                borderRadius: "16px",
                maxWidth: "1000px",
                margin: "40px auto 0",
                boxShadow: "0 12px 40px rgba(0, 112, 192, 0.15)",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  backgroundColor: "#060829",
                  padding: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FiZap size={24} color="#fff" />
                </div>
                <h3
                  style={{
                    color: "#fff",
                    fontWeight: 600,
                    margin: 0,
                    fontSize: "1.5rem",
                  }}
                >
                  Campaign Strategy Generator
                </h3>
              </div>

              <Card.Body
                style={{
                  padding: "2.5rem",
                  display: "flex",
                  gap: "2rem",
                  background:
                    "linear-gradient(135deg, rgba(0, 112, 192, 0.03) 0%, rgba(0, 112, 192, 0.08) 100%)",
                }}
              >
                {/* Left Column - Form */}
                <div style={{ flex: 1 }}>
                  <Form.Group className="mb-4">
                    <Form.Label
                      style={{
                        color: "#060829",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <FiEdit2
                        size={20}
                        style={{ color: "rgba(7, 15, 38, 0.7)" }}
                      />
                      Describe Your Campaign
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      placeholder="Enter your requirement"
                      style={{
                        border: "2px solid rgba(7, 15, 38, 0.3)",
                        backgroundColor: "#fff",
                        padding: "1rem",
                        minHeight: "180px",
                        resize: "none",
                        borderRadius: "10px",
                        fontSize: "0.95rem",
                        boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.05)",
                        transition: "all 0.3s ease",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#060829";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(7, 15, 38, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(7, 15, 38, 0.3)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </Form.Group>

                  <div
                    style={{
                      textAlign: "center",
                      marginTop: "2rem",
                    }}
                  >
                    <Button
                      onClick={handleGenerate}
                      disabled={!selectedCategory || isLoading}
                      style={{
                        fontFamily: "'Raleway', sans-serif",
                        fontWeight: "700",
                        fontSize: "1.1rem",
                        backgroundColor: "#060829",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0.75rem 2rem",
                        width: "100%",
                        transition: "all 0.3s ease",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {isLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            style={{
                              marginRight: "0.5rem",
                              borderWidth: "0.15em",
                            }}
                          />
                          Crafting Strategy...
                        </>
                      ) : (
                        <>
                          <FiZap
                            style={{
                              marginRight: "0.5rem",
                              transition: "all 0.3s ease",
                              transform: "translateY(-1px)",
                            }}
                          />
                          Generate Strategy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Right Column - Sample Prompts */}
                <div
                  style={{
                    flex: 1,
                    borderLeft: "1px solid rgba(7, 15, 38, 0.1)",
                    paddingLeft: "2rem",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-2.5rem",
                      left: "-1px",
                      right: 0,
                      height: "1px",
                      backgroundColor: "rgba(7, 15, 38, 0.1)",
                    }}
                  ></div>

                  <h4
                    style={{
                      color: "#060829",
                      fontWeight: 700,
                      marginBottom: "1.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      fontSize: "1.2rem",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "rgba(0, 112, 192, 0.1)",
                        borderRadius: "8px",
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FiAward size={20} style={{ color: "#060829" }} />
                    </div>
                    Prompt Templates
                  </h4>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: "1rem",
                      height: "calc(100% - 60px)",
                      overflowY: "auto",
                      paddingRight: "0.5rem",
                    }}
                  >
                    {samplePrompts.map((prompt, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setSelectedCategory(prompt);
                          document.querySelector("textarea").focus();
                        }}
                        style={{
                          backgroundColor: "#fff",
                          border: "1px solid rgba(7, 15, 38, 0.1)",
                          borderRadius: "10px",
                          padding: "1.25rem",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                          ":hover": {
                            transform: "translateY(-3px)",
                            borderColor: "rgba(0, 112, 192, 0.3)",
                            boxShadow: "0 6px 16px rgba(0, 112, 192, 0.1)",
                            backgroundColor: "rgba(0, 112, 192, 0.03)",
                          },
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              flexShrink: 0,
                              backgroundColor: "rgba(0, 112, 192, 0.1)",
                              borderRadius: "6px",
                              width: "28px",
                              height: "28px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginTop: "2px",
                            }}
                          >
                            <FiBookmark
                              size={14}
                              style={{ color: "rgba(7, 15, 38, 0.7)" }}
                            />
                          </div>
                          <p
                            style={{
                              margin: 0,
                              color: "#060829",
                              fontSize: "0.95rem",
                              lineHeight: "1.5",
                            }}
                          >
                            {prompt}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card.Body>
            </Card>
            {isLoading && (
              <StageLoader stages={stages} currentStage={currentStage} />
            )}
          </div>
        ) : (
          <div style={{ display: "flex", gap: "2rem" }}>
            {/* Strategy Section */}
            <Card
              style={{
                border: "2px solid #060829",
                backgroundColor: "rgba(0, 112, 192, 0.1)",
                borderRadius: "15px",
                flex: "3",
                boxShadow: "0 10px 30px rgba(0, 112, 192, 0.1)",
                marginLeft: "200px",
                marginTop: "20px",
                color: "#333333",
              }}
            >
              <Card.Body style={{ height: "700px", padding: "2rem" }}>
                <div
                  className="strategy-header"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "2rem",
                  }}
                >
                  <h3
                    className="strategy-title"
                    style={{
                      fontSize: "2rem",
                      fontWeight: "700",
                      margin: 0,
                      color: "black",
                    }}
                  >
                    Your Campaign Strategy
                  </h3>
                  <Button
                    onClick={() => setGeneratedStrategy("")}
                    className="back-button"
                    style={{
                      fontFamily: "'Raleway', sans-serif",
                      fontWeight: "600",
                      fontSize: "1rem",
                      backgroundColor: "transparent",
                      color: "#060829",
                      border: "2px solid #060829",
                      borderRadius: "8px",
                      padding: "0.5rem 1rem",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "#ffffff")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "transparent")
                    }
                  >
                    <FiArrowLeft
                      className="button-icon"
                      style={{ marginRight: "0.5rem" }}
                    />{" "}
                    Back
                  </Button>
                </div>

                <div
                  className="strategy-container"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    border: "2px solid rgba(7, 15, 38, 0.2)",
                    borderRadius: "8px",
                    padding: "2rem",
                    marginBottom: "2rem",
                  }}
                >
                  <div className="strategy-content-wrapper">
                    <div className="strategy-content">
                      <ReactMarkdown>{generatedStrategy}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                <div
                  className="strategy-actions"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "1rem",
                  }}
                >
                  {["pdf", "docx"].map((format) => (
                    <Button
                      key={format}
                      onClick={() => handleDownload(format)}
                      className="download-button"
                      style={{
                        fontFamily: "'Raleway', sans-serif",
                        fontWeight: "600",
                        fontSize: "1rem",
                        backgroundColor: "#060829",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0.75rem 1.5rem",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#ffffff";
                        e.target.style.color = "#060829";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#060829";
                        e.target.style.color = "#ffffff";
                      }}
                    >
                      <FiDownload
                        className="button-icon"
                        style={{ marginRight: "0.5rem" }}
                      />
                      Save as {format.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </Card.Body>
            </Card>

            <div
              style={{
                flex: "1",
                minWidth: "300px",
                maxWidth: "350px",
                marginRight: "50px",
                marginTop: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {/* Email Sharing Section */}
              <Card
                style={{
                  border: "2px solid #060829",
                  borderRadius: "12px",
                  boxShadow: "0 10px 30px rgba(0, 112, 192, 0.1)",
                  backgroundColor: "rgba(0, 112, 192, 0.1)",
                  color: "#333333",
                }}
              >
                <Card.Body style={{ padding: "1.5rem" }}>
                  <h4 className="email-title" style={{ color: "#060829" }}>
                    Share via Email
                  </h4>
                  <p className="email-description" style={{ color: "#000000" }}>
                    Send this strategy directly to your team.
                  </p>
                  <p className="email-description" style={{ color: "#000000" }}>
                    <strong>Note:</strong> You can send email to multiple people
                    by separating their emails using ";"
                  </p>

                  <div className="email-form">
                    <div className="form-group">
                      <label
                        htmlFor="toEmail"
                        className="form-label"
                        style={{ color: "#333333" }}
                      >
                        To:
                      </label>
                      <input
                        id="toEmail"
                        type="email"
                        placeholder="recipient@email.com"
                        className="email-input"
                        style={{
                          borderColor: "#060829",
                          backgroundColor: "rgba(255, 255, 255, 0.8)",
                          color: "#333333",
                        }}
                      />
                    </div>

                    <Button
                      onClick={handleSendEmail}
                      className="send-email-button"
                      style={{
                        fontFamily: "'Raleway', sans-serif",
                        fontWeight: "600",
                        fontSize: "1rem",
                        backgroundColor: "#060829",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "0.75rem 1.5rem",
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                        transition: "all 0.3s ease",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#ffffff";
                        e.target.style.color = "#060829";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#060829";
                        e.target.style.color = "#ffffff";
                      }}
                    >
                      <FiMail
                        className="button-icon"
                        style={{ marginRight: "0.5rem" }}
                      />
                      Send Email
                    </Button>
                  </div>
                  {alertMessage && (
                    <Alert
                      severity={
                        alertMessage.includes("success") ? "success" : "error"
                      }
                      onClose={() => setAlertMessage(null)}
                      style={{ marginTop: "1rem" }}
                    >
                      {alertMessage}
                    </Alert>
                  )}
                </Card.Body>
              </Card>

              {/* Post to X Button */}
              <Button
                onClick={handlePostToTwitter}
                className="post-x-button"
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontWeight: "600",
                  fontSize: "1rem",
                  backgroundColor: "#000000", // X brand color
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.75rem 1.5rem",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  transition: "all 0.3s ease",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#1c1c1c";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#000000";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
                }}
              >
                <img
                  src={XLogo}
                  alt="X Logo"
                  style={{
                    marginRight: "0.5rem",
                    width: "24px",
                    height: "24px",
                  }}
                />
                Post to Twitter
              </Button>

              {/* Tweet Confirmation Message */}
              {tweetMessage && (
                <Alert
                  severity={
                    tweetMessage.includes("success") ? "success" : "error"
                  }
                  onClose={() => setTweetMessage(null)}
                  style={{ marginTop: "1rem" }}
                >
                  {tweetMessage}
                </Alert>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
