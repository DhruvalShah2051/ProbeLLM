import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import NewScan from "./pages/NewScan";
import LiveScan from "./pages/LiveScan";
import Report from "./pages/Report";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/scans/new" element={
        <ProtectedRoute><NewScan /></ProtectedRoute>
      } />
      <Route path="/scans/:id/live" element={
        <ProtectedRoute><LiveScan /></ProtectedRoute>
      } />
      <Route path="/scans/:id/report" element={
        <ProtectedRoute><Report /></ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;