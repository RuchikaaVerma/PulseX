import asyncio
import time
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from simulator import Simulator
from ai_engine import AIEngine

app = FastAPI(title="PulseX API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sim = Simulator(n_factories=12, devices_per_factory=40)
ai = AIEngine()

# simple in-memory "cache layer" standing in for Redis in the demo
_cache = {"latest_snapshot": None, "latest_insights": []}


class ChatRequest(BaseModel):
    question: str


@app.get("/")
def root():
    return {"service": "PulseX API", "status": "ok", "devices": len(sim.devices)}


@app.get("/api/health")
def health():
    return {"status": "ok", "uptime_tick": sim.tick_count}


@app.get("/api/snapshot")
def snapshot():
    """Latest cached snapshot -- used on initial page load before the
    WebSocket connects."""
    if _cache["latest_snapshot"] is None:
        _cache["latest_snapshot"] = sim.tick()
    return _cache["latest_snapshot"]


@app.get("/api/devices")
def devices():
    """Full device table -- what the virtual-scrolling grid renders."""
    return sim.all_devices_table()


@app.get("/api/history")
def history(index: int = Query(0, ge=0)):
    """Powers the Time-Travel slider: replays a specific past tick."""
    snap = sim.history_at(index)
    return {"length": len(sim.history), "snapshot": snap}


@app.get("/api/forecast")
def forecast(metric: str = "avg_cpu", horizon: int = 12):
    series = [h["kpis"].get(metric, 0) for h in sim.history]
    pred = ai.forecast(series, horizon=horizon)
    return {"metric": metric, "history": series[-60:], "forecast": pred}


@app.post("/api/chat")
def chat(req: ChatRequest):
    snap = _cache["latest_snapshot"] or sim.tick()
    return ai.chat(req.question, snap)


@app.websocket("/ws/stream")
async def stream(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            snap = sim.tick()
            _cache["latest_snapshot"] = snap
            insights = ai.generate_insights(snap)
            _cache["latest_insights"] = insights
            await ws.send_json({
                "type": "tick",
                "snapshot": snap,
                "insights": insights,
            })
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
