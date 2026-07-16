import { useState } from "react";
import { motion } from "framer-motion";

interface Msg {
  role: "user" | "ai";
  text: string;
}

const SUGGESTIONS = [
  "Which factory is most at risk right now?",
  "What's the current fleet CPU load?",
  "How much traffic is the platform handling?",
];

export default function AIChat({ apiBase }: { apiBase: string }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Ask me anything about the fleet — health, load, latency, or risk." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(question: string) {
    if (!question.trim()) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "ai", text: data.answer }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: "I couldn't reach the analytics engine — check the backend is running." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel p-5 h-full flex flex-col">
      <div className="mb-3">
        <h3 className="font-display font-semibold text-sm">Ask PulseX</h3>
        <p className="text-xs text-ink-faint">Natural-language questions over live telemetry</p>
      </div>

      <div className="flex-1 overflow-auto space-y-2 mb-3 min-h-[120px]">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-xs rounded-xl px-3 py-2 max-w-[92%] ${
              m.role === "user"
                ? "bg-signal-info/10 text-ink ml-auto"
                : "bg-canvas text-ink-soft border border-line"
            }`}
          >
            {m.text}
          </motion.div>
        ))}
        {loading && <div className="text-xs text-ink-faint px-3">Thinking…</div>}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            className="text-[11px] px-2.5 py-1 rounded-full border border-line text-ink-faint hover:border-signal-info hover:text-signal-info transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a question…"
          className="flex-1 text-xs border border-line rounded-lg px-3 py-2 outline-none focus:border-signal-info"
        />
        <button
          type="submit"
          className="text-xs font-medium px-3 py-2 rounded-lg bg-ink text-white hover:bg-ink/90 transition-colors"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
