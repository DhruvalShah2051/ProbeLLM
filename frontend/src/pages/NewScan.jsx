// src/pages/NewScan.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "../styles/NewScan.css";

const JUDGE_MODELS = {
  groq: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "mixtral-8x7b-32768"],
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  anthropic: ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5"],
};

const ATTACK_CATEGORIES = ["injection", "jailbreak", "exfiltration", "evasion"];

function NewScan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    target_url: "",
    target_model: "",
    target_api_key: "",
    judge_provider: "groq",
    judge_model: "llama-3.1-8b-instant",
    attack_categories: [...ATTACK_CATEGORIES],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "judge_provider") {
      setForm((f) => ({
        ...f,
        judge_provider: value,
        judge_model: JUDGE_MODELS[value][0],
      }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
    setError(null);
  };

  const toggleCategory = (cat) => {
    setForm((f) => {
      const already = f.attack_categories.includes(cat);
      if (already && f.attack_categories.length === 1) return f; // keep at least 1
      return {
        ...f,
        attack_categories: already
          ? f.attack_categories.filter((c) => c !== cat)
          : [...f.attack_categories, cat],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/api/scans/", form);
      navigate(`/scans/${res.data.id}/live`);
    } catch (err) {
      if (err.response?.status === 422) {
        setError("Please check your inputs — some fields are invalid.");
      } else {
        setError("Failed to launch scan. Is the backend running?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ns-page">

      {/* NAV */}
      <nav className="ns-nav">
        <div className="ns-nav-logo">⚡ ProbeLLM</div>
        <Link to="/dashboard" className="ns-back">← Dashboard</Link>
      </nav>

      <div className="ns-content">
        <div className="ns-header">
          <h1 className="ns-title">New Scan</h1>
          <p className="ns-subtitle">Configure and launch an adversarial scan</p>
        </div>

        {error && <div className="ns-error">{error}</div>}

        <form className="ns-form" onSubmit={handleSubmit}>

          {/* TARGET SECTION */}
          <div className="ns-section">
            <div className="ns-section-label">Target LLM</div>

            <div className="ns-field">
              <label className="ns-label">Target URL</label>
              <input
                className="ns-input"
                type="text"
                name="target_url"
                placeholder="https://api.groq.com/openai/v1"
                value={form.target_url}
                onChange={handleChange}
                required
              />
              <span className="ns-hint">Base URL of any OpenAI-compatible API endpoint</span>
            </div>

            <div className="ns-field">
              <label className="ns-label">Target Model</label>
              <input
                className="ns-input"
                type="text"
                name="target_model"
                placeholder="llama-3.1-8b-instant"
                value={form.target_model}
                onChange={handleChange}
                required
              />
            </div>

            <div className="ns-field">
              <label className="ns-label">Target API Key</label>
              <input
                className="ns-input"
                type="password"
                name="target_api_key"
                placeholder="Your API key for the target endpoint"
                value={form.target_api_key}
                onChange={handleChange}
                required
              />
              <span className="ns-hint">Used only to send attack payloads during this scan</span>
            </div>
          </div>

          {/* JUDGE SECTION */}
          <div className="ns-section">
            <div className="ns-section-label">Judge LLM</div>

            <div className="ns-row">
              <div className="ns-field">
                <label className="ns-label">Provider</label>
                <select
                  className="ns-select"
                  name="judge_provider"
                  value={form.judge_provider}
                  onChange={handleChange}
                >
                  {Object.keys(JUDGE_MODELS).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="ns-field">
                <label className="ns-label">Model</label>
                <select
                  className="ns-select"
                  name="judge_model"
                  value={form.judge_model}
                  onChange={handleChange}
                >
                  {JUDGE_MODELS[form.judge_provider].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ATTACK CATEGORIES */}
          <div className="ns-section">
            <div className="ns-section-label">Attack Categories</div>
            <div className="ns-categories">
              {ATTACK_CATEGORIES.map((cat) => {
                const active = form.attack_categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`ns-cat-btn ${active ? "active" : ""}`}
                    onClick={() => toggleCategory(cat)}
                  >
                    {active ? "✓ " : ""}{cat}
                  </button>
                );
              })}
            </div>
            <span className="ns-hint">At least one category required</span>
          </div>

          {/* SUBMIT */}
          <button className="ns-submit" type="submit" disabled={loading}>
            {loading ? "Launching scan..." : "Launch scan →"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default NewScan;