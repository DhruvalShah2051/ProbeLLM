import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getStatusColor, getSeverityColor } from "../utils/statusHelpers";

function ScanDetails() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [attacks, setAttacks] = useState([]);
  const [attacksLoading, setAttacksLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const scanRes = await fetch(`http://127.0.0.1:8000/api/scans/${id}`);
        const scanData = await scanRes.json();
        setScan(scanData);

        const attackRes = await fetch(
          `http://127.0.0.1:8000/api/scans/${id}/attacks`
        );
        const attackData = await attackRes.json();
        setAttacks(attackData);
      } catch (err) {
        console.error("Error fetching scan details:", err);
        setError("Failed to load scan data. Is the backend running?");
      } finally {
        setAttacksLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Compute summary counts from attacks
  const summary = {
    critical: attacks.filter(a => a.severity === "critical").length,
    high: attacks.filter(a => a.severity === "high").length,
    medium: attacks.filter(a => a.severity === "medium").length,
    low: attacks.filter(a => a.severity === "low").length,
    pass: attacks.filter(a => a.success === "pass").length,
    fail: attacks.filter(a => a.success === "fail").length,
    error: attacks.filter(a => a.success === "error").length,
  };

  if (!scan && !error) return <p>Loading scan details...</p>;
  if (error) return <p style={{ color: "#DC2626" }}>{error}</p>;

  return (
    <div className="dashboard-container">

      {/* SCAN HEADER */}
      <div className="scan-card" style={{ marginBottom: "20px" }}>
        <h2 style={{ marginBottom: "10px" }}>{scan.target_name}</h2>
        <p><strong>URL:</strong> {scan.target_url}</p>
        <p>
          <strong>Status:</strong>{" "}
          <span
            className="status-badge"
            style={{ backgroundColor: getStatusColor(scan.status) }}
          >
            {scan.status}
          </span>
        </p>
      </div>

      {/* SUMMARY BAR */}
      {!attacksLoading && attacks.length > 0 && (
        <div className="summary-bar">

          {/* SEVERITY BREAKDOWN */}
          <div className="summary-bar-group">
            <span className="summary-bar-label">Severity</span>
            <div className="summary-bar-pills">
              {summary.critical > 0 && (
                <span className="summary-pill" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                  🔴 {summary.critical} Critical
                </span>
              )}
              {summary.high > 0 && (
                <span className="summary-pill" style={{ background: "#FEF3C7", color: "#B45309" }}>
                  🟠 {summary.high} High
                </span>
              )}
              {summary.medium > 0 && (
                <span className="summary-pill" style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
                  🔵 {summary.medium} Medium
                </span>
              )}
              {summary.low > 0 && (
                <span className="summary-pill" style={{ background: "#DCFCE7", color: "#16A34A" }}>
                  🟢 {summary.low} Low
                </span>
              )}
            </div>
          </div>

          <div className="summary-bar-divider" />

          {/* RESULT BREAKDOWN */}
          <div className="summary-bar-group">
            <span className="summary-bar-label">Results</span>
            <div className="summary-bar-pills">
              {summary.pass > 0 && (
                <span className="summary-pill" style={{ background: "#DCFCE7", color: "#16A34A" }}>
                  ✓ {summary.pass} Pass
                </span>
              )}
              {summary.fail > 0 && (
                <span className="summary-pill" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                  ✗ {summary.fail} Fail
                </span>
              )}
              {summary.error > 0 && (
                <span className="summary-pill" style={{ background: "#F3F4F6", color: "#6B7280" }}>
                  ⚠ {summary.error} Error
                </span>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ATTACKS HEADER */}
      <h2 className="scans-title">Attacks ({attacks.length})</h2>

      {/* ATTACKS LIST */}
      {attacksLoading ? (
        <p>Loading attacks...</p>
      ) : attacks.length === 0 ? (
        <p>No attacks found</p>
      ) : (
        <div className="scan-list">
          {attacks.map((attack) => (
            <Link
              to={`/scan/${id}/attack/${attack.id}`}
              key={attack.id}
              state={{ attack }}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="scan-card attack-summary-card">

                {/* SEVERITY + CATEGORY ROW */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getSeverityColor(attack.severity) }}
                  >
                    {attack.severity}
                  </span>
                  <span style={{ color: "#6B7280", fontSize: "0.85rem" }}>
                    {attack.category}
                  </span>
                </div>

                {/* PAYLOAD PREVIEW */}
                <p style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "#111827" }}>
                  <strong>Payload:</strong>{" "}
                  {attack.payload?.split("\n")[0].slice(0, 80)}
                  {attack.payload?.length > 80 ? "…" : ""}
                </p>

                {/* SUCCESS STATUS */}
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: "500",
                    backgroundColor:
                      attack.success === "pass" ? "#DCFCE7" :
                      attack.success === "fail" ? "#FEE2E2" : "#F3F4F6",
                    color:
                      attack.success === "pass" ? "#16A34A" :
                      attack.success === "fail" ? "#DC2626" : "#6B7280",
                  }}
                >
                  {attack.success === "pass" ? "✓ Pass" :
                   attack.success === "fail" ? "✗ Fail" : attack.success}
                </span>

              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}

export default ScanDetails;