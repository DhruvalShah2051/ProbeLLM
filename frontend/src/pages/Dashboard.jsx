import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardSummary from "../components/DashboardSummary";
import "./Dashboard.css";

function getStatusColor(status) {
  switch (status) {
    case "completed":
      return "#16A34A";
    case "running":
      return "#F59E0B";
    case "failed":
      return "#DC2626";
    default:
      return "#6B7280";
  }
}

function Dashboard() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/scans/");
        const data = await res.json();
        setScans(data);
      } catch (err) {
        console.error("Failed to fetch scans:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, []);

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">ProbeLLM Dashboard</h1>
      <p className="dashboard-subtitle">
        Overview of all scans and their statuses
      </p>

      <DashboardSummary />

      <h2 className="scans-title">Scans</h2>

      {loading ? (
        <p>Loading scans...</p>
      ) : (
        <div className="scan-list">
          {scans.map((scan) => (
            <Link
              to={`/scan/${scan.id}`}
              key={scan.id}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="scan-card">
                <h3>{scan.target_name}</h3>
                <p>
                  <strong>URL:</strong> {scan.target_url}
                </p>
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;