import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Device } from "../types";
import clsx from "clsx";

interface Props {
  devices: Device[];
}

type SortKey = "cpu" | "temp" | "latency" | "vibration";

const STATUS_STYLE: Record<string, { border: string; bg: string; hoverBg: string; hoverBorder: string; label: string }> = {
  normal: {
    border: "border-emerald-200",
    bg: "bg-emerald-50/70",
    hoverBg: "hover:bg-emerald-100/90",
    hoverBorder: "hover:border-emerald-300",
    label: "text-emerald-700",
  },
  warning: {
    border: "border-amber-200",
    bg: "bg-amber-50/70",
    hoverBg: "hover:bg-amber-100/90",
    hoverBorder: "hover:border-amber-300",
    label: "text-amber-700",
  },
  critical: {
    border: "border-red-200",
    bg: "bg-red-50/70",
    hoverBg: "hover:bg-red-100/90",
    hoverBorder: "hover:border-red-300",
    label: "text-red-700",
  },
};

function DeviceCard({ d }: { d: Device }) {
  const s = STATUS_STYLE[d.status] ?? STATUS_STYLE.normal;
  return (
    <div
      className={clsx(
        "rounded-xl border p-3 transition-all duration-200 h-full flex flex-col gap-2 cursor-default",
        "hover:-translate-y-0.5 hover:shadow-panel",
        s.border,
        s.bg,
        s.hoverBg,
        s.hoverBorder
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`status-dot ${d.status} shrink-0`} />
          <span className="font-mono text-xs text-ink-soft truncate">{d.id}</span>
        </div>
        <span className={clsx("text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-white/70 shrink-0", s.label)}>
          {d.kind}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-ink-faint">CPU</span>
          <span className="mono-num font-medium" style={{ color: d.cpu > 90 ? "#EF4444" : d.cpu > 72 ? "#F5A524" : "#0F1729" }}>
            {d.cpu.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-faint">Temp</span>
          <span className="mono-num font-medium">{d.temp.toFixed(0)}°C</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-faint">Latency</span>
          <span className="mono-num font-medium">{d.latency.toFixed(0)}ms</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-faint">Vib.</span>
          <span className="mono-num font-medium">{d.vibration.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default function VirtualTable({ devices }: Props) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("cpu");
  const [filter, setFilter] = useState("");
  const [cols, setCols] = useState(2);

  // pick a column count from the available width, similar to a Tailwind
  // breakpoint, but driven in JS so the virtualizer can chunk rows correctly
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      if (width < 340) setCols(1);
      else if (width < 560) setCols(2);
      else if (width < 820) setCols(3);
      else setCols(4);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = useMemo(() => {
    let list = devices;
    if (filter.trim()) {
      const f = filter.toLowerCase();
      list = list.filter(
        (d) => d.id.toLowerCase().includes(f) || d.kind.toLowerCase().includes(f) || d.status.includes(f)
      );
    }
    return [...list].sort((a, b) => b[sortKey] - a[sortKey]);
  }, [devices, sortKey, filter]);

  const rowGroups = useMemo(() => {
    const groups: Device[][] = [];
    for (let i = 0; i < rows.length; i += cols) {
      groups.push(rows.slice(i, i + cols));
    }
    return groups;
  }, [rows, cols]);

  const rowVirtualizer = useVirtualizer({
    count: rowGroups.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 104,
    overscan: 6,
  });

  return (
    <div className="panel p-5 h-full min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="font-display font-semibold text-sm">Device Fleet</h3>
          <p className="text-xs text-ink-faint">
            {rows.length.toLocaleString()} devices — rendered as a virtualized card grid, only visible rows hit the DOM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by id, kind, status…"
            className="text-xs border border-line rounded-lg px-3 py-1.5 outline-none focus:border-signal-info w-44"
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="text-xs border border-line rounded-lg px-2 py-1.5 outline-none focus:border-signal-info"
          >
            <option value="cpu">Sort: CPU</option>
            <option value="temp">Sort: Temp</option>
            <option value="latency">Sort: Latency</option>
            <option value="vibration">Sort: Vibration</option>
          </select>
        </div>
      </div>

      <div ref={parentRef} className="flex-1 min-h-0 overflow-auto pr-1">
        <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
          {rowVirtualizer.getVirtualItems().map((vRow) => {
            const group = rowGroups[vRow.index];
            return (
              <div
                key={vRow.index}
                className="absolute left-0 right-0 grid gap-2.5 px-0.5"
                style={{
                  top: 0,
                  height: vRow.size,
                  transform: `translateY(${vRow.start}px)`,
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                }}
              >
                {group.map((d) => (
                  <DeviceCard key={d.id} d={d} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
