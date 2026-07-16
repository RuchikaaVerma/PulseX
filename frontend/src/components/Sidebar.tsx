import clsx from "clsx";

const ITEMS = [
  { id: "overview", icon: "◎", label: "Overview" },
  { id: "twin", icon: "▦", label: "Digital Twin" },
  { id: "devices", icon: "≡", label: "Devices" },
  { id: "forecast", icon: "∿", label: "Forecast" },
  { id: "alerts", icon: "▲", label: "Alerts" },
];

interface Props {
  active: string;
  onSelect: (id: string) => void;
}

export default function Sidebar({ active, onSelect }: Props) {
  return (
    <nav className="hidden sm:flex flex-col items-center gap-1 w-16 py-6 border-r border-line bg-panel">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          title={item.label}
          className={clsx(
            "w-11 h-11 rounded-xl flex items-center justify-center text-lg transition-all mb-1",
            active === item.id
              ? "bg-signal-info/10 text-signal-info shadow-[inset_0_0_0_1px_rgba(45,108,223,0.25)]"
              : "text-ink-faint hover:bg-canvas hover:text-ink-soft"
          )}
        >
          <span aria-hidden>{item.icon}</span>
        </button>
      ))}
    </nav>
  );
}
