import React from 'react';
import '../styles/ProgressBar.css';

const ProgressBar = ({ stages, currentStage }) => {
  const progress = currentStage >= 0 ? ((currentStage + 1) / stages.length) * 100 : 0;

  return (
    <div className="progress-container">
      <div className="progress-header">
        <h3>Generating Your Strategy</h3>
        <p>Please wait while we craft your personalized campaign strategy</p>
      </div>

      <div className="stages-container">
        {stages.map((stage, index) => (
          <div
            key={stage}
            className={`stage-item ${
              index <= currentStage ? 'stage-active' : ''
            } ${index < currentStage ? 'stage-completed' : ''}`}
          >
            <div className="stage-indicator">
              {index < currentStage ? (
                <svg
                  className="stage-check"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <span className="stage-number">{index + 1}</span>
              )}
            </div>
            <div className="stage-content">
              <h4 className="stage-title">{stage}</h4>
              {index === currentStage && (
                <div className="stage-loading">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="progress-text">
        {currentStage >= 0 && currentStage < stages.length
          ? `${stages[currentStage]}...`
          : 'Initializing...'}
      </div>
    </div>
  );
};

export default ProgressBar;
