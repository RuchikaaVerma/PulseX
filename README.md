# PulseX — Real-Time Intelligence Dashboard

A performance-critical, AI-augmented operations dashboard built for **Flam**.
PulseX simulates monitoring a fleet of 10M IoT devices across 500 factories,
100K users, and 1M API requests/hour — and stays fast doing it.

Instead of a static analytics dashboard, PulseX is built like a real mission
control system: **live streaming telemetry, a 3D digital twin, AI-generated
insights, predictive forecasting, and time-travel replay**, all wrapped in a
light, glass-panel command-center UI.

<div align="center">

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-Styling-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-black?style=for-the-badge&logo=socketdotio&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-3D-000000?style=for-the-badge&logo=threedotjs&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-Animation-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Planned-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

</div>

---

## 🧰 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| 🎨 Frontend framework | **React 18 + Vite** | Fast dev server, component-based UI |
| 🔷 Language | **TypeScript** | Type-safe frontend code |
| 💨 Styling | **Tailwind CSS** | Utility-first, design-token-driven styling |
| 🎬 Animation | **Framer Motion** | KPI count-ups, staggered page load, hover-lift panels |
| 🧊 3D rendering | **three.js** | Animated isometric digital twin |
| 📊 Charts | **Recharts / custom canvas** | Live telemetry & forecast charts |
| 📜 Virtualization | **@tanstack/react-virtual** | Windowed rendering for large device tables |
| 🔊 Audio | **Tone.js** | Ambient sonification synced to fleet CPU |
| ⚡ Backend framework | **FastAPI** | REST + WebSocket API server |
| 🐍 Language | **Python 3.11** | Backend & simulation logic |
| 🔌 Realtime transport | **WebSockets** | 1 tick/sec live telemetry stream |
| 🧠 AI layer | **Rule-based engine (swappable for LLM/ML)** | Insight generation, forecasting, chat |
| ⚙️ Server | **Uvicorn / Gunicorn** | ASGI production server |
| 🗄️ Cache | **Redis (stand-in)** | Fast in-memory lookups |
| 🐘 Persistence | **PostgreSQL (planned)** | Partitioned historical telemetry storage |

---

## ✨ Feature Checklist

| Feature | Where |
|---|---|
| Live WebSocket data streaming (1 tick/sec) | `backend/main.py` → `ws/stream`, `hooks/usePulseStream.ts` |
| Virtual scrolling for large device tables | `components/VirtualTable.tsx` (`@tanstack/react-virtual`) |
| Incremental rendering / windowed DOM | Same as above — only visible rows mount |
| AI Insight Engine (plain-language alerts) | `backend/ai_engine.py` → `generate_insights` |
| Predictive analytics (short-horizon forecast) | `backend/ai_engine.py` → `forecast`, `components/LiveChart.tsx` |
| Time-travel replay (scrub historical ticks) | `components/TimeTravelSlider.tsx`, `/api/history` |
| Regional heat map | `components/HeatMap.tsx` |
| 3D digital twin (animated, hoverable rooms) | `components/DigitalTwin3D.tsx` (raw `three.js`) |
| Smart alerts / notification center | `components/AlertsPanel.tsx` |
| AI chat over live telemetry | `components/AIChat.tsx`, `/api/chat` |
| Self-monitoring performance bar (FPS, memory, cache hit ratio, WS status) | `components/PerformanceMonitor.tsx` |
| CSV export | "Export CSV" button in `TopBar.tsx` |
| Light theme with a dark mode toggle | `App.tsx` (design tokens in `tailwind.config.js`) |
| Animated KPI cards, count-up numbers, staggered page load | `components/KpiCards.tsx`, `framer-motion` throughout |
| Ambient sonification — a generative soundscape whose brightness/tempo tracks live fleet CPU | `hooks/useAmbientSound.ts` (Tone.js), toggle in `TopBar.tsx` |
| Drifting background glow, hover-lift panels, pulsing critical indicators | `App.tsx` background blobs, `index.css` `.panel:hover` and `.status-dot.critical` |

---

<img width="959" height="437" alt="PulseX dashboard overview" src="https://github.com/user-attachments/assets/f257e892-4cb8-4431-8ecd-5945e8361e0f" />
<img width="818" height="420" alt="PulseX digital twin view" src="https://github.com/user-attachments/assets/bf3a3f0b-a22c-4679-b6bc-6f9f96927a82" />

## 🎨 Design Direction

PulseX is deliberately **light-themed** — a "control tower," not a hacker
terminal:

