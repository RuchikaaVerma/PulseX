import { motion } from "framer-motion";

function heatColor(v: number) {
  // 100 (healthy) -> green, 0 (unhealthy) -> red, interpolated through amber
  if (v >= 80) return "#16B981";
  if (v >= 60) return "#7BC96F";
  if (v >= 45) return "#F5A524";
  return "#EF4444";
}

export default function HeatMap({ regions }: { regions: Record<string, number> }) {
  const entries = Object.entries(regions);
  return (
    <div className="panel p-5 h-full">
      <h3 className="font-display font-semibold text-sm mb-1">Regional Health Heat Map</h3>
      <p className="text-xs text-ink-faint mb-3">Average factory health score, by region</p>
      <div className="grid grid-cols-2 gap-2.5">
        {entries.map(([region, val]) => (
          <motion.div
            key={region}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl p-3 relative overflow-hidden border border-line"
            style={{ background: `${heatColor(val)}14` }}
          >
            <div className="text-xs font-medium text-ink-soft">{region}</div>
            <div className="mono-num text-lg font-semibold" style={{ color: heatColor(val) }}>
              {val.toFixed(0)}
            </div>
            <div className="absolute bottom-0 left-0 h-1 rounded-full" style={{ width: `${val}%`, background: heatColor(val) }} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
