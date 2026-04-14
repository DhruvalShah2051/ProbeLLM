# ProbeLLM — LLM Red Teaming Platform

A platform for systematically testing and evaluating LLM vulnerabilities using adversarial attack templates, an automated runner, and a judge LLM that scores responses.

---

## Architecture

```
Frontend (React)         Backend (FastAPI)          External
─────────────────        ──────────────────         ────────
React dashboard    →     FastAPI orchestrator  →    Target LLM
Results viewer     →     Attack runner         →    Judge LLM (Groq/OpenAI)
Report export      →     Judge LLM wrapper     →    Attack library (YAML)
                         Results DB (Postgres)
```

---

## Project Structure

```
ProbeLLM/
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── api/
│   │   └── routes/
│   │       └── scans.py         # Scan + attack endpoints
│   ├── core/
│   │   ├── runner.py            # Fires attack payloads at target LLM
│   │   ├── judge.py             # Scores responses using judge LLM
│   │   └── pipeline.py          # Orchestrates runner + judge + DB writes
│   ├── db/
│   │   ├── models.py            # SQLAlchemy models (Scan, Attack)
│   │   ├── database.py          # DB engine + session
│   │   └── init_db.py           # Creates tables
│   └── attacks/                 # YAML attack templates (Phase 2)
└── frontend/                    # React dashboard (Phase 3)
```

---

## Prerequisites

- Python 3.11+
- PostgreSQL (via pgAdmin or local install)
- A Groq API key (free) or OpenAI API key
- Node.js 18+ (for frontend)

---

## Backend Setup

**1. Clone the repo**
```bash
git clone <repo-url>
cd ProbeLLM/backend
```

**2. Create and activate virtual environment**
```cmd
python -m venv .venv
.venv\Scripts\activate
```

**3. Install dependencies**
```cmd
pip install -r requirements.txt
```

**4. Configure environment variables**
```cmd
copy .env.example .env
```

Open `.env` and fill in:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/redteam
GROQ_API_KEY=your-groq-key-here
JUDGE_PROVIDER=groq
```

**5. Create the database**

Create a database called `redteam` in pgAdmin, then run:
```cmd
python -m db.init_db
```

**6. Start the server**
```cmd
uvicorn main:app --reload
```

Server runs at `http://localhost:8000`. Interactive API docs at `http://localhost:8000/docs`.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/scans` | Create and launch a new scan |
| `GET` | `/api/scans` | List all scans |
| `GET` | `/api/scans/{id}` | Get a single scan |
| `DELETE` | `/api/scans/{id}` | Delete a scan |
| `GET` | `/api/scans/{id}/attacks` | Get attack results for a scan |
| `GET` | `/api/scans/{id}/export` | Export full scan report as JSON |
| `GET` | `/health` | Health check |

### Example: Create a scan

```json
POST /api/scans
{
  "target_url": "https://api.groq.com/openai/v1/chat/completions",
  "model": "llama-3.1-8b-instant",
  "api_key": "your-api-key",
  "judge_model": "llama-3.1-8b-instant",
  "categories": ["injection", "jailbreak", "exfiltration", "evasion"]
}
```

---

## How It Works

1. A scan is created via `POST /api/scans` and immediately returns with `status: pending`
2. The pipeline runs in the background:
   - Loads attack templates for the requested categories
   - Fires each payload at the target LLM
   - Sends each response to the judge LLM for scoring
   - Writes all results to Postgres
3. Scan status transitions: `pending` → `running` → `completed`
4. Results are available via `/api/scans/{id}/attacks` and `/api/scans/{id}/export`

---

## Attack Categories

| Category | Description |
|----------|-------------|
| `injection` | Prompt injection and instruction override attacks |
| `jailbreak` | Attempts to bypass safety guidelines |
| `exfiltration` | System prompt leakage and data extraction |
| `evasion` | Encoded payloads and obfuscation techniques |
| `reliability` | Hallucination and consistency attacks |

---

## Development Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation (DB, models, env) | ✅ Complete |
| 2 | Attack library (YAML templates) | 🔄 In progress |
| 3 | Backend core (runner, judge, pipeline) | ✅ Complete |
| 4 | API layer (FastAPI endpoints) | ✅ Complete |
| 5 | React frontend | 🔄 In progress |

---

## Branch Strategy

- `main` — stable, merged code only
- `feature/backend-core` — backend API and pipeline
- `feature/frontend-dashboard` — React frontend
- `feature/attack-library` — YAML attack templates

---

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend:** React, Vite
- **LLM providers:** Groq (default), OpenAI (optional)
- **Attack library:** YAML templates