- **Palette:** Near-white canvas (`#F6F8FC`), white glass panels, deep navy
  ink (`#0F1729`) for text, electric blue (`#2D6CDF`) for live/primary data,
  violet (`#7C5CFF`) reserved for anything AI-generated, plus green/amber/red
  status signals.
- **Type:** `Space Grotesk` for display/headings (technical, geometric —
  reads like instrumentation), `Inter` for body copy, and `JetBrains Mono`
  for every live number so telemetry always feels like *data*, not prose.
- **Signature element:** The animated 3D digital twin — a slowly rotating
  isometric factory built from raw `three.js` boxes that glow green, amber,
  or red as room load changes live, plus the pulsing "LIVE" ring in the top
  bar.

---

## 🏗 Architecture

```
                     Browser
                        │
              React Dashboard (Vite)
                        │
            WebSocket (/ws/stream) + REST (/api/*)
                        │
                     FastAPI
        ┌───────────────┼────────────────┐
        │               │                │
  In-memory cache   AI Insight Engine   Simulator
  (Redis stand-in)  (rules + tiny        (device fleet,
        │            regression)         factory & room
        └───────────────┴────────────────┘  state machine
                        │
              Streaming Data Simulator
       (10M-device fleet model, ticks every 1s)
```

The `simulator.py` module plays the role of the Kafka/MQTT pipeline in the
original brief — it advances device CPU, temperature, latency, and vibration
every tick, rolls health up to the factory level, and keeps a 720-tick
rolling history buffer that powers the time-travel slider. `ai_engine.py` is
written so the rule-based insights and forecasting can be swapped for a real
LLM or ML model without changing the API contract (see the docstrings in
that file).

---

## 🚀 Running It Locally

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API is now live at `http://localhost:8000` (docs at `/docs`).

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` and `/ws`
to the backend on port 8000 (see `vite.config.ts`). The dashboard also falls
back to the same-origin-with-port-8000 URL directly in `usePulseStream.ts`,
so it works whether you open it through the proxy or straight from the
built files.

### 3. Production Build

```bash
cd frontend
npm run build      # outputs to frontend/dist
npm run preview    # serve the build locally
```

Deploy `backend/` behind Uvicorn/Gunicorn (Docker + Render/Railway/Fly work
well) and `frontend/dist` to any static host (Vercel/Netlify/S3+CDN). Point
`WS_URL`/`API_BASE` in `usePulseStream.ts` at your deployed backend host.

---

## 📁 Project Structure

```
pulsex/
├── backend/
│   ├── main.py             # FastAPI app: REST + WebSocket endpoints
│   ├── simulator.py         # Streaming device/factory/room state machine
│   ├── ai_engine.py         # Insight generation, forecasting, chat
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── types.ts
│   │   ├── hooks/
│   │   │   └── usePulseStream.ts
│   │   └── components/
│   │       ├── TopBar.tsx
│   │       ├── Sidebar.tsx
│   │       ├── KpiCards.tsx
│   │       ├── LiveChart.tsx
│   │       ├── DigitalTwin3D.tsx
│   │       ├── HeatMap.tsx
│   │       ├── TimeTravelSlider.tsx
│   │       ├── VirtualTable.tsx
│   │       ├── AlertsPanel.tsx
│   │       ├── AIChat.tsx
│   │       └── PerformanceMonitor.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
└── README.md
```

---

## 🔌 Extending It Further

- **Real broker:** Swap `simulator.py`'s in-process loop for a Kafka/Redpanda
  consumer — the WebSocket handler already streams whatever `sim.tick()`
  returns, so only that one function needs to change.
- **Persistence:** The brief calls for PostgreSQL with partitioning, indexes,
  and materialized views for the historical table, and Redis for the cache
  layer. The current build keeps both in-memory for a zero-config demo;
  `_cache` in `main.py` and `Simulator.history` are the two seams to wire up
  real Postgres/Redis clients.
- **Real AI:** `ai_engine.py` is structured so `generate_insights`/`chat` can
  call OpenAI/Gemini instead of the rule engine — drop your key in
  `backend/.env` (see `.env.example`) and replace the method bodies.
- **Auth:** Add JWT middleware to `main.py` for role-based access before
  deploying beyond a demo.

---

---

## 📄 License

This project is available for portfolio and demonstration purposes.

<div align="center">

**Built as a portfolio-grade alternative to a standard CRUD dashboard —**
**closer in spirit to Grafana, Datadog, and an F1 telemetry wall than to a typical BI report.** 🚀

</div>
