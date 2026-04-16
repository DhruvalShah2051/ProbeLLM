import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ScanDetails from "./pages/ScanDetails";
import AttackDetail from "./pages/AttackDetail";
import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Navbar />
      <div style={{ padding: "20px" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scan/:id" element={<ScanDetails />} />
          <Route path="/scan/:id/attack/:attackId" element={<AttackDetail />} />
        </Routes>
      </div>
    </>
  );
}

export default App;