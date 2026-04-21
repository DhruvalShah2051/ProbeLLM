// src/pages/Report.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Report.css";

function getSeverityStyle(severity) {
  switch (severity) {
    case "critical": return { bg: "rgba(239,68,68,0.12)", color: "#EF4444" };
    case "high":     return { bg: "rgba(245,158,11,0.12)", color: "#F59E0B" };
    case "medium":   return { bg: "rgba(59,130,246,0.12)", color: "#3B82F6" };
    case "low":      return { bg: "rgba(34,197,94,0.12)", color: "#22C55E" };
    default:         return { bg: "rgba(255,255,255,0.05)", color: "#666" };
  }
}

function getStatusStyle(status) {
  switch (status) {
    case "vulnerable": return { bg: "rgba(239,68,68,0.12)", color: "#EF4444" };
    case "passed":     return { bg: "rgba(34,197,94,0.12)", color: "#22C55E" };
    default:           return { bg: "rgba(107,114,128,0.12)", color: "#6B7280" };
  }
}

function formatDuration(start, end) {
  if (!start || !end) return "—";
  const ms = new Date(end) - new Date(start);
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function AttackRow({ attack }) {
  const [expanded, setExpanded] = useState(false);
  const sevStyle = getSeverityStyle(attack.severity);
  const statStyle = getStatusStyle(attack.status);

  return (
    <>
      <div className="rp-row" onClick={() => setExpanded((v) => !v)}>
        <div className="rp-row-name">
          <span className="rp-attack-name">{attack.attack_name}</span>
          <span className="rp-cat-pill">{attack.category}</span>
        </div>
        <div className="rp-row-meta">
          <span className="rp-badge" style={{ background: statStyle.bg, color: statStyle.color }}>
            {attack.status}
          </span>
          {attack.severity && (
            <span className="rp-badge" style={{ background: sevStyle.bg, color: sevStyle.color }}>
              {attack.severity}
            </span>
          )}
          {attack.judge_score != null && (
            <span className="rp-score">{(attack.judge_score * 100).toFixed(0)}%</span>
          )}
          {attack.response_time_ms != null && (
            <span className="rp-time">{attack.response_time_ms}ms</span>
          )}
          <span className="rp-expand">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="rp-detail">
          {attack.payload && (
            <div className="rp-detail-block">
              <div className="rp-detail-label">Payload</div>
              <pre className="rp-pre">{attack.payload}</pre>
            </div>
          )}
          {attack.response && (
            <div className="rp-detail-block">
              <div className="rp-detail-label">Model response</div>
              <pre className="rp-pre">{attack.response}</pre>
            </div>
          )}
          {attack.judge_reasoning && (
            <div className="rp-detail-block">
              <div className="rp-detail-label">Judge reasoning</div>
              <pre className="rp-pre">{attack.judge_reasoning}</pre>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function Report() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [scan, setScan] = useState(null);
  const [attacks, setAttacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scanRes, attacksRes] = await Promise.all([
          api.get(`/api/scans/${id}`),
          api.get(`/api/scans/${id}/attacks`),
        ]);
        setScan(scanRes.data);
        setAttacks(attacksRes.data);
      } catch (err) {
        setError("Failed to load report.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleExport = async () => {
    try {
      const res = await api.get(`/api/scans/${id}/export`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `probellm-scan-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (_) {
      alert("Export failed.");
    }
  };

  if (loading) return <div className="rp-loading">Loading report...</div>;
  if (error)   return <div className="rp-loading error">{error}</div>;

  const sevStyle = getSeverityStyle(scan.overall_severity);

  // Severity breakdown
  const sevCounts = ["critical", "high", "medium", "low"].map((s) => ({
    label: s,
    count: attacks.filter((a) => a.severity === s).length,
    style: getSeverityStyle(s),
  }));

  // Categories for filter
  const categories = ["all", ...new Set(attacks.map((a) => a.category))];
  const statuses   = ["all", "vulnerable", "passed", "failed"];

  const filtered = attacks.filter((a) => {
    const catOk  = filterCategory === "all" || a.category === filterCategory;
    const statOk = filterStatus   === "all" || a.status    === filterStatus;
    return catOk && statOk;
  });

  return (
    <div className="rp-page">

      {/* NAV */}
      <nav className="rp-nav">
        <div className="rp-nav-logo">⚡ ProbeLLM</div>
        <div className="rp-nav-right">
          <button className="rp-btn-ghost" onClick={() => navigate("/dashboard")}>
            ← Dashboard
          </button>
          <button className="rp-btn-export" onClick={handleExport}>
            ↓ Export JSON
          </button>
        </div>
      </nav>

      <div className="rp-content">

        {/* HEADER */}
        <div className="rp-header">
          <div className="rp-eyebrow">Scan report</div>
          <h1 className="rp-title">{scan.target_url}</h1>
          <div className="rp-meta">
            <span className="rp-meta-item">{scan.target_model}</span>
            <span className="rp-meta-item">Judge: {scan.judge_provider} / {scan.judge_model}</span>
            <span className="rp-meta-item">Duration: {formatDuration(scan.started_at, scan.completed_at)}</span>
            <span className="rp-meta-item">{formatDate(scan.created_at)}</span>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="rp-summary">
          {[
            { label: "Total Attacks",       value: scan.total_attacks,        color: "#e8e8e8" },
            { label: "Vulnerable",          value: scan.vulnerabilities_found, color: "#EF4444" },
            { label: "Passed",              value: scan.total_attacks - scan.vulnerabilities_found, color: "#22C55E" },
            { label: "Overall Severity",    value: scan.overall_severity,      color: sevStyle.color,
              bg: sevStyle.bg },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="rp-stat-card" style={bg ? { background: bg, border: `1px solid ${color}33` } : {}}>
              <div className="rp-stat-value" style={{ color }}>{value ?? "—"}</div>
              <div className="rp-stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* SEVERITY BREAKDOWN */}
        <div className="rp-sev-bar">
          {sevCounts.map(({ label, count, style }) => count > 0 && (
            <span key={label} className="rp-sev-pill"
              style={{ background: style.bg, color: style.color }}>
              {count} {label}
            </span>
          ))}
        </div>

        {/* FILTERS */}
        <div className="rp-filters">
          <div className="rp-filter-group">
            <span className="rp-filter-label">Category</span>
            {categories.map((c) => (
              <button
                key={c}
                className={`rp-filter-btn ${filterCategory === c ? "active" : ""}`}
                onClick={() => setFilterCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="rp-filter-group">
            <span className="rp-filter-label">Status</span>
            {statuses.map((s) => (
              <button
                key={s}
                className={`rp-filter-btn ${filterStatus === s ? "active" : ""}`}
                onClick={() => setFilterStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ATTACK LIST */}
        <div className="rp-attacks-header">
          Attacks
          <span className="rp-attacks-count">{filtered.length}</span>
        </div>

        <div className="rp-attacks">
          {filtered.length === 0 ? (
            <div className="rp-empty">No attacks match the current filters</div>
          ) : (
            filtered.map((attack) => (
              <AttackRow key={attack.id} attack={attack} />
            ))
          )}
        </div>

      </div>
    </div>
  );
}

export default Report;