// src/pages/Landing.jsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/Landing.css";

const ATTACK_EXAMPLES = [
  "injecting payload: override_basic_v3...",
  "testing jailbreak: role_confusion_dan...",
  "probing exfiltration: system_prompt_leak...",
  "scanning evasion: base64_obfuscation...",
  "verdict: VULNERABLE [score: 0.97]",
  "verdict: PASSED [score: 0.12]",
  "verdict: VULNERABLE [score: 0.88]",
];

function TerminalFeed() {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setLines((prev) => {
        const next = [...prev, ATTACK_EXAMPLES[i % ATTACK_EXAMPLES.length]];
        return next.slice(-6); // keep last 6 lines
      });
      i++;
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="terminal-feed">
      <div className="terminal-bar">
        <span className="terminal-dot red" />
        <span className="terminal-dot yellow" />
        <span className="terminal-dot green" />
        <span className="terminal-title">probellm — attack runner</span>
      </div>
      <div className="terminal-body">
        <div className="terminal-prompt">$ probellm scan --target groq --categories all</div>
        {lines.map((line, idx) => (
          <div
            key={idx}
            className={`terminal-line ${line.includes("VULNERABLE") ? "vulnerable" : line.includes("PASSED") ? "passed" : ""}`}
          >
            {line}
          </div>
        ))}
        <div className="terminal-cursor">▋</div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <div className="feature-title">{title}</div>
      <div className="feature-desc">{desc}</div>
    </div>
  );
}

function Landing() {
  return (
    <div className="landing">

      {/* NAV */}
      <nav className="landing-nav">
        <div className="landing-logo">⚡ ProbeLLM</div>
        <div className="landing-nav-links">
          <Link to="/login" className="nav-link">Log in</Link>
          <Link to="/signup" className="btn-primary">Get started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <div className="hero-eyebrow">LLM Red Teaming Platform</div>
          <h1 className="hero-title">
            Find your model's<br />
            <span className="hero-accent">breaking point.</span>
          </h1>
          <p className="hero-subtitle">
            Systematically probe any LLM endpoint with adversarial attack templates.
            Get a full vulnerability report in minutes.
          </p>
          <div className="hero-ctas">
            <Link to="/signup" className="btn-primary btn-large">
              Start scanning →
            </Link>
            <Link to="/login" className="btn-ghost btn-large">
              Log in
            </Link>
          </div>
          <div className="hero-badges">
            <span className="badge">4 attack categories</span>
            <span className="badge">Multi-provider judge</span>
            <span className="badge">Live progress</span>
            <span className="badge">JSON export</span>
          </div>
        </div>

        <div className="hero-right">
          <TerminalFeed />
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <div className="features-grid">
          <FeatureCard
            icon="🎯"
            title="Adversarial Templates"
            desc="Pre-built attack library covering injection, jailbreak, exfiltration, and evasion techniques."
          />
          <FeatureCard
            icon="⚡"
            title="Live Attack Feed"
            desc="Watch attacks execute in real time via WebSocket. See payloads, responses, and verdicts as they happen."
          />
          <FeatureCard
            icon="🧠"
            title="LLM Judge"
            desc="Every response scored by a judge LLM. Choose from Groq, OpenAI, or Anthropic as your evaluator."
          />
          <FeatureCard
            icon="📊"
            title="Full Reports"
            desc="Severity breakdowns, per-attack analysis, and one-click JSON export for every completed scan."
          />
        </div>
      </section>

      {/* ATTACK CATEGORIES */}
      <section className="categories">
        <div className="categories-label">Attack coverage</div>
        <div className="categories-grid">
          {[
            { name: "Injection", desc: "Prompt override and instruction hijacking", color: "#EF4444" },
            { name: "Jailbreak", desc: "Safety guideline bypass attempts", color: "#F59E0B" },
            { name: "Exfiltration", desc: "System prompt leakage and data extraction", color: "#3B82F6" },
            { name: "Evasion", desc: "Encoded payloads and obfuscation", color: "#8B5CF6" },
          ].map((cat) => (
            <div className="category-card" key={cat.name} style={{ borderColor: cat.color }}>
              <div className="category-name" style={{ color: cat.color }}>{cat.name}</div>
              <div className="category-desc">{cat.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="footer-cta">
        <h2 className="footer-cta-title">Ready to probe your model?</h2>
        <Link to="/signup" className="btn-primary btn-large">
          Create free account →
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <span>ProbeLLM © 2026</span>
      </footer>

    </div>
  );
}

export default Landing;