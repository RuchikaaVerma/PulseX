import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Kpis } from "../types";

interface Props {
  connected: boolean;
  kpis?: Kpis;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onExport: () => void;
  ambientOn: boolean;
  onToggleAmbient: () => void;
}

export default function TopBar({ connected, kpis, theme, onToggleTheme, onExport, ambientOn, onToggleAmbient }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-line bg-panel/80 backdrop-blur sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <motion.div
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-signal-info to-signal-ai flex items-center justify-center shadow-glow"
          animate={{ boxShadow: ["0 0 0 0 rgba(45,108,223,0.35)", "0 0 0 8px rgba(45,108,223,0)"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
        >
          <span className="text-white font-display font-bold text-sm">Px</span>
        </motion.div>
        <div>
          <div className="font-display font-semibold text-lg leading-none tracking-tight">PulseX</div>
          <div className="text-[11px] text-ink-faint leading-none mt-0.5">Real-Time Intelligence Dashboard</div>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
        <div className="live-dot w-2 h-2 rounded-full bg-signal-normal" />
        <span className="text-xs text-ink-soft font-mono">
          {connected ? "LIVE STREAM CONNECTED" : "RECONNECTING…"}
        </span>
        {kpis && (
          <span className="text-xs text-ink-faint font-mono ml-2 truncate">
            · {kpis.req_per_sec.toLocaleString()} req/s · {kpis.devices_online.toLocaleString()} devices
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:block text-right">
          <div className="font-mono text-sm text-ink">
            {now.toLocaleTimeString("en-US", { hour12: false })}
          </div>
          <div className="text-[10px] text-ink-faint">
            {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
        </div>

        <button
          onClick={onExport}
          className="text-xs font-medium px-3 py-2 rounded-lg border border-line hover:bg-canvas transition-colors"
        >
          Export CSV
        </button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggleAmbient}
          title="Ambient sonification — a generative soundscape tied to live fleet load"
          className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
            ambientOn
              ? "border-signal-ai/40 bg-signal-ai/10 text-signal-ai"
              : "border-line hover:bg-canvas text-ink-faint"
          }`}
          aria-label="Toggle ambient sound"
          aria-pressed={ambientOn}
        >
          <motion.span
            animate={ambientOn ? { scale: [1, 1.25, 1] } : { scale: 1 }}
            transition={ambientOn ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : {}}
          >
            {ambientOn ? "🔊" : "🔈"}
          </motion.span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onToggleTheme}
          className="w-9 h-9 rounded-lg border border-line flex items-center justify-center hover:bg-canvas transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "light" ? "🌙" : "☀️"}
        </motion.button>
      </div>
    </header>
  );
}