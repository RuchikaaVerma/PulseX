export type Status = "normal" | "warning" | "critical";

export interface Kpis {
  devices_online: number;
  factories: number;
  avg_cpu: number;
  avg_latency: number;
  req_per_sec: number;
  critical_devices: number;
  warning_devices: number;
}

export interface Factory {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  device_count: number;
  health: number;
}

export interface Device {
  id: string;
  factory_id: string;
  kind: string;
  cpu: number;
  temp: number;
  latency: number;
  vibration: number;
  status: Status;
}

export interface Room {
  id: string;
  name: string;
  value: number;
  status: Status;
}

export interface Snapshot {
  t: number;
  tick: number;
  kpis: Kpis;
  factories: Factory[];
  rooms: Room[];
  top_devices: Device[];
  regions: Record<string, number>;
}

export interface Insight {
  id: number;
  level: "good" | "warning" | "critical";
  headline: string;
  detail: string;
  t: number;
}

export interface StreamMessage {
  type: "tick";
  snapshot: Snapshot;
  insights: Insight[];
}
