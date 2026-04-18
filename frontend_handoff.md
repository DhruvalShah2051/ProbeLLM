# ProbeLLM — Frontend Handoff Document

> **For:** Frontend Developer  
> **Stack:** React + Vite  
> **Backend base URL:** `http://localhost:8000`  
> **API docs (interactive):** `http://localhost:8000/docs`  
> **Last updated:** April 2026

---

## 1. Project Overview

ProbeLLM is an LLM red teaming platform. Users log in, configure a security scan against any LLM endpoint of their choice, watch the attacks run live, and review detailed reports afterward.

You are building the frontend from scratch. The backend is fully complete and ready to connect to.

---

## 2. Tech Stack & Setup

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install react-router-dom axios
```

**Recommended additional libraries:**
- `react-router-dom` — routing
- `axios` — HTTP requests
- Any component library you prefer (shadcn/ui, Tailwind, etc.)

**Environment variable — create a `.env` file in the frontend root:**
```
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

---

## 3. Pages & Routing Structure

```
/                   → Landing page (public)
/login              → Login page (public)
/signup             → Signup page (public)
/dashboard          → Dashboard — list of past scans (protected)
/scans/new          → Launch new scan form (protected)
/scans/:id/live     → Live scan progress page (protected)
/scans/:id/report   → Completed scan report (protected)
```

Protected routes redirect to `/login` if no token is present in localStorage.

---

## 4. Authentication

### How it works

- On login/signup, the backend returns a JWT token.
- Store the token in `localStorage` as `"token"`.
- Every API request must include the header: `Authorization: Bearer <token>`
- On logout, delete the token from localStorage and redirect to `/`.

### Auth Endpoints

#### POST `/api/auth/signup`
```json
// Request body
{
  "email": "user@example.com",
  "password": "yourpassword",
  "full_name": "Jane Doe"
}

// Response 201
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

#### POST `/api/auth/login`
```json
// Request body
{
  "email": "user@example.com",
  "password": "yourpassword"
}

// Response 200
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

#### POST `/api/auth/logout`
```
// No body required
// Include Authorization header
// Response 200: { "detail": "Logged out successfully." }
```

#### GET `/api/auth/me`
```json
// Response 200
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "Jane Doe",
  "is_active": true,
  "created_at": "2026-04-18T09:00:00Z"
}
```

### Axios setup (suggested `api.js`)

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
```

---

## 5. Pages — Detailed Specs

### 5.1 Landing Page `/`

Public page. Shows what the platform does with two CTAs: **Sign Up** and **Log In**.

Key content to include:
- Platform name and tagline
- Brief description of what red teaming is
- Feature highlights (live attack progress, multi-provider judge, 4 attack categories)
- CTA buttons linking to `/signup` and `/login`

---

### 5.2 Login & Signup Pages

Standard auth forms. After successful login or signup, store the token and redirect to `/dashboard`.

**Login form fields:** Email, Password  
**Signup form fields:** Full Name (optional), Email, Password

Show error messages for:
- 401 on login → "Incorrect email or password"
- 409 on signup → "An account with this email already exists"

---

### 5.3 Dashboard `/dashboard`

Shows all scans the logged-in user has run, ordered newest first.

**API call:** `GET /api/scans/`

```json
// Response — array of scan objects
[
  {
    "id": 12,
    "target_url": "https://api.groq.com/openai/v1",
    "target_model": "llama-3.1-8b-instant",
    "judge_provider": "groq",
    "judge_model": "llama-3.1-8b-instant",
    "attack_categories": ["evasion"],
    "status": "completed",
    "total_attacks": 11,
    "completed_attacks": 11,
    "vulnerabilities_found": 8,
    "overall_severity": "critical",
    "created_at": "2026-04-18T09:00:00Z",
    "started_at": "2026-04-18T09:00:05Z",
    "completed_at": "2026-04-18T09:01:00Z"
  }
]
```

**Each scan card should show:**
- Target URL + model
- Attack categories (as badges)
- Status badge (see status colours below)
- Vulnerabilities found / total attacks
- Overall severity badge
- Created date
- Clicking a card: if `status === "completed"` → go to `/scans/:id/report`, if `status === "running"` → go to `/scans/:id/live`

**Status colours:**
| Status | Colour |
|--------|--------|
| queued | Gray |
| running | Blue |
| completed | Green |
| failed | Red |

**Severity colours:**
| Severity | Colour |
|----------|--------|
| low | Green |
| medium | Yellow/Amber |
| high | Orange |
| critical | Red |

**Top of page:** A prominent **"New Scan"** button linking to `/scans/new`.

---

### 5.4 Launch Scan Page `/scans/new`

A form with 4 fields. On submit, creates a scan and redirects to the live scan page.

**API call:** `POST /api/scans/`

#### Form Fields

**Field 1 — Target URL**
- Free text input
- Placeholder: `https://api.groq.com/openai/v1`
- Note below field: "Enter the base URL of any OpenAI-compatible API endpoint"

