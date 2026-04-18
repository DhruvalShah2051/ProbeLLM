// src/components/Navbar.jsx
import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  const isHome = location.pathname === "/";

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" style={{ textDecoration: "none" }}>
          <span className="navbar-logo">⚡</span>
          <span className="navbar-title">ProbeLLM</span>
        </Link>
      </div>

      <div className="navbar-right">
        {!isHome && (
          <Link to="/" className="navbar-back">
            ← Dashboard
          </Link>
        )}
        <span className="navbar-status">
          <span className="navbar-status-dot" />
          Live
        </span>
      </div>
    </nav>
  );
}

export default Navbar;