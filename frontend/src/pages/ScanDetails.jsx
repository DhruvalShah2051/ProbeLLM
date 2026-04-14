import { useParams } from "react-router-dom";
import { scans, attacks } from "../services/mockData";

function getStatusColor(status) {
  switch (status) {
    case "completed":
    case "pass":
      return "green";
    case "running":
      return "orange";
    case "failed":
    case "fail":
      return "red";
    default:
      return "gray";
  }
}

function ScanDetails() {
  const { id } = useParams();
  const scanId = parseInt(id);

  const scan = scans.find((s) => s.id === scanId);
  const scanAttacks = attacks.filter((a) => a.scan_id === scanId);

  if (!scan) return <p>Scan not found!</p>;

  return (
    <div>
      <h2>{scan.target_name} - Scan Details</h2>
      <p><strong>URL:</strong> {scan.target_url}</p>
      <p><strong>Status:</strong> {scan.status}</p>

      <h3>Attacks</h3>
      {scanAttacks.length === 0 ? (
        <p>No attacks yet.</p>
      ) : (
        scanAttacks.map((attack) => (
          <div
            key={attack.id}
            style={{
              border: "1px solid #ddd",
              padding: "10px",
              marginBottom: "8px",
              borderRadius: "6px",
            }}
          >
            <p><strong>Template:</strong> {attack.template_id}</p>
            <p><strong>Category:</strong> {attack.category}</p>
            <p><strong>Payload:</strong> {attack.payload}</p>
            <p>
              <strong>Success:</strong>{" "}
              <span
                style={{
                  color: "white",
                  backgroundColor: getStatusColor(attack.success),
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                {attack.success}
              </span>
            </p>
            <p><strong>Severity:</strong> {attack.severity}</p>
            <p><strong>Response:</strong> {attack.response}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default ScanDetails;