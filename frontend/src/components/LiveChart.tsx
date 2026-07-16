import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Line, ComposedChart,
} from "recharts";

interface Props {
  series: { t: number; cpu: number; latency: number }[];
  apiBase: string;
}

export default function LiveChart({ series, apiBase }: Props) {
  const [forecast, setForecast] = useState<number[]>([]);

  useEffect(() => {
    const id = setInterval(() => {
      fetch(`${apiBase}/api/forecast?metric=avg_cpu&horizon=10`)
        .then((r) => r.json())
        .then((d) => setForecast(d.forecast || []))
        .catch(() => {});
    }, 4000);
    return () => clearInterval(id);
  }, [apiBase]);

  const lastT = series.length ? series[series.length - 1].t : 0;
  const merged = [
    ...series.map((s) => ({ t: s.t, cpu: s.cpu, latency: s.latency, forecast: undefined as number | undefined })),
    ...forecast.map((v, i) => ({ t: lastT + i + 1, cpu: undefined, latency: undefined, forecast: v })),
  ];

  return (
    <div className="panel p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-display font-semibold text-sm">Fleet CPU &amp; Latency</h3>
          <p className="text-xs text-ink-faint">Live telemetry with a short-horizon AI forecast (dashed)</p>
        </div>
        <div className="flex gap-3 text-[11px] text-ink-faint">
          <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full inline-block" style={{ background: "#2D6CDF" }} />CPU</span>
          <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full inline-block" style={{ background: "#7C5CFF" }} />Latency</span>
          <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full inline-block border border-signal-info" />Forecast</span>
        </div>
      </div>
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={merged} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="cpuFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2D6CDF" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#2D6CDF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#EEF1F8" vertical={false} />
            <XAxis dataKey="t" hide />
            <YAxis width={30} tick={{ fontSize: 10, fill: "#8891A5" }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #E6EAF2", fontSize: 12 }}
              labelFormatter={() => ""}
            />
            <Area type="monotone" dataKey="cpu" stroke="#2D6CDF" fill="url(#cpuFill)" strokeWidth={2} isAnimationActive={false} />
            <Line type="monotone" dataKey="latency" stroke="#7C5CFF" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="forecast" stroke="#2D6CDF" strokeDasharray="4 4" strokeWidth={2} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
