// src/components/DashboardSummary.jsx
import React from "react";
import { scans } from "../services/mockData";

function DashboardSummary() {
  const total = scans.length;
  const completed = scans.filter(s => s.status === "completed").length;
  const running = scans.filter(s => s.status === "running").length;
  const failed = scans.filter(s => s.status === "failed").length;

  const summary = [
    { label: "Total Scans", value: total, color: "#4F46E5", icon: "📊" },
    { label: "Completed", value: completed, color: "#16A34A", icon: "✅" },
    { label: "Running", value: running, color: "#F59E0B", icon: "⏳" },
    { label: "Failed", value: failed, color: "#DC2626", icon: "⚠️" },
  ];

  return (
    <div className="summary-container">
      {summary.map((item) => (
        <div
          key={item.label}
          className="summary-card"
          style={{ borderTop: `4px solid ${item.color}` }}
        >
          <div className="summary-icon">{item.icon}</div>
          <div className="summary-info">
            <div className="summary-value">{item.value}</div>
            <div className="summary-label">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default DashboardSummary;