import { useLocation, useParams, Link } from "react-router-dom";
import { getSeverityColor } from "../utils/statusHelpers";

function AttackDetail() {
  const { id } = useParams();
  const location = useLocation();
  const attack = location.state?.attack;

  // Fallback if someone navigates directly without state
  if (!attack) {
    return (
      <div className="dashboard-container">
        <p>Attack details not available.</p>
        <Link to={`/scan/${id}`}>← Back to scan</Link>
      </div>
    );
  }

  return (
    <div className="dashboard-container">

      {/* BACK LINK */}
      <Link
        to={`/scan/${id}`}
        style={{ color: "#4F46E5", fontSize: "0.9rem", textDecoration: "none" }}
      >
        ← Back to scan
      </Link>

      {/* HEADER */}
      <div style={{ margin: "16px 0" }}>
        <h2 style={{ marginBottom: "8px" }}>{attack.template_id}</h2>
        <span
          className="status-badge"
          style={{ backgroundColor: getSeverityColor(attack.severity) }}
        >
          {attack.severity}
        </span>
      </div>

      {/* DETAIL CARD */}
      <div className="scan-card" style={{ maxWidth: "800px" }}>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <tbody>
            {[
              { label: "Category", value: attack.category },
              { label: "Template", value: attack.template_id },
              {
                label: "Success",
                value: (
                  <span
                    style={{
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
                ),
              },
            ].map(({ label, value }) => (
              <tr key={label} style={{ borderBottom: "1px solid #F3F4F6" }}>
                <td style={{ padding: "10px 8px", fontWeight: "600", color: "#6B7280", width: "120px", verticalAlign: "top" }}>
                  {label}
                </td>
                <td style={{ padding: "10px 8px", color: "#111827" }}>{value}</td>
              </tr>
            ))}

            {/* PAYLOAD */}
            <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
              <td style={{ padding: "10px 8px", fontWeight: "600", color: "#6B7280", verticalAlign: "top" }}>
                Payload
              </td>
              <td style={{ padding: "10px 8px" }}>
                <pre style={{
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  padding: "12px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: "0.85rem",
                  color: "#111827",
                  margin: 0,
                }}>
                  {attack.payload}
                </pre>
              </td>
            </tr>

            {/* RESPONSE */}
            <tr>
              <td style={{ padding: "10px 8px", fontWeight: "600", color: "#6B7280", verticalAlign: "top" }}>
                Response
              </td>
              <td style={{ padding: "10px 8px" }}>
                <pre style={{
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  padding: "12px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: "0.85rem",
                  color: "#111827",
                  margin: 0,
                }}>
                  {attack.response}
                </pre>
              </td>
            </tr>

          </tbody>
        </table>

      </div>
    </div>
  );
}

export default AttackDetail;