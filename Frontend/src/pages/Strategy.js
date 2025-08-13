import React, { useState } from 'react';
import {
  FiZap,
  FiUser,
  FiDownload,
  FiArrowLeft,
  FiMenu,
  FiMail,
  FiEdit2,
  FiAward,
  FiMousePointer,
  FiSend,
  FiFileText,
  FiShare2,
} from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import { Document, Paragraph, Packer, TextRun } from 'docx';
import ReactMarkdown from 'react-markdown';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import ProgressBar from '../Components/ProgressBar';
import '../styles/Strategy.css';

export default function CampaignStrategyPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [generatedStrategy, setGeneratedStrategy] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(-1);
  const [alertMessage, setAlertMessage] = useState(null);
  const [tweetMessage, setTweetMessage] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const stages = ['Querying', 'Retrieving', 'Generating'];

  const samplePrompts = [
    'Generate me an Instagram campaign for my top 2 performing categories',
    'Create a campaign plan for Housing Loans using brick by brick as the theme',
    'There are new government schemes coming up, search for them and generate me a professional Twitter post introducing them!',
  ];

  const handleGenerate = async () => {
    setIsLoading(true);
    setCurrentStage(0);
    setGeneratedStrategy('');

    for (let i = 0; i < stages.length; i++) {
      setCurrentStage(i);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    try {
      const response = await fetch('http://localhost:5001/campaign-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: selectedCategory }),
      });

      const data = await response.json();
      setGeneratedStrategy(data.response);
    } catch (error) {
      console.error('Error generating strategy:', error);
      setGeneratedStrategy('⚠️ Failed to generate strategy. Please try again later.');
    } finally {
      setIsLoading(false);
      setCurrentStage(-1);
    }
  };

  const handleSendEmail = async () => {
    const toEmail = document.getElementById('toEmail').value;

    if (!toEmail) {
      setAlertMessage('Please enter email address');
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: toEmail,
          content: generatedStrategy,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAlertMessage('Email sent successfully!');
    } catch (error) {
      console.error('Error:', error);
      setAlertMessage('Failed to send email. Try again!');
    }
  };

  const handleDownload = async (format) => {
    try {
      if (format === 'pdf') {
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

        doc.save('campaign_strategy.pdf');
      } else if (format === 'docx') {
        const doc = new Document({
          sections: [
            {
              properties: {},
              children: generatedStrategy.split('\n').map(
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
        const link = document.createElement('a');
        link.href = url;
        link.download = 'campaign_strategy.docx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
      setAlertMessage('Failed to generate document. Please try again.');
    }
  };

  const handlePostToTwitter = async () => {
    const quoteRegex = /"(.*?)"/;
    const match = generatedStrategy.match(quoteRegex);
    const strategy = match ? match[1] : '';

    if (strategy) {
      try {
        const response = await fetch('http://localhost:5001/post-to-twitter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ strategy: strategy }),
        });

        const result = await response.json();

        if (response.ok) {
          setTweetMessage(result.message);
        } else {
          setTweetMessage(`Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error posting to Twitter:', error);
        setTweetMessage('Failed to post to Twitter. Please try again later.');
      }
    } else {
      setTweetMessage('No valid strategy found in the generated content.');
    }
  };

  return (
    <div className="strategy-container">
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className={`strategy-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="strategy-header">
          <div className="header-left">
            <button
              className="menu-toggle btn btn-ghost"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FiMenu />
            </button>
            <h1 className="strategy-title">Campaign Strategy</h1>
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

        <div className="strategy-content">
          {!generatedStrategy ? (
            <div className="strategy-generator">
              <div className="generator-card card">
                <div className="card-header">
                  <div className="header-icon">
                    <FiZap />
                  </div>
                  <h2>Campaign Strategy Generator</h2>
                  <p>Create powerful marketing campaigns with AI assistance</p>
                </div>

                <div className="card-body">
                  <div className="generator-layout">
                    <div className="input-section">
                      <div className="form-group">
                        <label className="form-label">
                          <FiEdit2 />
                          Describe Your Campaign
                        </label>
                        <textarea
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          placeholder="Enter your campaign requirements..."
                          className="campaign-input"
                          rows={6}
                        />
                      </div>

                      <button
                        onClick={handleGenerate}
                        disabled={!selectedCategory || isLoading}
                        className="generate-button btn btn-primary"
                      >
                        {isLoading ? (
                          <>
                            <div className="loading-spinner"></div>
                            Generating Strategy...
                          </>
                        ) : (
                          <>
                            <FiZap />
                            Generate Strategy
                          </>
                        )}
                      </button>
                    </div>

                    <div className="prompts-section">
                      <h3>
                        <FiAward />
                        Sample Prompts
                      </h3>
                      <div className="prompts-grid">
                        {samplePrompts.map((prompt, index) => (
                          <button
                            key={index}
                            className="prompt-card"
                            onClick={() => setSelectedCategory(prompt)}
                          >
                            <FiMousePointer />
                            <span>{prompt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isLoading && (
                <div className="progress-section">
                  <ProgressBar stages={stages} currentStage={currentStage} />
                </div>
              )}
            </div>
          ) : (
            <div className="strategy-result">
              <div className="result-layout">
                <div className="strategy-display">
                  <div className="card">
                    <div className="card-header">
                      <h2>Your Campaign Strategy</h2>
                      <button
                        onClick={() => setGeneratedStrategy('')}
                        className="btn btn-secondary"
                      >
                        <FiArrowLeft />
                        Back
                      </button>
                    </div>

                    <div className="card-body">
                      <div className="strategy-content-wrapper">
                        <ReactMarkdown>
                          {generatedStrategy}
                        </ReactMarkdown>
                      </div>
                    </div>

                    <div className="card-footer">
                      <div className="action-buttons">
                        <button
                          onClick={() => handleDownload('pdf')}
                          className="btn btn-secondary"
                        >
                          <FiFileText />
                          Save as PDF
                        </button>
                        <button
                          onClick={() => handleDownload('docx')}
                          className="btn btn-secondary"
                        >
                          <FiDownload />
                          Save as DOCX
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="strategy-actions">
                  <div className="card">
                    <div className="card-header">
                      <h3>
                        <FiMail />
                        Share via Email
                      </h3>
                    </div>
                    <div className="card-body">
                      <p className="email-description">
                        Send this strategy directly to your team members.
                      </p>
                      <div className="email-form">
                        <input
                          id="toEmail"
                          type="email"
                          placeholder="recipient@email.com"
                          className="input"
                        />
                        <button
                          onClick={handleSendEmail}
                          className="btn btn-primary"
                        >
                          <FiSend />
                          Send Email
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handlePostToTwitter}
                    className="btn btn-secondary twitter-button"
                  >
                    <FiShare2 />
                    Post to Twitter
                  </button>

                  {(alertMessage || tweetMessage) && (
                    <div className={`alert ${alertMessage?.includes('success') || tweetMessage?.includes('success') ? 'alert-success' : 'alert-error'}`}>
                      {alertMessage || tweetMessage}
                      <button
                        onClick={() => {
                          setAlertMessage(null);
                          setTweetMessage(null);
                        }}
                        className="alert-close"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
