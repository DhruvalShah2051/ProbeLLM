import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

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

  const [scan, setScan] = useState(null);
  const [attacks, setAttacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get scan details
        const scanRes = await fetch(
          `http://127.0.0.1:8000/api/scans/${id}`
        );
        const scanData = await scanRes.json();

        // Get attacks for scan
        const attackRes = await fetch(
          `http://127.0.0.1:8000/api/scans/${id}/attacks`
        );
        const attackData = await attackRes.json();

        setScan(scanData);
        setAttacks(attackData);
      } catch (err) {
        console.error("Error fetching scan details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <p>Loading scan details...</p>;
  if (!scan) return <p>Scan not found!</p>;

  return (
    <div>
      <h2>{scan.target_name} - Scan Details</h2>
      <p>
        <strong>URL:</strong> {scan.target_url}
      </p>
      <p>
        <strong>Status:</strong> {scan.status}
      </p>

      <h3>Attacks</h3>

      {attacks.length === 0 ? (
        <p>No attacks yet.</p>
      ) : (
        attacks.map((attack) => (
          <div
            key={attack.id}
            style={{
              border: "1px solid #ddd",
              padding: "10px",
              marginBottom: "8px",
              borderRadius: "6px",
            }}
          >
            <p>
              <strong>Template:</strong> {attack.template_id}
            </p>
            <p>
              <strong>Category:</strong> {attack.category}
            </p>
            <p>
              <strong>Payload:</strong> {attack.payload}
            </p>
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
                {String(attack.success)}
              </span>
            </p>
            <p>
              <strong>Severity:</strong> {attack.severity}
            </p>
            <p>
              <strong>Response:</strong> {attack.response}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

export default ScanDetails;