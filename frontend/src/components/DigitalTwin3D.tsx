import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Room } from "../types";

const STATUS_COLOR: Record<string, number> = {
  normal: 0x16b981,
  warning: 0xf5a524,
  critical: 0xef4444,
};

interface Props {
  rooms: Room[];
}

export default function DigitalTwin3D({ rooms }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const boxesRef = useRef<Record<string, THREE.Mesh>>({});
  const glowRef = useRef<Record<string, THREE.PointLight>>({});
  const [hovered, setHovered] = useState<Room | null>(null);

  // one-time scene setup
  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl || rooms.length === 0) return;
    const mount = mountEl;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(7, 6.5, 9);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // lighting -- soft studio setup to suit the light theme
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 0.6);
    key.position.set(6, 10, 4);
    scene.add(key);

    // base platform
    const baseGeo = new THREE.CylinderGeometry(5, 5, 0.2, 48);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xeef1f8, roughness: 1 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.5;
    scene.add(base);

    // grid rings for a "control-room floor" feel
    const grid = new THREE.GridHelper(9, 18, 0xd7deea, 0xe6eaf2);
    grid.position.y = -0.39;
    scene.add(grid);

    // build a 2x4 arrangement of rooms as boxes
    const cols = 4;
    const spacing = 1.9;
    const group = new THREE.Group();
    rooms.forEach((room, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const geo = new THREE.BoxGeometry(1.3, 1, 1.3);
      const mat = new THREE.MeshStandardMaterial({
        color: STATUS_COLOR[room.status] ?? 0x16b981,
        roughness: 0.35,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((col - 1.5) * spacing, 0.1, (row - 0.5) * spacing);
      mesh.userData.roomId = room.id;
      group.add(mesh);
      boxesRef.current[room.id] = mesh;

      const light = new THREE.PointLight(STATUS_COLOR[room.status] ?? 0x16b981, 0.6, 3);
      light.position.set(mesh.position.x, 1.4, mesh.position.z);
      group.add(light);
      glowRef.current[room.id] = light;
    });
    scene.add(group);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onPointerMove(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(Object.values(boxesRef.current));
      if (hits.length > 0) {
        const id = hits[0].object.userData.roomId;
        const room = rooms.find((r) => r.id === id) || null;
        setHovered(room);
        mount.style.cursor = "pointer";
      } else {
        setHovered(null);
        mount.style.cursor = "default";
      }
    }
    renderer.domElement.addEventListener("pointermove", onPointerMove);

    let raf: number;
    const clock = new THREE.Clock();
    function animate() {
      const t = clock.getElapsedTime();
      group.rotation.y = Math.sin(t * 0.15) * 0.35 + t * 0.05;
      Object.values(boxesRef.current).forEach((mesh, i) => {
        mesh.position.y = 0.1 + Math.sin(t * 1.2 + i) * 0.02;
      });
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    animate();

    function onResize() {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      boxesRef.current = {};
      glowRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms.length]);

  // live color updates as room status changes, without rebuilding the scene
  useEffect(() => {
    rooms.forEach((room) => {
      const mesh = boxesRef.current[room.id];
      const light = glowRef.current[room.id];
      const color = STATUS_COLOR[room.status] ?? 0x16b981;
      if (mesh) (mesh.material as THREE.MeshStandardMaterial).color.setHex(color);
      if (light) light.color.setHex(color);
    });
  }, [rooms]);

  return (
    <div className="panel p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="font-display font-semibold text-sm">Digital Twin — Alpha Foundry #1</h3>
          <p className="text-xs text-ink-faint">Hover a room to inspect. Color reflects live load.</p>
        </div>
        {hovered && (
          <div className="text-right">
            <div className="text-sm font-medium">{hovered.name}</div>
            <div className="flex items-center gap-1.5 justify-end text-xs text-ink-faint">
              <span className={`status-dot ${hovered.status}`} />
              {hovered.value.toFixed(0)}% load
            </div>
          </div>
        )}
      </div>
      <div ref={mountRef} className="flex-1 min-h-[260px] w-full" />
      <div className="flex gap-4 justify-center text-[11px] text-ink-faint mt-1">
        <span className="flex items-center gap-1"><span className="status-dot normal" /> Normal</span>
        <span className="flex items-center gap-1"><span className="status-dot warning" /> Warning</span>
        <span className="flex items-center gap-1"><span className="status-dot critical" /> Critical</span>
      </div>
    </div>
  );
}
