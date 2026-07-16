import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import KpiCards from "./components/KpiCards";
import LiveChart from "./components/LiveChart";
import DigitalTwin3D from "./components/DigitalTwin3D";
import HeatMap from "./components/HeatMap";
import TimeTravelSlider from "./components/TimeTravelSlider";
import VirtualTable from "./components/VirtualTable";
import AlertsPanel from "./components/AlertsPanel";
import AIChat from "./components/AIChat";
import PerformanceMonitor from "./components/PerformanceMonitor";
import { usePulseStream } from "./hooks/usePulseStream";
import { useAmbientSound } from "./hooks/useAmbientSound";
import type { Snapshot } from "./types";

function downloadCsv(devices: Snapshot["top_devices"]) {
  const header = "id,factory_id,kind,cpu,temp,latency,vibration,status\n";
  const rows = devices
    .map((d) => `${d.id},${d.factory_id},${d.kind},${d.cpu},${d.temp},${d.latency},${d.vibration},${d.status}`)
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pulsex-devices-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const { snapshot: liveSnapshot, insights, connected, cpuSeries, fps, apiBase } = usePulseStream();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [active, setActive] = useState("overview");
  const [scrubSnapshot, setScrubSnapshot] = useState<Snapshot | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [ambientOn, setAmbientOn] = useState(false);

  const snapshot = isLive ? liveSnapshot : scrubSnapshot;
  useAmbientSound(ambientOn, snapshot?.kpis.avg_cpu ?? 40);

  const sections = useMemo(
    () => ["overview", "twin", "devices", "forecast", "alerts"],
    []
  );

  function scrollTo(id: string) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className={theme === "dark" ? "dark-shell" : ""} style={theme === "dark" ? { filter: "invert(1) hue-rotate(180deg)" } : undefined}>
      <div className="min-h-screen flex flex-col relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <motion.div
            className="absolute w-[520px] h-[520px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(45,108,223,0.10), transparent 70%)", top: "-10%", left: "-8%" }}
            animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-[460px] h-[460px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(124,92,255,0.10), transparent 70%)", top: "20%", right: "-6%" }}
            animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(22,185,129,0.08), transparent 70%)", bottom: "-10%", left: "30%" }}
            animate={{ x: [0, 25, 0], y: [0, -20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <TopBar
          connected={connected}
          kpis={snapshot?.kpis}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          onExport={() => snapshot && downloadCsv(snapshot.top_devices)}
          ambientOn={ambientOn}
          onToggleAmbient={() => setAmbientOn((v) => !v)}
        />

        <div className="flex flex-1">
          <Sidebar active={active} onSelect={scrollTo} />

          <main className="flex-1 px-4 sm:px-6 py-6 space-y-5 max-w-[1600px] w-full mx-auto">
            <motion.section
              id="overview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-5"
            >
              <KpiCards kpis={snapshot?.kpis} />

              <TimeTravelSlider
                apiBase={apiBase}
                live={isLive}
                onScrub={(snap, live) => {
                  setIsLive(live);
                  setScrubSnapshot(snap);
                }}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[360px]">
                <div className="lg:col-span-2 h-full">
                  <LiveChart series={cpuSeries} apiBase={apiBase} />
                </div>
                <div className="h-full">
                  <HeatMap regions={snapshot?.regions ?? {}} />
                </div>
              </div>
            </motion.section>

            <motion.section
              id="twin"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[440px]"
            >
              <div className="lg:col-span-2 h-full">
                <DigitalTwin3D rooms={snapshot?.rooms ?? []} />
              </div>
              <div className="h-full" id="alerts">
                <AlertsPanel insights={insights} />
              </div>
            </motion.section>

            <motion.section
              id="devices"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[440px]"
            >
              <div className="lg:col-span-2 h-full">
                <VirtualTable devices={snapshot?.top_devices ?? []} />
              </div>
              <div className="h-full" id="forecast">
                <AIChat apiBase={apiBase} />
              </div>
            </motion.section>
          </main>
        </div>

        <PerformanceMonitor fps={fps} connected={connected} deviceCount={snapshot?.kpis.devices_online ?? 0} />
      </div>
    </div>
  );
}