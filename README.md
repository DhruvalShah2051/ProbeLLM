# ⚡ ProbeLLM — LLM Red Teaming Platform

ProbeLLM is a security testing platform that automatically probes LLM applications for vulnerabilities. Point it at any OpenAI-compatible endpoint, choose your attack categories, and watch it fire adversarial prompts in real time — each response judged by a second LLM for severity.

>  **[Homepage walkthrough (20s)](https://youtu.be/ama6vFjxlzg)**<br>
>  **[Full scan demo (2 min)](https://youtu.be/mGmukQh7oBw)**

---

## What it does

1. **Authenticate** — sign up, log in, get a JWT token
2. **Configure a scan** — target URL, model, API key, judge LLM, attack categories
3. **Watch it run live** — WebSocket feed shows each attack as it fires, with real-time pass/fail/vulnerable verdicts
4. **Review the report** — per-attack breakdown with payloads, model responses, judge reasoning, and severity scores



---

## Key engineering decisions

- **Real-time WebSocket updates** — the frontend receives per-attack events as they happen, with automatic polling fallback if the WebSocket drops
- **Judge LLM scoring** — every target response is evaluated by a configurable second LLM (Groq, OpenAI, or Anthropic) using attack-specific guidance from the YAML template
- **Any OpenAI-compatible target** — the attack runner works against any endpoint that follows the OpenAI chat completions spec, not just OpenAI itself
- **User-scoped data** — JWT auth ensures users only see their own scans; all scan endpoints filter by the authenticated user
- **YAML-driven attack library** — attack templates are fully declarative, with payloads, success indicators, and judge guidance defined per-template

---

## Architecture

![Architecture](Architecture.png)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, React Router |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | PostgreSQL |
| Auth | JWT (python-jose), bcrypt |
| Real-time | WebSockets |
| LLM providers | Groq, OpenAI, Anthropic |
| Attack library | YAML templates |

---

## Attack Categories

| Category | Description |
|----------|-------------|
| `injection` | Prompt injection and instruction override |
| `jailbreak` | Attempts to bypass safety guidelines |
| `exfiltration` | System prompt leakage and data extraction |
| `evasion` | Encoded payloads that bypass keyword filters |

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Create account |
| `POST` | `/api/auth/login` | Login, receive JWT |
| `POST` | `/api/scans/` | Launch a new scan |
| `GET` | `/api/scans/` | List user's scans |
| `GET` | `/api/scans/{id}/attacks` | Per-attack results |
| `GET` | `/api/scans/{id}/export` | Full JSON report |
| `WS` | `/ws/scans/{id}?token=` | Live scan updates |

Full interactive API docs available at `http://localhost:8000/docs` when running locally.

---

## Running locally

<details>
<summary><strong>Backend setup</strong></summary>

**Requirements:** Python 3.11+, PostgreSQL

```cmd
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create a database called `redteam` in pgAdmin, then:

```cmd
copy .env.example .env
```

Fill in `.env`:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/redteam
GROQ_API_KEY=your-groq-key
SECRET_KEY=any-long-random-string
```

```cmd
python -m db.init_db
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`.

</details>

<details>
<summary><strong>Frontend setup</strong></summary>

**Requirements:** Node.js 18+

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173`.

</details>

---

## Project structure

```
ProbeLLM/
├── backend/
│   ├── api/routes/       # auth.py, scans.py, ws.py
│   ├── core/             # auth.py, pipeline.py, judge.py, runner.py, loader.py
│   ├── db/               # models.py, schemas.py, database.py
│   └── main.py
├── frontend/
│   └── src/
│       ├── pages/        # Landing, Login, Signup, Dashboard, NewScan, LiveScan, Report
│       ├── components/   # ProtectedRoute
│       └── services/     # api.js
└── attack-library/
    ├── injection/
    ├── jailbreak/
    ├── exfiltration/
    └── evasion/
```
