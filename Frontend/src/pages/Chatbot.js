import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiMic, FiUser, FiMenu, FiMicOff } from 'react-icons/fi';
import { FaUserAstronaut } from 'react-icons/fa';
import Sidebar from '../Components/Sidebar';
import ReactMarkdown from 'react-markdown';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import '../styles/Chatbot.css';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const prompts = [
    'What region do I get my most applications from?',
    'What customer demographics does my team need to focus most on and why?',
    'What marketing strategies should I use for my least performing category?',
  ];

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg) return;

    const updatedMessages = [...messages, { sender: 'user', text: msg, timestamp: new Date() }];
    setMessages(updatedMessages);
    setConversationHistory((prev) => [...prev, { sender: 'user', text: msg }]);
    setInput('');
    setIsLoading(true);
    setShowPrompts(false);

    try {
      const res = await fetch('http://localhost:5001/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: conversationHistory }),
      });
      const data = await res.json();

      setMessages((prev) => [...prev, { 
        sender: 'bot', 
        text: data.response, 
        timestamp: new Date() 
      }]);
      setConversationHistory((prev) => [
        ...prev,
        { sender: 'bot', text: data.response },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { 
          sender: 'bot', 
          text: 'Error connecting to backend.', 
          timestamp: new Date() 
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Voice recognition error', event.error);
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition not supported in your browser');
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
    if (input === '') {
      setShowPrompts(messages.length === 0);
    }
  }, [input, messages.length]);

  useEffect(() => {
    fetch('http://localhost:5001/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch((err) => console.error('Error during reset:', err));
  }, []);

  return (
    <div className="chatbot-container">
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className={`chatbot-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="chatbot-header">
          <div className="header-left">
            <button
              className="menu-toggle btn btn-ghost"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FiMenu />
            </button>
          </div>

          <div className="header-center">
            <div className="logo">
              <span className="gradient-text">MarWin AI</span>
            </div>
          </div>

          <div className="header-right">
            <Link
              to="/dashboard"
              className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            >
              Dashboard
            </Link>

            <div className="user-menu">
              <button
                className="user-button btn btn-ghost"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <FiUser />
              </button>

              {showDropdown && (
                <div className="dropdown-menu">
                  <button
                    className="dropdown-item"
                    onClick={() => navigate('/')}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="chat-content">
          <div className="messages-container">
            <div className="messages-list">
              {messages.length === 0 && (
                <div className="welcome-message">
                  <div className="welcome-icon">
                    <FaUserAstronaut />
                  </div>
                  <h2>Welcome to MarWin AI</h2>
                  <p>Your intelligent marketing assistant. Ask me anything about your campaigns, analytics, or strategy.</p>
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.sender === 'user' ? 'message-user' : 'message-bot'} fade-in`}
                >
                  <div className="message-avatar">
                    {msg.sender === 'user' ? <FiUser /> : <FaUserAstronaut />}
                  </div>
                  <div className="message-content">
                    <div className="message-bubble">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                    <div className="message-time">
                      {msg.timestamp?.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="message message-bot fade-in">
                  <div className="message-avatar">
                    <FaUserAstronaut />
                  </div>
                  <div className="message-content">
                    <div className="message-bubble loading-message">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {showPrompts && (
              <div className="prompt-suggestions">
                <h3>Try asking:</h3>
                <div className="prompt-grid">
                  {prompts.map((prompt, index) => (
                    <button
                      key={index}
                      className="prompt-card"
                      onClick={() => handlePromptClick(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="input-container">
            <div className="input-wrapper">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your marketing data..."
                className="message-input"
                rows={1}
                style={{
                  minHeight: '44px',
                  maxHeight: '120px',
                  resize: 'none',
                }}
              />
              
              <div className="input-actions">
                <button
                  className={`voice-button ${isListening ? 'listening' : ''}`}
                  onClick={toggleVoiceInput}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? <FiMicOff /> : <FiMic />}
                </button>
                
                <button
                  className="send-button btn btn-primary"
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                >
                  <FiSend />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
