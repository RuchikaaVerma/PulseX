"""
PulseX Streaming Data Simulator
--------------------------------
Simulates a fleet of IoT devices spread across factories/regions, producing
telemetry the way a real Kafka/MQTT pipeline would. No external broker is
required for the demo -- this module is the "Streaming Data Simulator" box
from the architecture diagram.
"""
import random
import time
import uuid
from dataclasses import dataclass, field, asdict
from typing import List, Dict

REGIONS = ["North America", "Europe", "India", "Japan", "Brazil", "Australia"]

FACTORY_NAMES = [
    "Alpha Foundry", "Nova Assembly", "Titan Works", "Orion Plant",
    "Vertex Fab", "Helix Line", "Zenith Mill", "Quantum Cell",
    "Atlas Yard", "Nimbus Hub",
]

ROOM_NAMES = [
    "Reactor Bay", "Cold Storage", "Assembly Floor A", "Assembly Floor B",
    "Server Room", "Loading Dock", "QA Lab", "Packaging Line",
]


@dataclass
class Factory:
    id: str
    name: str
    region: str
    lat: float
    lng: float
    device_count: int
    health: float = 100.0


@dataclass
class Device:
    id: str
    factory_id: str
    kind: str
    cpu: float = 40.0
    temp: float = 45.0
    latency: float = 20.0
    vibration: float = 0.2
    status: str = "normal"  # normal | warning | critical
    cpu_baseline: float = 40.0
    temp_baseline: float = 45.0
    latency_baseline: float = 20.0
    spike_ticks_left: int = 0


def _rand_coord():
    return round(random.uniform(-60, 60), 4), round(random.uniform(-140, 140), 4)


class Simulator:
    """In-memory stateful simulator. Advances every tick() call."""

    def __init__(self, n_factories: int = 12, devices_per_factory: int = 40):
        self.factories: List[Factory] = []
        self.devices: List[Device] = []
        self.tick_count = 0
        self.history: List[Dict] = []  # rolling window for "time travel"
        self.request_log: List[Dict] = []

        kinds = ["sensor", "robot-arm", "conveyor", "hvac", "pump", "camera"]
        for i in range(n_factories):
            lat, lng = _rand_coord()
            region = REGIONS[i % len(REGIONS)]
            f = Factory(
                id=str(uuid.uuid4())[:8],
                name=f"{FACTORY_NAMES[i % len(FACTORY_NAMES)]} #{i+1}",
                region=region,
                lat=lat,
                lng=lng,
                device_count=devices_per_factory,
            )
            self.factories.append(f)
            for d in range(devices_per_factory):
                cpu_base = random.uniform(28, 52)
                temp_base = random.uniform(38, 55)
                lat_base = random.uniform(12, 35)
                self.devices.append(
                    Device(
                        id=str(uuid.uuid4())[:8],
                        factory_id=f.id,
                        kind=random.choice(kinds),
                        cpu=cpu_base,
                        temp=temp_base,
                        latency=lat_base,
                        cpu_baseline=cpu_base,
                        temp_baseline=temp_base,
                        latency_baseline=lat_base,
                    )
                )

        # digital twin rooms (single hero factory)
        self.rooms = [
            {"id": str(uuid.uuid4())[:8], "name": r, "value": 40.0, "status": "normal"}
            for r in ROOM_NAMES
        ]

    def tick(self) -> Dict:
        self.tick_count += 1
        now = time.time()

        # --- devices drift with mean reversion, occasional self-healing spikes ---
        for d in self.devices:
            # gently pull each metric back toward its own baseline so the
            # fleet oscillates around a steady state instead of random-
            # walking to 100% and staying there forever
            reversion = 0.06
            d.cpu += reversion * (d.cpu_baseline - d.cpu) + random.uniform(-1.6, 1.6)
            d.temp += reversion * (d.temp_baseline - d.temp) + random.uniform(-0.8, 0.8)
            d.latency += reversion * (d.latency_baseline - d.latency) + random.uniform(-2, 2)
            d.vibration += 0.1 * (0.2 - d.vibration) + random.uniform(-0.03, 0.03)

            # rare spike event -- decays back down automatically over the
            # following ticks rather than requiring an external reset
            if d.spike_ticks_left > 0:
                d.spike_ticks_left -= 1
            elif random.random() < 0.0015:
                d.spike_ticks_left = random.randint(4, 10)
                d.cpu = min(100, d.cpu + random.uniform(25, 45))
                d.temp = min(120, d.temp + random.uniform(10, 25))

            d.cpu = min(100, max(2, d.cpu))
            d.temp = min(120, max(15, d.temp))
            d.latency = max(1, d.latency)
            d.vibration = max(0, d.vibration)

            if d.cpu > 90 or d.temp > 95:
                d.status = "critical"
            elif d.cpu > 72 or d.temp > 78:
                d.status = "warning"
            else:
                d.status = "normal"

        # --- factory health rollup ---
        for f in self.factories:
            fleet = [d for d in self.devices if d.factory_id == f.id]
            if fleet:
                crit = sum(1 for d in fleet if d.status == "critical")
                warn = sum(1 for d in fleet if d.status == "warning")
                f.health = max(0, 100 - crit * 8 - warn * 3)

        # --- digital twin rooms ---
        for r in self.rooms:
            baseline = r.setdefault("baseline", 40.0)
            r["value"] += 0.08 * (baseline - r["value"]) + random.uniform(-3.5, 3.5)
            if random.random() < 0.006:
                r["value"] = min(100, r["value"] + random.uniform(15, 30))
            r["value"] = min(100, max(5, r["value"]))
            r["status"] = (
                "critical" if r["value"] > 88 else "warning" if r["value"] > 68 else "normal"
            )

        # --- request throughput sample ---
        req_per_sec = max(0, int(random.gauss(1_000_000 / 3600, 150)))

        snapshot = {
            "t": now,
            "tick": self.tick_count,
            "kpis": {
                "devices_online": len(self.devices),
                "factories": len(self.factories),
                "avg_cpu": round(sum(d.cpu for d in self.devices) / len(self.devices), 1),
                "avg_latency": round(sum(d.latency for d in self.devices) / len(self.devices), 1),
                "req_per_sec": req_per_sec,
                "critical_devices": sum(1 for d in self.devices if d.status == "critical"),
                "warning_devices": sum(1 for d in self.devices if d.status == "warning"),
            },
            "factories": [asdict(f) for f in self.factories],
            "rooms": self.rooms,
            "top_devices": [
                asdict(d)
                for d in sorted(self.devices, key=lambda x: x.cpu, reverse=True)[:60]
            ],
            "regions": self._region_heat(),
        }

        self.history.append(snapshot)
        if len(self.history) > 720:  # ~ keep last N ticks for time-travel scrubbing
            self.history.pop(0)

        return snapshot

    def _region_heat(self):
        out = {}
        for f in self.factories:
            out.setdefault(f.region, []).append(f.health)
        return {region: round(sum(v) / len(v), 1) for region, v in out.items()}

    def all_devices_table(self):
        return [asdict(d) for d in self.devices]

    def history_at(self, index: int):
        if not self.history:
            return None
        index = max(0, min(index, len(self.history) - 1))
        return self.history[index]