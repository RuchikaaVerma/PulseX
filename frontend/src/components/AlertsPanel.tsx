import { AnimatePresence, motion } from "framer-motion";
import type { Insight } from "../types";

const LEVEL_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  good: { bg: "bg-signal-normal/10", text: "text-signal-normal", icon: "✓" },
  warning: { bg: "bg-signal-warn/10", text: "text-signal-warn", icon: "⚠" },
  critical: { bg: "bg-signal-crit/10", text: "text-signal-crit", icon: "🔥" },
};

export default function AlertsPanel({ insights }: { insights: Insight[] }) {
  return (
    <div className="panel p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display font-semibold text-sm">Smart Alerts</h3>
          <p className="text-xs text-ink-faint">AI-generated, in plain language</p>
        </div>
        <span className="w-6 h-6 rounded-full bg-signal-ai/10 text-signal-ai text-xs flex items-center justify-center font-medium">
          {insights.length}
        </span>
      </div>
      <div className="flex-1 overflow-auto space-y-2 min-h-[180px]">
        <AnimatePresence initial={false}>
          {insights.map((insight) => {
            const style = LEVEL_STYLES[insight.level] ?? LEVEL_STYLES.good;
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className={`rounded-xl p-3 ${style.bg} border border-line/60`}
              >
                <div className="flex items-start gap-2">
                  <span className={`text-sm ${style.text}`}>{style.icon}</span>
                  <div>
                    <p className="text-xs font-medium leading-snug">{insight.headline}</p>
                    <p className="text-[11px] text-ink-faint mt-0.5 leading-snug">{insight.detail}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {insights.length === 0 && (
          <p className="text-xs text-ink-faint">Waiting for the first telemetry tick…</p>
        )}
      </div>
    </div>
  );
}
