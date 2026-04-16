// src/utils/statusHelpers.js

export function getStatusColor(status) {
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

export function getSeverityColor(severity) {
  switch (severity) {
    case "critical":
      return "#DC2626";
    case "high":
      return "#F59E0B";
    case "medium":
      return "#2563EB";
    case "low":
      return "#16A34A";
    default:
      return "#6B7280";
  }
}