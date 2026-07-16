"""
PulseX AI Engine
----------------
A dependency-free "AI Insight Engine" that turns raw telemetry into plain
sentences, plus a tiny linear-regression forecaster (the "Predictive
Analytics" box from the plan). If you want real LLM-generated language,
drop an OPENAI_API_KEY / GOOGLE_API_KEY into backend/.env and swap the
`generate_insights` body to call out -- the interface below is already
shaped so that's a drop-in change.
"""
import random
import time
from collections import deque
from typing import List, Dict

import numpy as np


class AIEngine:
    def __init__(self):
        self._cpu_history = deque(maxlen=180)
        self._alert_id = 0

    # ---------- Insight generation ----------
    def generate_insights(self, snapshot: Dict) -> List[Dict]:
        insights = []
        kpis = snapshot["kpis"]
        self._cpu_history.append(kpis["avg_cpu"])

        if len(self._cpu_history) > 10:
            recent = list(self._cpu_history)[-10:]
            delta = recent[-1] - recent[0]
            if delta > 8:
                insights.append(self._make(
                    "warning",
                    f"Average fleet CPU climbed {delta:.0f}% over the last few ticks.",
                    "Cluster load is trending up faster than baseline.",
                ))
            elif delta < -8:
                insights.append(self._make(
                    "good",
                    f"Average fleet CPU dropped {abs(delta):.0f}% — load is easing.",
                    "Recent scaling or workload completion likely helped.",
                ))

        if kpis["critical_devices"] > 0:
            insights.append(self._make(
                "critical",
                f"{kpis['critical_devices']} device(s) are in a critical state right now.",
                "Recommend checking the top-devices table, sorted by CPU.",
            ))

        # find the worst factory
        worst = min(snapshot["factories"], key=lambda f: f["health"]) if snapshot["factories"] else None
        if worst and worst["health"] < 60:
            insights.append(self._make(
                "warning",
                f"{worst['name']} ({worst['region']}) is running at {worst['health']:.0f}% health.",
                "This site has the most devices in warning/critical state.",
            ))

        if kpis["avg_latency"] > 45:
            insights.append(self._make(
                "warning",
                f"Network latency is elevated at {kpis['avg_latency']:.0f} ms fleet-wide.",
                "Check the API gateway and regional edge nodes.",
            ))

        if not insights:
            insights.append(self._make(
                "good",
                "All systems nominal across every monitored factory.",
                "No anomalies detected in the current window.",
            ))

        return insights

    def _make(self, level: str, headline: str, detail: str) -> Dict:
        self._alert_id += 1
        return {
            "id": self._alert_id,
            "level": level,
            "headline": headline,
            "detail": detail,
            "t": time.time(),
        }

    # ---------- Predictive analytics (tiny linear regression) ----------
    def forecast(self, series: List[float], horizon: int = 12) -> List[float]:
        """Fit y = a*x + b on the recent series and project `horizon` steps
        ahead, clipped to a plausible 0-100 range. Stand-in for the
        LSTM/Random-Forest models described in the brief -- same interface,
        swap the fit for a real model without touching the API contract."""
        if len(series) < 5:
            return []
        y = np.array(series[-60:], dtype=float)
        x = np.arange(len(y))
        a, b = np.polyfit(x, y, 1)
        future_x = np.arange(len(y), len(y) + horizon)
        pred = a * future_x + b
        noise = np.random.normal(0, 0.6, size=horizon)
        pred = np.clip(pred + noise, 0, 100)
        return [round(float(v), 1) for v in pred]

    def failure_risk(self, device: Dict) -> float:
        """Toy 'random-forest-style' risk score blending a few signals."""
        cpu = device.get("cpu", 0) / 100
        temp = device.get("temp", 0) / 120
        vib = min(1.0, device.get("vibration", 0) / 2)
        score = 0.5 * cpu + 0.3 * temp + 0.2 * vib
        return round(min(0.99, score), 2)

    # ---------- Chat ----------
    def chat(self, question: str, snapshot: Dict) -> Dict:
        q = question.lower()
        kpis = snapshot["kpis"]
        factories = snapshot["factories"]

        if "fail" in q or "worst" in q or "risk" in q:
            worst = min(factories, key=lambda f: f["health"])
            top_dev = snapshot["top_devices"][0] if snapshot["top_devices"] else None
            answer = (
                f"{worst['name']} in {worst['region']} has the lowest health score "
                f"right now at {worst['health']:.0f}%. "
            )
            if top_dev:
                answer += (
                    f"Device {top_dev['id']} ({top_dev['kind']}) is the highest-risk unit, "
                    f"running at {top_dev['cpu']:.0f}% CPU and {top_dev['temp']:.0f}°C."
                )
            return {"answer": answer, "highlight": worst["id"]}

        if "latency" in q:
            return {
                "answer": f"Fleet-wide average latency is currently {kpis['avg_latency']:.0f} ms.",
                "highlight": None,
            }

        if "cpu" in q or "load" in q:
            return {
                "answer": f"Average CPU across {kpis['devices_online']} devices is {kpis['avg_cpu']:.0f}%.",
                "highlight": None,
            }

        if "request" in q or "traffic" in q or "throughput" in q:
            return {
                "answer": f"The platform is currently handling roughly {kpis['req_per_sec']:,} requests/sec.",
                "highlight": None,
            }

        if "healthy" in q or "best" in q or "good" in q:
            best = max(factories, key=lambda f: f["health"])
            return {
                "answer": f"{best['name']} in {best['region']} is the healthiest site at {best['health']:.0f}%.",
                "highlight": best["id"],
            }

        return {
            "answer": (
                "I can answer questions about factory health, CPU load, latency, "
                "throughput, or which machine is most at risk — try asking "
                "'which factory is most at risk right now?'"
            ),
            "highlight": None,
        }
