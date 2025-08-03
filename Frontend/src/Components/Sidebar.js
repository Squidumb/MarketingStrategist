import { FiZap, FiMessageSquare, FiBarChart2 } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", icon: <FiBarChart2 />, label: "Dashboard" },
    { path: "/chatbot", icon: <FiMessageSquare />, label: "Chatbot" },
    { path: "/campaign-strategy", icon: <FiZap />, label: "Strategy" },
  ];

  return (
    <>
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <p
            className="display-3 fw-bold mb-4"
            style={{
              fontFamily: "'Raleway', sans-serif",
              color: "#f9f5f0",
              fontSize: "2rem",
              textShadow: "2px 2px 8px rgba(156, 0, 51, 0.5)",
            }}
          >
            MarWin
          </p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${
                location.pathname === item.path ? "active" : ""
              }`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <style jsx>{`
        .sidebar {
          width: 0;
          background: linear-gradient(180deg, #060829 0%, #1c59c2 100%);
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
          overflow: hidden;
          transition: width 0.3s ease;
        }

        .sidebar.open {
          width: 250px;
        }

        .sidebar-header {
          padding: 1.5rem;
          height: 90px;
          display: flex;
          align-items: center;
        }

        .sidebar-header p {
          color: white;
          font-weight: 600;
          margin: 0;
          font-size: 1.2rem;
          letter-spacing: 1px;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          width: 250px;
        }

        .nav-item {
          background: #1e3a8a; /* Blue button color */
          border: none;
          color: #ffffff; /* White text color */
          padding: 12px 18px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          font-family: "Raleway", sans-serif;
          font-weight: 600;
          text-align: left;
          transition: all 0.3s ease;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Slight shadow */
        }

        .nav-item:hover {
          background: #1e3a8a; /* Keep the blue background */
          color: #ffffff; /* White text on hover */
          border: 2px solid rgba(255, 255, 255, 0.5); /* Add a white border */
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3); /* More pronounced shadow */
        }

        .nav-item.active {
          background: #1e3a8a; /* Blue background for active state */
          color: #ffffff; /* White text for active state */
          font-weight: 700;
          border: 2px solid #ffffff; /* White border for active state */
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); /* Consistent shadow for active */
        }

        .nav-icon {
          margin-right: 12px;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
        }
      `}</style>
    </>
  );
}
