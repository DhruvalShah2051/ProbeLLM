// src/components/DashboardSummary.jsx
import React, { useMemo } from "react";
import { scans } from "../services/mockData";
import { calculateMetrics } from "../utils/metrics";

function DashboardSummary() {
  const metrics = useMemo(() => {
    const total = scans?.length || 0;

    const completed = scans?.filter(s => s.status === "completed").length || 0;
    const running = scans?.filter(s => s.status === "running").length || 0;
    const failed = scans?.filter(s => s.status === "failed").length || 0;

    const allAttacks = scans?.flatMap(s => s.attacks || []) || [];
    const attackMetrics = calculateMetrics(allAttacks) || {};

    const successRate = Number(attackMetrics.successRate ?? 0);
    const failureRate = Number(attackMetrics.failureRate ?? 0);
    const totalAttacks = attackMetrics.totalAttacks ?? allAttacks.length;

    const avgAttacksPerScan =
      total > 0 ? (totalAttacks / total).toFixed(2) : "0.00";

    // 🧠 NEW: Intelligence Score (core KPI)
    const intelligenceScore = Math.round(
      (completed / (total || 1)) * 60 +
      (100 - successRate) * 0.4
    );

    return {
      total,
      completed,
      running,
      failed,
      successRate,
      failureRate,
      totalAttacks,
      avgAttacksPerScan,
      intelligenceScore,
    };
  }, []);

  const getRiskLevel = (score) => {
  if (score >= 75) return { label: "LOW", color: "#16A34A" };
  if (score >= 50) return { label: "MEDIUM", color: "#F59E0B" };
  return { label: "HIGH", color: "#DC2626" };
};
const getRiskStyle = (score) => {
  if (score >= 75) {
    return {
      boxShadow: "0 0 12px rgba(22, 163, 74, 0.35)",
      borderColor: "#16A34A",
    };
  }

  if (score >= 50) {
    return {
      boxShadow: "0 0 12px rgba(245, 158, 11, 0.35)",
      borderColor: "#F59E0B",
    };
  }

  return {
    boxShadow: "0 0 12px rgba(220, 38, 38, 0.35)",
    borderColor: "#DC2626",
  };
};

  const summary = [
    { label: "Total Scans", value: metrics.total, color: "#4F46E5", icon: "📊" },
    { label: "Completed", value: metrics.completed, color: "#16A34A", icon: "✅" },
    { label: "Running", value: metrics.running, color: "#F59E0B", icon: "⏳" },
    { label: "Failed", value: metrics.failed, color: "#DC2626", icon: "⚠️" },

    {
      label: "Attack Success Rate",
      value: `${metrics.successRate}%`,
      color: "#7C3AED",
      icon: "🧠",
    },
    {
      label: "Attack Failure Rate",
      value: `${metrics.failureRate}%`,
      color: "#EF4444",
      icon: "💥",
    },
    {
      label: "Total Attacks",
      value: metrics.totalAttacks,
      color: "#0EA5E9",
      icon: "🎯",
    },
    {
      label: "Avg Attacks / Scan",
      value: metrics.avgAttacksPerScan,
      color: "#F97316",
      icon: "📈",
    },

    // 🧠 NEW KPI CARD
    {
      label: "Scan Intelligence Score",
      value: `${metrics.intelligenceScore}/100`,
      color: "#111827",
      icon: "🧠",
    },
    {
  label: "Risk Level",
  value: getRiskLevel(metrics.intelligenceScore).label,
  color: getRiskLevel(metrics.intelligenceScore).color,
  icon: "🚨",
  style: getRiskStyle(metrics.intelligenceScore),
}
  ];

  return (
    <div className="summary-container">
      {summary.map((item) => (
        <div
          key={item.label}
          className="summary-card"
          style={{
  borderTop: `4px solid ${item.color}`,
  ...(item.style || {}),
}}
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