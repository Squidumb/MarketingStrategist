import React from 'react';
import { FiZap, FiMessageSquare, FiBarChart2, FiX } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: <FiBarChart2 />, label: 'Dashboard' },
    { path: '/chatbot', icon: <FiMessageSquare />, label: 'Chatbot' },
    { path: '/campaign-strategy', icon: <FiZap />, label: 'Strategy' },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <FiZap />
            </div>
            <span className="logo-text gradient-text">MarWin</span>
          </div>
          
          <button 
            className="sidebar-close"
            onClick={toggleSidebar}
          >
            <FiX />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'nav-item-active' : ''}`}
              onClick={() => {
                navigate(item.path);
                if (window.innerWidth < 768) {
                  toggleSidebar();
                }
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              <span>U</span>
            </div>
            <div className="user-info">
              <span className="user-name">User</span>
              <span className="user-role">Marketing Team</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
