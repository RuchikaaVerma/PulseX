import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Device } from "../types";
import clsx from "clsx";

interface Props {
  devices: Device[];
}

type SortKey = "cpu" | "temp" | "latency" | "vibration";

export default function VirtualTable({ devices }: Props) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("cpu");
  const [filter, setFilter] = useState("");

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

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 12,
  });

  return (
    <div className="panel p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="font-display font-semibold text-sm">Device Fleet</h3>
          <p className="text-xs text-ink-faint">
            {rows.length.toLocaleString()} rows rendered with windowed virtualization — only visible rows hit the DOM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by id, kind, status…"
            className="text-xs border border-line rounded-lg px-3 py-1.5 outline-none focus:border-signal-info w-48"
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

      <div className="grid grid-cols-[70px_90px_1fr_1fr_1fr_1fr_90px] gap-2 px-2 pb-2 text-[11px] uppercase tracking-wide text-ink-faint font-medium border-b border-line">
        <span>Status</span>
        <span>ID</span>
        <span>Kind</span>
        <span>CPU</span>
        <span>Temp</span>
        <span>Latency</span>
        <span>Vib.</span>
      </div>

      <div ref={parentRef} className="flex-1 overflow-auto min-h-[240px]">
        <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
          {rowVirtualizer.getVirtualItems().map((vRow) => {
            const d = rows[vRow.index];
            return (
              <div
                key={d.id}
                className={clsx(
                  "grid grid-cols-[70px_90px_1fr_1fr_1fr_1fr_90px] gap-2 items-center px-2 text-xs absolute left-0 right-0 border-b border-line/60",
                  vRow.index % 2 === 0 ? "bg-canvas/40" : "bg-transparent"
                )}
                style={{ height: vRow.size, transform: `translateY(${vRow.start}px)` }}
              >
                <span className={`status-dot ${d.status}`} />
                <span className="font-mono text-ink-faint">{d.id}</span>
                <span className="capitalize">{d.kind}</span>
                <span className="mono-num">{d.cpu.toFixed(0)}%</span>
                <span className="mono-num">{d.temp.toFixed(0)}°C</span>
                <span className="mono-num">{d.latency.toFixed(0)}ms</span>
                <span className="mono-num">{d.vibration.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
