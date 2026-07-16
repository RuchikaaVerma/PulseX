import { useEffect, useRef, useState } from "react";
import type { Snapshot } from "../types";

interface Props {
  apiBase: string;
  live: boolean;
  onScrub: (snap: Snapshot | null, isLive: boolean) => void;
}

export default function TimeTravelSlider({ apiBase, live, onScrub }: Props) {
  const [length, setLength] = useState(1);
  const [index, setIndex] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!scrubbing) {
      // keep the slider synced to "now" while in live mode
      fetch(`${apiBase}/api/history?index=999999`)
        .then((r) => r.json())
        .then((d) => setLength(d.length || 1));
    }
  }, [apiBase, scrubbing]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    setIndex(val);
    setScrubbing(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      fetch(`${apiBase}/api/history?index=${val}`)
        .then((r) => r.json())
        .then((d) => onScrub(d.snapshot, false));
    }, 60);
  }

  function returnToLive() {
    setScrubbing(false);
    onScrub(null, true);
  }

  return (
    <div className="panel px-5 py-4 flex items-center gap-4">
      <span className="text-xs font-medium text-ink-soft whitespace-nowrap">⏱ Time Travel</span>
      <input
        type="range"
        min={0}
        max={Math.max(1, length - 1)}
        value={scrubbing ? index : length - 1}
        onChange={handleChange}
        className="flex-1 accent-signal-info h-1.5 rounded-full"
      />
      <span className="text-xs font-mono text-ink-faint whitespace-nowrap w-24 text-right">
        {scrubbing ? `tick ${index}` : "now (live)"}
      </span>
      {scrubbing && (
        <button
          onClick={returnToLive}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-signal-info/10 text-signal-info hover:bg-signal-info/20 transition-colors whitespace-nowrap"
        >
          Return to Live
        </button>
      )}
    </div>
  );
}
