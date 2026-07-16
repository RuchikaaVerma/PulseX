import { useEffect, useRef, useState, useCallback } from "react";
import type { Snapshot, Insight, StreamMessage } from "../types";

const WS_URL = `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}:8000/ws/stream`;
const API_BASE = `${location.protocol}//${location.hostname}:8000`;

export function usePulseStream() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [connected, setConnected] = useState(false);
  const [cpuSeries, setCpuSeries] = useState<{ t: number; cpu: number; latency: number }[]>([]);
  const [fps, setFps] = useState(60);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const frameRef = useRef({ last: performance.now(), count: 0, t0: performance.now() });

  useEffect(() => {
    let raf: number;
    const loop = () => {
      const f = frameRef.current;
      f.count++;
      const now = performance.now();
      if (now - f.t0 > 1000) {
        setFps(f.count);
        f.count = 0;
        f.t0 = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        retryRef.current = 0;
      };

      ws.onmessage = (event) => {
        const msg: StreamMessage = JSON.parse(event.data);
        if (msg.type === "tick") {
          setSnapshot(msg.snapshot);
          setInsights(msg.insights);
          setCpuSeries((prev) => {
            const next = [
              ...prev,
              {
                t: msg.snapshot.tick,
                cpu: msg.snapshot.kpis.avg_cpu,
                latency: msg.snapshot.kpis.avg_latency,
              },
            ];
            return next.slice(-90);
          });
        }
      };

      ws.onclose = () => {
        setConnected(false);
        const delay = Math.min(1000 * 2 ** retryRef.current, 8000);
        retryRef.current++;
        setTimeout(connect, delay);
      };

      ws.onerror = () => ws.close();
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    // seed with a REST snapshot immediately so the UI isn't empty on load
    fetch(`${API_BASE}/api/snapshot`)
      .then((r) => r.json())
      .then((snap: Snapshot) => setSnapshot(snap))
      .catch(() => {});
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  return { snapshot, insights, connected, cpuSeries, fps, apiBase: API_BASE };
}
