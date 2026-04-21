// src/pages/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Auth.css";

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/api/auth/signup", form);
      localStorage.setItem("token", res.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.status === 409) {
        setError("An account with this email already exists.");
      } else if (err.response?.status === 422) {
        setError("Please check your inputs and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          <Link to="/">⚡ ProbeLLM</Link>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Start scanning your models today</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Full name <span className="auth-optional">(optional)</span></label>
            <input
              className="auth-input"
              type="text"
              name="full_name"
              placeholder="Jane Doe"
              value={form.full_name}
              onChange={handleChange}
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account →"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login">Log in</Link>
        </p>

      </div>
    </div>
  );
}

export default Signup;