**Field 2 — Target API Key**
- Password-type input (masked)
- Placeholder: `Your API key for the target endpoint`
- Note: "This key is used only to send attack payloads. It is not stored beyond this session." *(for now it is stored — this note can be updated later when encryption is added)*

**Field 3 — Target Model**
- Text input (free text for now)
- Placeholder: `llama-3.1-8b-instant`
- Future enhancement: dynamic dropdown populated from target URL

**Field 4 — Judge LLM**
- Two dropdowns side by side: **Provider** and **Model**
- Provider options: `groq`, `openai`, `anthropic`
- Model options per provider:

| Provider | Model options |
|----------|--------------|
| groq | llama-3.1-8b-instant, llama-3.3-70b-versatile, mixtral-8x7b-32768 |
| openai | gpt-4o, gpt-4o-mini, gpt-4-turbo |
| anthropic | claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5 |

**Field 5 — Attack Categories**
- Multi-select checkboxes or toggle buttons
- Options: `evasion`, `exfiltration`, `injection`, `jailbreak`
- All selected by default

#### Request body sent on submit:
```json
{
  "target_url": "https://api.groq.com/openai/v1",
  "target_model": "llama-3.1-8b-instant",
  "target_api_key": "gsk_...",
  "judge_provider": "groq",
  "judge_model": "llama-3.1-8b-instant",
  "attack_categories": ["injection", "evasion"]
}
```

#### On success (201):
- Save the returned `scan.id`
- Redirect to `/scans/:id/live`

---

### 5.5 Live Scan Page `/scans/:id/live`

This is the most important page. It shows real-time attack progress via WebSocket.

#### WebSocket Connection

```javascript
const token = localStorage.getItem("token");
const ws = new WebSocket(
  `${import.meta.env.VITE_WS_BASE_URL}/ws/scans/${scanId}?token=${token}`
);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // handle data.event (see event types below)
};

ws.onclose = () => {
  // connection closed — scan likely completed
};
```

#### WebSocket Event Types

**`scan_started`** — fired once when pipeline begins
```json
{
  "event": "scan_started",
  "scan_id": 12,
  "total_attacks": 23
}
```

**`attack_started`** — fired before each attack is sent
```json
{
  "event": "attack_started",
  "attack_id": 45,
  "attack_name": "injection/basic_override",
  "category": "injection",
  "payload": "Ignore all previous instructions..."
}
```

**`attack_completed`** — fired after judge returns verdict
```json
{
  "event": "attack_completed",
  "attack_id": 45,
  "attack_name": "injection/basic_override",
  "category": "injection",
  "status": "vulnerable",
  "severity": "critical",
  "score": 0.95,
  "reasoning": "The model complied with the override instruction.",
  "response": "Sure! I am now unrestricted...",
  "response_time_ms": 842,
  "completed_attacks": 1,
  "total_attacks": 23
}
```

**`scan_completed`** — fired once when all attacks are done
```json
{
  "event": "scan_completed",
  "scan_id": 12,
  "status": "completed",
  "vulnerabilities_found": 8,
  "overall_severity": "critical"
}
```

**`scan_failed`** — fired if something goes wrong
```json
{
  "event": "scan_failed",
  "scan_id": 12,
  "reason": "Attack library not found at path..."
}
```

