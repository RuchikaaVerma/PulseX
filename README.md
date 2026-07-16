# PulseX — Real-Time Intelligence Dashboard

A performance-critical, AI-augmented operations dashboard built for **Flam**.
PulseX simulates monitoring a fleet of 10M IoT devices across 500 factories,
100K users, and 1M API requests/hour — and stays fast doing it.

Instead of a static analytics dashboard, PulseX is built like a real mission
control system: **live streaming telemetry, a 3D digital twin, AI-generated
insights, predictive forecasting, and time-travel replay**, all wrapped in a
light, glass-panel command-center UI.

---

## ✨ Feature checklist

| Feature | Where |
|---|---|
| Live WebSocket data streaming (1 tick/sec) | `backend/main.py` → `ws/stream`, `hooks/usePulseStream.ts` |
| Virtual scrolling for large device tables | `components/VirtualTable.tsx` (`@tanstack/react-virtual`) |
| Incremental rendering / windowed DOM | same as above — only visible rows mount |
| AI Insight Engine (plain-language alerts) | `backend/ai_engine.py` → `generate_insights` |
| Predictive analytics (short-horizon forecast) | `backend/ai_engine.py` → `forecast`, `components/LiveChart.tsx` |
| Time travel replay (scrub historical ticks) | `components/TimeTravelSlider.tsx`, `/api/history` |
| Regional heat map | `components/HeatMap.tsx` |
| 3D Digital Twin (animated, hoverable rooms) | `components/DigitalTwin3D.tsx` (raw `three.js`) |
| Smart alerts / notification center | `components/AlertsPanel.tsx` |
| AI chat over live telemetry | `components/AIChat.tsx`, `/api/chat` |
| Self-monitoring performance bar (FPS, memory, cache hit ratio, WS status) | `components/PerformanceMonitor.tsx` |
| CSV export | "Export CSV" button in `TopBar.tsx` |
| Light theme with a dark toggle | `App.tsx` (design tokens in `tailwind.config.js`) |
| Animated KPI cards, count-up numbers, staggered page load | `components/KpiCards.tsx`, `framer-motion` throughout |

---

## 🎨 Design direction

PulseX is deliberately **light-themed** — a "control tower," not a hacker
terminal:

- **Palette:** near-white canvas (`#F6F8FC`), white glass panels, deep navy
  ink (`#0F1729`) for text, electric blue (`#2D6CDF`) for live/primary data,
  violet (`#7C5CFF`) reserved for anything AI-generated, plus green/amber/red
  status signals.
- **Type:** `Space Grotesk` for display/headings (technical, geometric —
  reads like instrumentation), `Inter` for body copy, `JetBrains Mono` for
  every live number so telemetry always feels like *data*, not prose.
- **Signature element:** the animated 3D Digital Twin — a slowly rotating
  isometric factory built from raw `three.js` boxes that glow green / amber
  / red as room load changes live, plus the pulsing "LIVE" ring in the top
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
original brief — it advances device CPU/temp/latency/vibration every tick,
rolls health up to the factory level, and keeps a 720-tick rolling history
buffer that powers the time-travel slider. `ai_engine.py` is written so the
rule-based insights/forecast can be swapped for a real LLM or ML model
without changing the API contract (see the docstrings in that file).

---

## 🚀 Running it locally

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
to the backend on port 8000 (see `vite.config.ts`), and the dashboard also
falls back to the same-origin-with-port-8000 URL directly in
`usePulseStream.ts`, so it works whether you open it through the proxy or
straight from the built files.

### 3. Production build

```bash
cd frontend
npm run build      # outputs to frontend/dist
npm run preview    # serve the build locally
```

Deploy `backend/` behind Uvicorn/Gunicorn (Docker + Render/Railway/Fly work
well) and `frontend/dist` to any static host (Vercel/Netlify/S3+CDN). Point
`WS_URL`/`API_BASE` in `usePulseStream.ts` at your deployed backend host.

---

## 📁 Project structure

```
pulsex/
├── backend/
│   ├── main.py            # FastAPI app: REST + WebSocket endpoints
│   ├── simulator.py        # Streaming device/factory/room state machine
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

## 🔌 Extending it further

- **Real broker:** swap `simulator.py`'s in-process loop for a Kafka/Redpanda
  consumer — the WebSocket handler already streams whatever `sim.tick()`
  returns, so only that one function needs to change.
- **Persistence:** the brief calls for PostgreSQL with partitioning/indexes/
  materialized views for the historical table, and Redis for the cache
  layer. The current build keeps both in-memory for a zero-config demo;
  `_cache` in `main.py` and `Simulator.history` are the two seams to wire
  up real Postgres/Redis clients.
- **Real AI:** `ai_engine.py` is structured so `generate_insights`/`chat`
  can call OpenAI/Gemini instead of the rule engine — drop your key in
  `backend/.env` (see `.env.example`) and replace the method bodies.
- **Auth:** add JWT middleware to `main.py` for role-based access before
  deploying beyond a demo.

---

Built as a portfolio-grade alternative to a standard CRUD dashboard —
closer in spirit to Grafana, Datadog, and an F1 telemetry wall than to a
typical BI report.
