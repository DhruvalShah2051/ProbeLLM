import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardSummary from "../components/DashboardSummary";
import { getStatusColor } from "../utils/statusHelpers";

function Dashboard() {
  const [scans, setScans] = useState([]);
  const [attacks, setAttacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Step 1: fetch all scans
        const scansRes = await fetch("http://127.0.0.1:8000/api/scans/");
        const scansData = await scansRes.json();
        setScans(scansData);

        // Step 2: fetch attacks for every scan in parallel
        const attackResults = await Promise.all(
          scansData.map((scan) =>
            fetch(`http://127.0.0.1:8000/api/scans/${scan.id}/attacks`)
              .then((res) => res.json())
              .catch(() => []) // if one scan's attacks fail, return empty
          )
        );

        // Step 3: flatten all attacks into a single array
        const allAttacks = attackResults.flat();
        setAttacks(allAttacks);

      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load scans. Is the backend running?");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard-container">

      <h1 className="dashboard-title">ProbeLLM Dashboard</h1>
      <p className="dashboard-subtitle">
        Overview of all scans and their statuses
      </p>

      {/* KPI SECTION */}
      <DashboardSummary scans={scans} attacks={attacks} />

      {/* SCANS SECTION HEADER */}
      <div style={{ marginTop: "30px", marginBottom: "10px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "600" }}>
          Scan Activity
        </h2>
        <p style={{ color: "#6B7280", fontSize: "0.9rem" }}>
          Click on a scan to view detailed attack analysis
        </p>
      </div>

      {/* SCANS LIST */}
      {error ? (
        <p style={{ color: "#DC2626" }}>{error}</p>
      ) : loading ? (
        <p>Loading scans...</p>
      ) : scans.length === 0 ? (
        <p>No scans found</p>
      ) : (
        <div className="scan-list">
          {scans.map((scan) => (
            <Link
              to={`/scan/${scan.id}`}
              key={scan.id}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="scan-card">

                <h3 style={{ marginBottom: "8px" }}>
                  {scan.target_name}
                </h3>

                <p style={{ margin: "4px 0" }}>
                  <strong>URL:</strong> {scan.target_url}
                </p>

                <p style={{ margin: "4px 0" }}>
                  <strong>Status:</strong>{" "}
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(scan.status) }}
                  >
                    {scan.status}
                  </span>
                </p>

              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}

export default Dashboard;