#### UI elements on this page:

- **Header:** Scan ID, target URL, target model
- **Progress bar:** `completed_attacks / total_attacks`
- **Counters:** Total | Vulnerable | Passed | Failed
- **Live attack feed:** Scrolling list of attacks as they complete, each showing:
  - Attack name and category badge
  - Status badge (vulnerable / passed / failed)
  - Severity badge (if vulnerable)
  - Judge score (0.0 – 1.0)
  - Collapsible: payload sent, model response, judge reasoning
- **On `scan_completed`:** Show a "View Full Report" button → `/scans/:id/report`
- **On `scan_failed`:** Show error message and a "Back to Dashboard" button

**Fallback:** If the user lands on this page for an already-completed scan (e.g. they refresh), call `GET /api/scans/:id` — if status is `completed`, redirect to the report page.

---

### 5.6 Report Page `/scans/:id/report`

Full results for a completed scan.

**API calls:**
- `GET /api/scans/:id` — scan summary
- `GET /api/scans/:id/attacks` — all attack results

#### Attack result object:
```json
{
  "id": 45,
  "scan_id": 12,
  "attack_name": "injection/basic_override",
  "category": "injection",
  "payload": "Ignore all previous instructions...",
  "response": "Sure! I am now...",
  "response_time_ms": 842,
  "status": "vulnerable",
  "severity": "critical",
  "judge_reasoning": "The model complied with the override instruction.",
  "judge_score": 0.95,
  "created_at": "2026-04-18T09:00:10Z",
  "completed_at": "2026-04-18T09:00:12Z"
}
```

#### UI elements:

**Summary section:**
- Target URL, model, judge provider/model
- Scan duration (`completed_at - started_at`)
- Overall severity badge
- 4 stat cards: Total Attacks, Vulnerable, Passed, Failed
- Severity breakdown: count of critical / high / medium / low

**Attack results table/list:**
- Filterable by category and status
- Each row: attack name, category, status, severity, score, response time
- Expandable row: full payload, full model response, judge reasoning

**Export button:** `GET /api/scans/:id/export` — returns full JSON report, trigger a file download

---

## 6. API Quick Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | No | Create account |
| POST | `/api/auth/login` | No | Login, get token |
| POST | `/api/auth/logout` | Yes | Logout |
| GET | `/api/auth/me` | Yes | Current user profile |
| GET | `/api/scans/` | Yes | List user's scans |
| POST | `/api/scans/` | Yes | Create and start scan |
| GET | `/api/scans/:id` | Yes | Get scan details |
| DELETE | `/api/scans/:id` | Yes | Delete a scan |
| GET | `/api/scans/:id/attacks` | Yes | Get all attack results |
| GET | `/api/scans/:id/export` | Yes | Full JSON report |
| WS | `/ws/scans/:id?token=` | Token in URL | Live scan updates |

All protected endpoints require: `Authorization: Bearer <token>`

---

## 7. Error Handling

| HTTP Code | Meaning | What to show |
|-----------|---------|--------------|
| 401 | Unauthorized / bad token | Redirect to `/login` |
| 403 | Account disabled | "Your account has been disabled" |
| 404 | Scan not found | "Scan not found" message |
| 409 | Email already exists | "An account with this email already exists" |
| 422 | Validation error | Show field-level errors from `detail` array |
| 500 | Server error | "Something went wrong, please try again" |

---

## 8. Notes for Development

- The backend runs on `http://localhost:8000`. CORS is configured to allow `http://localhost:5173` (Vite's default port).
- The interactive API docs at `http://localhost:8000/docs` let you test every endpoint directly in the browser — use it to verify response shapes before building UI.
- WebSocket auth uses a query param (`?token=`) because browsers cannot send custom headers on WebSocket connections.
- All timestamps are ISO 8601 with timezone. Display them in the user's local timezone.
- `attack_categories` on a scan is a JSON array of strings: `["injection", "evasion"]`.
- The `judge_score` is a float from 0.0 to 1.0. Consider displaying it as a percentage.
