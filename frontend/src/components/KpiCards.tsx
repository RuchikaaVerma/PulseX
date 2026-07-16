import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Kpis } from "../types";

function useCountUp(value: number, duration = 500) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    const start = performance.now();

    function step(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(from + (to - from) * progress);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    prev.current = value;
  }, [value, duration]);

  return display;
}

function Card({
  label,
  value,
  suffix = "",
  accent,
  decimals = 0,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent: string;
  decimals?: number;
}) {
  const animated = useCountUp(value);
  return (
    <motion.div
      layout
      className="panel px-5 py-4 flex flex-col gap-1 min-w-[150px]"
    >
      <span className="text-[11px] uppercase tracking-wide text-ink-faint font-medium">{label}</span>
      <span className="mono-num text-2xl font-semibold" style={{ color: accent }}>
        {animated.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
        <span className="text-sm text-ink-faint ml-1">{suffix}</span>
      </span>
    </motion.div>
  );
}

export default function KpiCards({ kpis }: { kpis?: Kpis }) {
  if (!kpis) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="panel h-[76px] shimmer-track" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <Card label="Devices Online" value={kpis.devices_online} accent="#0F1729" />
      <Card label="Factories" value={kpis.factories} accent="#0F1729" />
      <Card label="Avg CPU" value={kpis.avg_cpu} suffix="%" decimals={1} accent="#2D6CDF" />
      <Card label="Avg Latency" value={kpis.avg_latency} suffix="ms" decimals={1} accent="#7C5CFF" />
      <Card label="Requests / sec" value={kpis.req_per_sec} accent="#16B981" />
      <Card
        label="Critical Alerts"
        value={kpis.critical_devices}
        accent={kpis.critical_devices > 0 ? "#EF4444" : "#16B981"}
      />
    </div>
  );
}
