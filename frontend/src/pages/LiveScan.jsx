// src/pages/LiveScan.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/LiveScan.css";

function getSeverityStyle(severity) {
  switch (severity) {
    case "critical": return { bg: "rgba(239,68,68,0.12)", color: "#EF4444", border: "#EF4444" };
    case "high":     return { bg: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "#F59E0B" };
    case "medium":   return { bg: "rgba(59,130,246,0.12)", color: "#3B82F6", border: "#3B82F6" };
    case "low":      return { bg: "rgba(34,197,94,0.12)", color: "#22C55E", border: "#22C55E" };
    default:         return { bg: "rgba(255,255,255,0.05)", color: "#666", border: "#333" };
  }
}

function StatusBadge({ status }) {
  const styles = {
    vulnerable: { bg: "rgba(239,68,68,0.15)", color: "#EF4444" },
    passed:     { bg: "rgba(34,197,94,0.15)", color: "#22C55E" },
    failed:     { bg: "rgba(107,114,128,0.15)", color: "#6B7280" },
  };
  const s = styles[status] || styles.failed;
  return (
    <span className="ls-badge" style={{ background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

function AttackItem({ attack }) {
  const [expanded, setExpanded] = useState(false);
  const sevStyle = getSeverityStyle(attack.severity);

  // Support both WS event shape and REST API shape
  const name     = attack.attack_name  || attack.template_id || "—";
  const category = attack.category     || "—";
  const status   = attack.status       || attack.success     || "—";
  const severity = attack.severity;
  const score    = attack.score        ?? attack.judge_score  ?? null;
  const payload  = attack.payload;
  const response = attack.response;
  const reasoning= attack.reasoning    || attack.judge_reasoning || null;

  return (
    <div className="ls-attack" style={{ borderLeft: `3px solid ${sevStyle.border}` }}>
      <div className="ls-attack-top" onClick={() => setExpanded((v) => !v)}>
        <div className="ls-attack-left">
          <span className="ls-attack-name">{name}</span>
          <span className="ls-cat-pill">{category}</span>
        </div>
        <div className="ls-attack-right">
          <StatusBadge status={status} />
          {severity && (
            <span className="ls-badge" style={{ background: sevStyle.bg, color: sevStyle.color }}>
              {severity}
            </span>
          )}
          {score != null && (
            <span className="ls-score">{(score * 100).toFixed(0)}%</span>
          )}
          <span className="ls-expand">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="ls-attack-details">
          {payload && (
            <div className="ls-detail-block">
              <div className="ls-detail-label">Payload</div>
              <pre className="ls-pre">{payload}</pre>
            </div>
          )}
          {response && (
            <div className="ls-detail-block">
              <div className="ls-detail-label">Response</div>
              <pre className="ls-pre">{response}</pre>
            </div>
          )}
          {reasoning && (
            <div className="ls-detail-block">
              <div className="ls-detail-label">Judge reasoning</div>
              <pre className="ls-pre">{reasoning}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const POLL_INTERVAL = 3000;

function LiveScan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const wsRef      = useRef(null);
  const pollRef    = useRef(null);
  const attackIds  = useRef(new Set()); // track seen attack ids to avoid duplicates

  const [scan, setScan]           = useState(null);
  const [attacks, setAttacks]     = useState([]);
  const [progress, setProgress]   = useState({ completed: 0, total: 0 });
  const [counters, setCounters]   = useState({ vulnerable: 0, passed: 0, failed: 0 });
  const [scanDone, setScanDone]   = useState(false);
  const [scanFailed, setScanFailed] = useState(null);
  const [connected, setConnected] = useState(false);
  const [mode, setMode]           = useState("connecting"); // "connecting" | "ws" | "polling"

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const handleScanComplete = useCallback(() => {
    setScanDone(true);
    stopPolling();
    wsRef.current?.close();
  }, []);

  // ── POLLING FALLBACK ──────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollRef.current) return; // already polling
    setMode("polling");

    const poll = async () => {
      try {
        const [scanRes, attacksRes] = await Promise.all([
          api.get(`/api/scans/${id}`),
          api.get(`/api/scans/${id}/attacks`),
        ]);

        const scanData = scanRes.data;
        setScan(scanData);
        setProgress({
          completed: scanData.completed_attacks ?? 0,
          total:     scanData.total_attacks     ?? 0,
        });

        // Add only new attacks (avoid duplicates)
        const newAttacks = attacksRes.data.filter((a) => !attackIds.current.has(a.id));
        if (newAttacks.length > 0) {
          newAttacks.forEach((a) => attackIds.current.add(a.id));
          setAttacks((prev) => [...newAttacks.reverse(), ...prev]);

          // Recount from full list
          const all = attacksRes.data;
          setCounters({
            vulnerable: all.filter((a) => a.status === "vulnerable").length,
            passed:     all.filter((a) => a.status === "passed").length,
            failed:     all.filter((a) => a.status === "failed").length,
          });
        }

        if (scanData.status === "completed") handleScanComplete();
        if (scanData.status === "failed")    setScanFailed("Scan failed on the backend.");
      } catch (_) {}
    };

    poll(); // immediate first call
    pollRef.current = setInterval(poll, POLL_INTERVAL);
  }, [id, handleScanComplete]);

  // ── WEBSOCKET ─────────────────────────────────────────────────────
  const openWebSocket = useCallback(() => {
    const token  = localStorage.getItem("token");
    const wsBase = import.meta.env.VITE_WS_BASE_URL;
    const ws = new WebSocket(`${wsBase}/ws/scans/${id}?token=${token}`);
    wsRef.current = ws;

    // If no scan_started within 4s, fall back to polling
    const wsTimeout = setTimeout(() => {
      if (mode !== "ws") startPolling();
    }, 4000);

    ws.onopen  = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      clearTimeout(wsTimeout);
      // If scan not done yet, switch to polling
      if (!scanDone) startPolling();
    };
    ws.onerror = () => {
      clearTimeout(wsTimeout);
      startPolling();
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMode("ws");
      clearTimeout(wsTimeout);

      if (data.event === "scan_started") {
        setProgress({ completed: 0, total: data.total_attacks });
      }

      if (data.event === "attack_completed") {
        setProgress({ completed: data.completed_attacks, total: data.total_attacks });
        if (!attackIds.current.has(data.attack_id)) {
          attackIds.current.add(data.attack_id);
          setAttacks((prev) => [data, ...prev]);
          setCounters((prev) => ({
            vulnerable: prev.vulnerable + (data.status === "vulnerable" ? 1 : 0),
            passed:     prev.passed     + (data.status === "passed"     ? 1 : 0),
            failed:     prev.failed     + (data.status === "failed"     ? 1 : 0),
          }));
        }
      }

      if (data.event === "scan_completed") handleScanComplete();
      if (data.event === "scan_failed")    setScanFailed(data.reason || "Scan failed.");
    };
  }, [id, mode, scanDone, startPolling, handleScanComplete]);

  // ── INIT ─────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get(`/api/scans/${id}`);
        setScan(res.data);
        if (res.data.status === "completed") {
          navigate(`/scans/${id}/report`, { replace: true });
          return;
        }
        // If already running, start polling immediately + try WS
        if (res.data.status === "running") {
          startPolling();
        }
      } catch (_) {}
      openWebSocket();
    };

    init();

    return () => {
      stopPolling();
      wsRef.current?.close();
    };
  }, [id]);

  const pct = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <div className="ls-page">

      {/* NAV */}
      <nav className="ls-nav">
        <div className="ls-nav-logo">⚡ ProbeLLM</div>
        <div className="ls-nav-right">
          <span className="ls-mode-pill">
            {mode === "polling" ? "⟳ polling" : ""}
          </span>
          <span className={`ls-conn ${connected ? "connected" : "disconnected"}`}>
            <span className="ls-conn-dot" />
            {connected ? "Connected" : mode === "polling" ? "Polling" : "Connecting..."}
          </span>
        </div>
      </nav>

      <div className="ls-content">

        {/* HEADER */}
        <div className="ls-header">
          <div className="ls-eyebrow">Live scan</div>
          <h1 className="ls-title">{scan?.target_url || "Loading..."}</h1>
          <div className="ls-meta">
            {scan?.target_model && <span className="ls-meta-item">{scan.target_model}</span>}
            {scan?.attack_categories?.map((c) => (
              <span key={c} className="ls-meta-item">{c}</span>
            ))}
          </div>
        </div>

        {/* PROGRESS */}
        <div className="ls-progress-section">
          <div className="ls-progress-bar-wrap">
            <div className="ls-progress-bar" style={{ width: `${pct}%` }} />
          </div>
          <div className="ls-progress-label">
            {progress.completed} / {progress.total || "?"} attacks
            <span className="ls-pct">{pct}%</span>
          </div>
        </div>

        {/* COUNTERS */}
        <div className="ls-counters">
          {[
            { label: "Total",      value: progress.total || "—",  color: "#e8e8e8" },
            { label: "Vulnerable", value: counters.vulnerable,     color: "#EF4444" },
            { label: "Passed",     value: counters.passed,         color: "#22C55E" },
            { label: "Failed",     value: counters.failed,         color: "#6B7280" },
          ].map(({ label, value, color }) => (
            <div key={label} className="ls-counter">
              <div className="ls-counter-value" style={{ color }}>{value}</div>
              <div className="ls-counter-label">{label}</div>
            </div>
          ))}
        </div>

        {/* SCAN FAILED */}
        {scanFailed && (
          <div className="ls-failed">
            <div className="ls-failed-title">Scan failed</div>
            <div className="ls-failed-reason">{scanFailed}</div>
            <button className="ls-btn-ghost" onClick={() => navigate("/dashboard")}>
              ← Back to dashboard
            </button>
          </div>
        )}

        {/* SCAN COMPLETED */}
        {scanDone && (
          <div className="ls-done">
            <span className="ls-done-icon">✓</span>
            Scan complete —{" "}
            <button className="ls-done-link" onClick={() => navigate(`/scans/${id}/report`)}>
              View full report →
            </button>
          </div>
        )}

        {/* ATTACK FEED */}
        <div className="ls-feed-header">
          Attack feed
          <span className="ls-feed-count">{attacks.length}</span>
        </div>

        <div className="ls-feed">
          {attacks.length === 0 ? (
            <div className="ls-feed-empty">
              {mode === "polling" ? "Fetching attacks..." : "Waiting for attacks..."}
            </div>
          ) : (
            attacks.map((a, i) => <AttackItem key={a.id || i} attack={a} />)
          )}
        </div>

      </div>
    </div>
  );
}

export default LiveScan;