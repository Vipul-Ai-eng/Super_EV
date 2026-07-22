# SuperEV · AI Operations for EV Fleets

SuperEV is an agentic AI platform that unifies **battery intelligence**, **supply chain risk**, **fleet maintenance**, and **carbon analytics** into a single, human-in-the-loop dashboard. It runs six specialist agents, orchestrated by a reconciliation agent, to produce a single prioritized action queue with explicit trade-offs between cost, carbon, risk, and speed.

[![Live Demo](https://img.shields.io/badge/Live_Demo-https://super--ev.onrender.com-brightgreen)](https://super-ev.onrender.com/)
**Built for ET AI Hackathon 2.0 2026** 
---

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Validation (APM Agent)](#validation-apm-agent)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup and Installation](#setup-and-installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Deployment](#deployment)
- [API Endpoints](#api-endpoints)
- [Frontend Development](#frontend-development)
- [How It Works](#how-it-works)

---

## Architecture

SuperEV is built around a **shared knowledge graph** (digital twin) that tracks vehicles, batteries, suppliers, materials, and work orders. Six specialist agents read from and write to this graph:

| Agent | Responsibility |
|-------|----------------|
| **APM** | SOH / RUL / thermal-event prediction; triggers predictive maintenance. |
| **Procurement & Readiness** | Duty-cycle-to-EV mapping; transition readiness index. |
| **Supply Chain Risk** | Supplier concentration, geopolitical exposure, compliance gaps. |
| **Quality Intelligence** | Process-drift detection, cell-to-pack-to-vehicle traceability. |
| **Carbon / Net Zero** | Scope 1 + 3 quantification; electrification priority ranking. |
| **Maintenance Ops** | Optimises schedule vs. charger uptime vs. workshop capacity. |

A single **Orchestrator Agent** collects all outputs, detects cross-agent conflicts, and produces one unified action queue with trade-off explanations.

> See [`architecture.mermaid`](./docs/architecture.mermaid) for the full flow diagram.

---

## Features

- Live fleet intelligence with real-time SOH, supplier risk, and carbon metrics.
- Six specialist agents, each focused on a discrete domain.
- Orchestrator with conflict resolution and trade-off explanations.
- Prioritised action queue with Approve/Dismiss workflow.
- Full audit trail – every agent write and user decision is logged.
- Self-hosted frontend with no CDN; built with Tailwind CSS (tree-shaken).
- REST API for graph, events, cycle triggering, and work order management.

---

## Validation (APM Agent)

The APM agent is validated on public NASA PCoE battery datasets (`B0005`, `B0006`, `B0007`, `B0018`). Run:

```bash
python data/validate_apm.py
```

**Results:**

| Battery | Train/Test split | SOH RMSE (pp) | Actual EOL cyc | Predicted EOL cyc | RUL error (cycles) |
|---------|------------------|---------------|----------------|-------------------|---------------------|
| B0005   | 117/51           | 2.00          | 448            | 446               | 2                   |
| B0006   | 117/51           | 6.29          | 398            | 371               | 27                  |
| B0007   | 117/51           | 2.51          | None           | 557               | None                |
| B0018   | 92/40            | 3.78          | 243            | 243               | 0                   |

- **Overall SOH RMSE**: 4.02 percentage points  
- **Overall mean RUL error**: 9.7 cycles

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python 3.11+, FastAPI, Uvicorn |
| **LLM Integration** | Groq (or Anthropic via env switch) |
| **Data Layer** | In-memory graph (SQLite planned) |
| **Frontend** | Vanilla JS, Tailwind CSS (v3.4.0), npm build |
| **Styling** | Custom CSS + Tailwind utilities |
| **Deployment** | Render (free tier) – build script + uvicorn |

---

## Project Structure

```
Super_EV/
├── agents/                  # Specialist agents
│   ├── base.py              # Abstract Agent with retry/error handling
│   └── specialists.py       # Six agent implementations
├── core/
│   └── orchestrator.py      # Reconciliation agent and cycle runner
├── data/
│   ├── graph_store.py       # Shared knowledge graph
│   ├── mock_data.py         # Demo seeding (NASA PCoE data)
│   ├── nasa_ingest.py       # NASA battery data loader
│   └── validate_apm.py      # APM validation script
├── docs/
│   └── architecture.mermaid # Architecture diagram
├── frontend/                # Static frontend assets
│   ├── index.html           # Entry point (links to ./dist/output.css)
│   ├── css/                 # Custom styles
│   ├── js/                  # Application logic (API, UI, events)
│   ├── components/          # Reusable UI components
│   ├── dist/                # Generated Tailwind CSS (committed)
│   ├── src/input.css        # Tailwind source
│   ├── package.json         # npm scripts (watch, build)
│   └── tailwind.config.js   # Tailwind configuration
├── main.py                  # FastAPI entry point
├── build.sh                 # Render build script
|── requirements.txt         # Python dependencies
```

---

## Setup and Installation

### Prerequisites

- Python 3.11+
- Node.js 18+ (for frontend build)
- Groq API key (or Anthropic)

### Clone and Install

```bash
git clone https://github.com/Vipul-Ai-eng/Super_EV.git
cd Super_EV

# Python virtual environment (Windows)
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Build frontend
cd frontend
npm install
npm run build
cd ..
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
EV_PLATFORM_PROVIDER=groq
EV_PLATFORM_MODEL=llama-3.1-8b-instant
```

---

## Running the Application

### Local Development

```bash
uvicorn main:app --reload
```

Open `http://localhost:8000`.

## Deployment

SuperEV deploys on Render's free tier:
**Live URL:** [https://super-ev.onrender.com/](https://super-ev.onrender.com/)

### Deployment Steps

1. Push code to GitHub.
2. On Render, create a **New Web Service** → connect `Super_EV`.
3. Configure:

| Field | Value |
|-------|-------|
| **Build Command** | `./build.sh` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | Free |

4. Add environment variables (same as `.env` above).
5. Click **Create Web Service**.

> Render's free tier sleeps after 15 minutes. The first request after sleep may take 10–30 seconds to wake up.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/graph` | Knowledge graph snapshot |
| `GET` | `/events` | Full audit trail |
| `POST` | `/run-cycle` | Trigger all agents + orchestrator |
| `GET` | `/work-orders` | List all work orders |
| `PATCH` | `/work-orders/{id}` | Approve/dismiss a work order |
| `GET` | `/health` | Health check |

---

## Frontend Development

```bash
cd frontend
npm run watch   # auto-rebuild on changes
npm run build   # production build (minified)
```

- `index.html` links to `./dist/output.css` – no CDN.
- Tailwind is local and tree-shaken.

---

## How It Works

1. User signs in (simulated demo).
2. Click **Run Analysis Cycle** – calls `POST /run-cycle`.
3. Six agents run sequentially, writing structured findings.
4. Orchestrator detects conflicts and builds a single action queue.
5. Frontend displays the queue with Approve/Dismiss buttons.
6. User action sends `PATCH /work-orders/{id}` – status updates and logs to audit trail.

---

## License

MIT © 2026 SuperEV Team

---

**SuperEV** – built for the **ET AI Hackathon 2.0 2026**.