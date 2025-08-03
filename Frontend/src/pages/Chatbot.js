import { useState, useRef, useEffect } from "react";
import { FiSend, FiMic, FiUser, FiMenu } from "react-icons/fi";
import { FaUserAstronaut, FaUser } from "react-icons/fa";
import Sidebar from "../Components/Sidebar";
import ReactMarkdown from "react-markdown";
import { useNavigate, Link, useLocation } from "react-router-dom";
import MarwinLogo from "../assets/logo.png";
import "../App.css";
import "../Css_files/Chatbot.css";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [showPrompts, setShowPrompts] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  const prompts = [
    "What region do I get my most applications from?",
    "What customer demographics does my team need to focus most on and why?",
    "What marketing strategies should I use for my least performing category?",
  ];

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg) return;

    const updatedMessages = [...messages, { sender: "user", text: msg }];
    setMessages(updatedMessages);
    setConversationHistory((prev) => [...prev, { sender: "user", text: msg }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:5001/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: conversationHistory }),
      });
      const data = await res.json();

      setMessages((prev) => [...prev, { sender: "bot", text: data.response }]);
      setConversationHistory((prev) => [
        ...prev,
        { sender: "bot", text: data.response },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error connecting to backend." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Voice recognition error", event.error);
        setIsListening(false);
      };
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition not supported in your browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handlePromptClick = (prompt) => {
    setInput(prompt);
    setShowPrompts(false);
  };

  useEffect(() => {
    if (input === "") {
      setShowPrompts(true);
    }
  }, [input]);

  useEffect(() => {
    fetch("http://localhost:5001/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).catch((err) => console.error("Error during reset:", err));
  }, []);

  return (
    <div className="dashboard-container">
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div
        className="main-content"
        style={{ marginLeft: sidebarOpen ? "250px" : "0" }}
      >
        <header className="dashboard-header">
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
              className={`link-button ${
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
                  console.log("Dropdown state:", showDropdown); // Check state change
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
                    border: "1px solid rgba(246, 173, 12, 0.3)",
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
                      color: "rgba(156, 0, 51, 0.95)",
                      textAlign: "left",
                      cursor: "pointer",
                      fontFamily: "'Roboto', sans-serif",
                      fontSize: "0.85rem",
                      transition: "background-color 0.3s ease, color 0.3s ease",
                    }}
                    onClick={() => navigate("/")}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor =
                        "rgba(30, 58, 138, 0.5);";
                      e.target.style.color = "#f6ad0c";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "none";
                      e.target.style.color = "rgba(30, 58, 138, 0.5);";
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div
          className="chat-container"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "1rem",
            gap: "1rem",
            position: "relative",
            height: "calc(100vh - 120px)",
            overflow: "hidden",
          }}
        >
          <div
            className="message-container"
            style={{
              flex: 1,
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.sender}`}
                  style={{
                    display: "flex",
                    flexDirection:
                      msg.sender === "user" ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      backgroundColor:
                        msg.sender === "user"
                          ? "rgba(30, 58, 138, 0.55)"
                          : "#1e3a8a",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: msg.sender === "user" ? "0" : "0.5rem",
                      marginLeft: msg.sender === "user" ? "0.5rem" : "0",
                      color: "#ffffff",
                    }}
                  >
                    {msg.sender === "user" ? <FaUser /> : <FaUserAstronaut />}
                  </div>
                  <div
                    style={{
                      maxWidth: "70%",
                      padding: "0.75rem 1rem",
                      borderRadius:
                        msg.sender === "user"
                          ? "18px 18px 0 18px"
                          : "18px 18px 18px 0",
                      backgroundColor:
                        msg.sender === "user"
                          ? "rgba(30, 58, 138, 0.1)"
                          : "rgba(201, 229, 248, 0.87)",
                      color: "#333",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      border: "1px solid #1e3a8a",
                      position: "relative",
                    }}
                  >
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                    <div
                      style={{
                        content: '""',
                        position: "absolute",
                        bottom: -1,
                        [msg.sender === "user" ? "right" : "left"]: -10,
                        width: 0,
                        height: 0,
                        borderTop: "10px solid transparent",
                        borderBottom: "10px solid transparent",
                        [msg.sender === "user"
                          ? "borderLeft"
                          : "borderRight"]: `10px solid #1e3a8a`,
                      }}
                    />
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#888",
                        textAlign: msg.sender === "user" ? "right" : "left",
                        marginTop: "0.25rem",
                      }}
                    >
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div
                  className="message bot"
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      backgroundColor: "#1e3a8a",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: "0.5rem",
                      color: "#ffffff",
                    }}
                  >
                    <FaUserAstronaut />
                  </div>
                  <div
                    style={{
                      maxWidth: "70%",
                      padding: "0.75rem 1rem",
                      borderRadius: "18px 18px 18px 0",
                      backgroundColor: "rgba(201, 229, 248, 0.87)", // Match the bot response bubble color
                      color: "#333",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      border: "1px solid #1e3a8a",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        textAlign: "center",
                        fontFamily: "'Raleway', sans-serif",
                        color: "#005b99",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "1rem",
                          fontWeight: "600",
                          margin: 0,
                        }}
                      >
                        Thinking...
                      </p>
                    </div>
                    <div
                      style={{
                        content: '""',
                        position: "absolute",
                        bottom: -1,
                        left: -10,
                        width: 0,
                        height: 0,
                        borderTop: "10px solid transparent",
                        borderBottom: "10px solid transparent",
                        borderRight: "10px solid #1e3a8a",
                      }}
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {showPrompts && (
              <div
                className="prompt-buttons"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  padding: "1rem",
                  borderTop: "1px solid rgba(30, 58, 138, 0.1)",
                  backgroundColor: "#ffffff",
                  position: "sticky",
                  bottom: 0,
                  zIndex: 2,
                }}
              >
                {prompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt)}
                    style={{
                      backgroundColor: "rgba(30, 58, 138, 0.1)",
                      color: "#1e3a8a",
                      border: "1px solid #1e3a8a",
                      borderRadius: "20px",
                      padding: "0.5rem 1rem",
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            className="input-area"
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                borderRadius: "24px",
                border: "1px solid #1e3a8a",
                fontSize: "1rem",
                outline: "none",
                transition: "border-color 0.3s",
              }}
            />
            <button
              onClick={toggleVoiceInput}
              style={{
                backgroundColor: isListening
                  ? "rgba(30, 58, 138, 0.1)"
                  : "transparent",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background-color 0.3s",
              }}
            >
              <FiMic size={20} color={isListening ? "#1e3a8a" : "#666"} />
            </button>
            <button
              onClick={sendMessage}
              disabled={input.trim() === ""}
              style={{
                backgroundColor:
                  input.trim() === "" ? "rgba(30, 58, 138, 0.1)" : "#1e3a8a",
                color: input.trim() === "" ? "#666" : "#ffffff",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: input.trim() === "" ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
              }}
            >
              <FiSend size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
