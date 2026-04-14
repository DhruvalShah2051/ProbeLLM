import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ScanDetails from "./pages/ScanDetails";

function App() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>ProbeLLM</h1>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/scan/:id" element={<ScanDetails />} />
      </Routes>
    </div>
  );
}

export default App;