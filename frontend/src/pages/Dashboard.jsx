// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Dashboard.css";

function getStatusColor(status) {
  switch (status) {
    case "completed": return { bg: "#DCFCE7", color: "#16A34A" };
    case "running":   return { bg: "#DBEAFE", color: "#2563EB" };
    case "queued":    return { bg: "#F3F4F6", color: "#6B7280" };
    case "failed":    return { bg: "#FEE2E2", color: "#DC2626" };
    default:          return { bg: "#F3F4F6", color: "#6B7280" };
  }
}

function getSeverityColor(severity) {
  switch (severity) {
    case "critical": return { bg: "#FEE2E2", color: "#DC2626" };
    case "high":     return { bg: "#FEF3C7", color: "#B45309" };
    case "medium":   return { bg: "#DBEAFE", color: "#1D4ED8" };
    case "low":      return { bg: "#DCFCE7", color: "#16A34A" };
    default:         return { bg: "#F3F4F6", color: "#6B7280" };
  }
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ScanCard({ scan }) {
  const navigate = useNavigate();
  const statusStyle = getStatusColor(scan.status);
  const severityStyle = getSeverityColor(scan.overall_severity);

  const handleClick = () => {
    if (scan.status === "completed") navigate(`/scans/${scan.id}/report`);
    else if (scan.status === "running") navigate(`/scans/${scan.id}/live`);
  };

  return (
    <div className="scan-card" onClick={handleClick}>
      <div className="scan-card-top">
        <div className="scan-card-target">
          <div className="scan-card-url">{scan.target_url}</div>
          <div className="scan-card-model">{scan.target_model}</div>
        </div>
        <span className="pill" style={{ background: statusStyle.bg, color: statusStyle.color }}>
          {scan.status}
        </span>
      </div>

      <div className="scan-card-categories">
        {scan.attack_categories?.map((cat) => (
          <span key={cat} className="category-pill">{cat}</span>
        ))}
      </div>

      <div className="scan-card-stats">
        <div className="scan-stat">
          <div className="scan-stat-value">{scan.total_attacks ?? "—"}</div>
          <div className="scan-stat-label">Total</div>
        </div>
        <div className="scan-stat">
          <div className="scan-stat-value" style={{ color: "#DC2626" }}>
            {scan.vulnerabilities_found ?? "—"}
          </div>
          <div className="scan-stat-label">Vulnerable</div>
        </div>
        <div className="scan-stat">
          <div className="scan-stat-value">{scan.completed_attacks ?? "—"}</div>
          <div className="scan-stat-label">Completed</div>
        </div>
        {scan.overall_severity && (
          <span className="pill" style={{ background: severityStyle.bg, color: severityStyle.color, alignSelf: "center" }}>
            {scan.overall_severity}
          </span>
        )}
      </div>

      <div className="scan-card-footer">
        {formatDate(scan.created_at)}
      </div>
    </div>
  );
}

function Dashboard() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const res = await api.get("/api/scans/");
        setScans(res.data);
      } catch (err) {
        setError("Failed to load scans.");
      } finally {
        setLoading(false);
      }
    };
    fetchScans();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (_) {}
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="db-page">
      <nav className="db-nav">
        <div className="db-nav-logo">⚡ ProbeLLM</div>
        <div className="db-nav-right">
          <Link to="/scans/new" className="btn-primary">+ New Scan</Link>
          <button className="btn-ghost" onClick={handleLogout}>Log out</button>
        </div>
      </nav>

      <div className="db-content">
        <div className="db-header">
          <h1 className="db-title">Dashboard</h1>
          <p className="db-subtitle">Your scan history</p>
        </div>

        {loading ? (
          <div className="db-state">Loading scans...</div>
        ) : error ? (
          <div className="db-state error">{error}</div>
        ) : scans.length === 0 ? (
          <div className="db-empty">
            <div className="db-empty-icon">🔍</div>
            <div className="db-empty-title">No scans yet</div>
            <div className="db-empty-desc">Launch your first scan to get started</div>
            <Link to="/scans/new" className="btn-primary" style={{ marginTop: "20px" }}>
              + New Scan
            </Link>
          </div>
        ) : (
          <div className="scans-grid">
            {scans.map((scan) => (
              <ScanCard key={scan.id} scan={scan} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;