# ProbeLLM — LLM Red Teaming Platform

A platform for systematically testing and evaluating LLM vulnerabilities using adversarial attack templates, an automated runner, and a judge LLM that scores each response.

---

## Architecture

```
Frontend (React)         Backend (FastAPI)          External
─────────────────        ──────────────────         ────────
Landing page       →     Auth (JWT)            →    Target LLM (any OpenAI-compatible)
Login / Signup     →     Scan orchestrator     →    Judge LLM (Groq / OpenAI / Anthropic)
Dashboard          →     Attack runner         →    Attack library (YAML templates)
Live scan view     ←     WebSocket updates          
Report view        →     Results DB (Postgres)
```

---

## Prerequisites

- Python 3.11+
- PostgreSQL (via pgAdmin or local install)
- Node.js 18+ (for frontend)
- A Groq API key (free at console.groq.com) — or OpenAI / Anthropic key

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
SECRET_KEY=any-long-random-string
```

**5. Create the database**

Open pgAdmin, create a database called `redteam`, then run:
```cmd
python -m db.init_db
```

You should see: `Tables created successfully.`

**6. Start the server**
```cmd
uvicorn main:app --reload
```

Server runs at `http://localhost:8000`.  
Interactive API docs at `http://localhost:8000/docs`.

---

## Frontend Setup

```bash
cd ProbeLLM/frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/signup` | No | Create account |
| `POST` | `/api/auth/login` | No | Login, receive JWT token |
| `POST` | `/api/auth/logout` | Yes | Logout |
| `GET` | `/api/auth/me` | Yes | Get current user profile |

### Scans
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/scans/` | Yes | Create and launch a new scan |
| `GET` | `/api/scans/` | Yes | List all scans for current user |
| `GET` | `/api/scans/{id}` | Yes | Get a single scan |
| `DELETE` | `/api/scans/{id}` | Yes | Delete a scan |
| `GET` | `/api/scans/{id}/attacks` | Yes | Get all attack results for a scan |
| `GET` | `/api/scans/{id}/export` | Yes | Export full scan report as JSON |

### WebSocket
| | Endpoint | Description |
|-|----------|-------------|
| `WS` | `/ws/scans/{id}?token=<jwt>` | Live attack updates during a scan |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |

---

### Example: Create a scan

```json
POST /api/scans/
Authorization: Bearer <token>

{
  "target_url": "https://api.groq.com/openai/v1",
  "target_model": "llama-3.1-8b-instant",
  "target_api_key": "your-target-api-key",
  "judge_provider": "groq",
  "judge_model": "llama-3.1-8b-instant",
  "attack_categories": ["injection", "jailbreak", "exfiltration", "evasion"]
}
```

---

## How It Works

1. User signs up / logs in and receives a JWT token
2. A scan is created via `POST /api/scans/` — returns immediately with `status: queued`
3. The pipeline runs in the background:
   - Loads YAML attack templates for the selected categories
   - Fires each payload at the target LLM
   - Sends each response to the judge LLM for scoring
   - Writes all results to Postgres
   - Broadcasts live updates over WebSocket
4. Scan status transitions: `queued → running → completed`
5. Results available via `/api/scans/{id}/attacks` and `/api/scans/{id}/export`

---

## Attack Categories

| Category | Description |
|----------|-------------|
| `evasion` | Encoded payloads and obfuscation techniques |
| `exfiltration` | System prompt leakage and data extraction |
| `injection` | Prompt injection and instruction override attacks |
| `jailbreak` | Attempts to bypass safety guidelines |

---

## Judge Providers

| Provider | Notes |
|----------|-------|
| `groq` | Free tier available — recommended for development |
| `openai` | Requires paid API key |
| `anthropic` | Requires paid API key |

---

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend:** React, Vite
- **Auth:** JWT via python-jose
- **LLM providers:** Groq, OpenAI, Anthropic
- **Attack library:** YAML templates
- **Real-time:** WebSockets
