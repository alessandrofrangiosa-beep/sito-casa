"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Material, Mesh } from "three";
import { Box, Layers, Maximize2, RotateCcw, X } from "lucide-react";
import { CEILING_HEIGHT, PX_PER_METER, ROOMS_3D, STREET_LABEL, type RoomKind } from "@/data/floorPlan3d";

const FLOOR_COLORS: Record<RoomKind, number> = {
  room: 0xf3e9da,
  kitchen: 0xf6efe4,
  wet: 0xdbeafe,
  corridor: 0xfbf7f1,
  balcony: 0xe2e8f0,
};
/** Altezza dei muri in "sezione": abbastanza bassi da vedere dentro ogni stanza */
const LOW_WALL = 1.1;
const WALL_THICKNESS = 0.14;
const RAILING_HEIGHT = 1;


type Api = {
  reset: (view: "3d" | "top") => void;
  rotate: (axis: "x" | "y" | "z") => void;
  setTall: (tall: boolean) => void;
  refit: () => void;
};

/**
 * Planimetria in 3D (three.js): ogni stanza è un pavimento colorato con i suoi muri, con nome, m² e misure.
 * Anteprima nella pagina che ruota lentamente; a schermo intero si ruota sui due assi con un dito
 * (o il mouse), si ingrandisce con due dita / rotellina e si sposta con due dita / tasto destro.
 */
export function FloorPlan3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const fullRef = useRef(false);
  const [full, setFull] = useState(false);
  const [tall, setTall] = useState(false);
  const [view, setView] = useState<"3d" | "top">("3d");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      const { TrackballControls } = await import("three/examples/jsm/controls/TrackballControls.js");
      const mount = mountRef.current;
      if (disposed || !mount) return;

      // Coordinate: pixel del disegno -> metri, centrati sul piano
      const all = ROOMS_3D.flatMap((r) => r.pts);
      const minX = Math.min(...all.map((p) => p[0]));
      const maxX = Math.max(...all.map((p) => p[0]));
      const minY = Math.min(...all.map((p) => p[1]));
      const maxY = Math.max(...all.map((p) => p[1]));
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const toM = ([x, y]: [number, number]) => [(x - cx) / PX_PER_METER, (y - cy) / PX_PER_METER] as const;
      const spanX = (maxX - minX) / PX_PER_METER;
      const spanZ = (maxY - minY) / PX_PER_METER;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);
      // Tutto il modello sta in un gruppo: si può ruotare liberamente sui tre assi X, Y e Z
      const root = new THREE.Group();
      scene.add(root);

      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.style.display = "block";
      renderer.domElement.style.touchAction = "none";
      mount.appendChild(renderer.domElement);

      /**
       * Scritta "stampata" sul pavimento: discreta (grigio chiaro semitrasparente), ruota insieme al modello
       * e non copre mai la planimetria. `width` in metri; `vertical` = scritta lungo il lato lungo (corridoio, balcone).
       */
      const floorText = (text: string, at: readonly [number, number], width: number, vertical = false, opacity = 0.55) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const fontPx = 96;
        ctx.font = `600 ${fontPx}px Inter, system-ui, sans-serif`;
        const tw = Math.ceil(ctx.measureText(text).width) + 24;
        canvas.width = tw;
        canvas.height = Math.round(fontPx * 1.3);
        ctx.font = `600 ${fontPx}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = "#475569";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        const tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 8;
        tex.colorSpace = THREE.SRGBColorSpace;
        const h = (width * canvas.height) / canvas.width;
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(width, h),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false }),
        );
        mesh.rotation.x = -Math.PI / 2;
        if (vertical) mesh.rotation.z = Math.PI / 2;
        mesh.position.set(at[0], 0.07, at[1]);
        mesh.renderOrder = 1;
        root.add(mesh);
      };

      scene.add(new THREE.HemisphereLight(0xffffff, 0xe8e2d8, 1.6));
      const sun = new THREE.DirectionalLight(0xffffff, 1.6);
      sun.position.set(-8, 18, -10);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      const sc = sun.shadow.camera;
      sc.left = -spanZ;
      sc.right = spanZ;
      sc.top = spanZ;
      sc.bottom = -spanZ;
      sun.shadow.bias = -0.0005;
      scene.add(sun);

      // Ombra morbida sotto il piano
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(spanX * 3, spanZ * 2), new THREE.ShadowMaterial({ opacity: 0.08 }));
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.01;
      ground.receiveShadow = true;
      root.add(ground);

      const walls = new THREE.Group();
      root.add(walls);
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
      const wallEdgeMat = new THREE.LineBasicMaterial({ color: 0x475569 });
      const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.35, roughness: 0.6 });

      const addWall = (a: readonly [number, number], b: readonly [number, number], height: number, mat: Material, edges: boolean) => {
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const len = Math.hypot(dx, dz);
        if (len < 0.05) return;
        const geo = new THREE.BoxGeometry(len + WALL_THICKNESS, 1, WALL_THICKNESS);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((a[0] + b[0]) / 2, 0.5, (a[1] + b[1]) / 2);
        mesh.rotation.y = -Math.atan2(dz, dx);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const holder = new THREE.Group();
        holder.add(mesh);
        if (edges) {
          const line = new THREE.LineSegments(new THREE.EdgesGeometry(geo), wallEdgeMat);
          line.position.copy(mesh.position);
          line.rotation.copy(mesh.rotation);
          holder.add(line);
        }
        holder.userData.baseHeight = height;
        holder.scale.y = height;
        walls.add(holder);
      };

      for (const room of ROOMS_3D) {
        const pts = room.pts.map(toM);
        // Pavimento
        const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z)));
        const floorGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false });
        floorGeo.rotateX(Math.PI / 2);
        floorGeo.translate(0, 0.06, 0);
        const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ color: FLOOR_COLORS[room.kind], roughness: 0.85 }));
        floor.receiveShadow = true;
        root.add(floor);

        // Muri (ringhiera semitrasparente per i balconi)
        const isBalcony = room.kind === "balcony";
        pts.forEach((p, i) => addWall(p, pts[(i + 1) % pts.length], isBalcony ? RAILING_HEIGHT : LOW_WALL, isBalcony ? railMat : wallMat, !isBalcony));

        // Nome dell'ambiente scritto sul pavimento, in piccolo (le superfici sono nella planimetria 2D)
        const xs = room.pts.map((p) => p[0]);
        const ys = room.pts.map((p) => p[1]);
        const w = (Math.max(...xs) - Math.min(...xs)) / PX_PER_METER;
        const d = (Math.max(...ys) - Math.min(...ys)) / PX_PER_METER;
        const vertical = d > w * 2.2; // corridoio e balcone laterale: scritta lungo il lato lungo
        const room2d: [number, number] =
          room.name === "Corridoio" ? [421, 1100] : room.name === "Ingresso" ? [430, 700] : [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
        const space = vertical ? d : w;
        const textW = Math.min(space * 0.75, 0.38 * room.name.length, 2.6);
        floorText(room.name, toM(room2d), textW, vertical, room.kind === "balcony" ? 0.45 : 0.55);
      }

      // Nome della strada a terra, davanti al balcone su Via Vittorio Veneto
      floorText(STREET_LABEL.text.toUpperCase(), toM(STREET_LABEL.at), 4.2, false, 0.4);

      // Rotazione libera su tutti gli assi (anche "di lato"), zoom e spostamento
      const controls = new TrackballControls(camera, renderer.domElement);
      controls.rotateSpeed = 3.2;
      controls.zoomSpeed = 1.2;
      controls.panSpeed = 0.9;
      controls.staticMoving = false;
      controls.dynamicDampingFactor = 0.15;
      controls.minDistance = 5;
      controls.maxDistance = 45;
      controls.enabled = false;

      const placeCamera = (v: "3d" | "top") => {
        const aspect = camera.aspect || 1;
        // Distanza che fa stare tutto il piano nell'inquadratura, in verticale e in orizzontale
        const fov = (camera.fov * Math.PI) / 180;
        const need = Math.max(spanZ * 0.5, (spanX / aspect) * 0.62);
        const dist = need / Math.tan(fov / 2) + 1;
        root.quaternion.identity();
        controls.target.set(0, 0, 0);
        if (v === "top") {
          camera.up.set(0, 0, -1); // nord (Via Vittorio Veneto) in alto
          camera.position.set(0, dist * 1.2, 0);
        } else {
          camera.up.set(0, 1, 0);
          // Vista frontale inclinata: il lato lungo del piano resta in verticale, come sullo schermo del telefono
          camera.position.set(dist * 0.18, dist * 0.82, dist * 0.6);
        }
        camera.lookAt(0, 0, 0);
        controls.update();
      };

      const resize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        renderer.domElement.style.width = `${w}px`;
        renderer.domElement.style.height = `${h}px`;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        controls.handleResize();
      };
      resize();
      placeCamera("3d");

      const ro = new ResizeObserver(resize);
      ro.observe(mount);

      // In anteprima (non a schermo intero) disegna solo quando la planimetria è visibile
      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
      io.observe(mount);

      let turn: { from: import("three").Quaternion; to: import("three").Quaternion; start: number } | null = null;
      const AXES = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };

      let raf = 0;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (!visible && !fullRef.current) return;
        // Anteprima nella pagina: il modello gira lentamente su sé stesso
        if (!fullRef.current) root.rotation.y += 0.004;
        // Rotazione animata di 90° chiesta dai pulsanti X / Y / Z
        if (turn) {
          const t = Math.min(1, (performance.now() - turn.start) / 350);
          root.quaternion.slerpQuaternions(turn.from, turn.to, t * (2 - t));
          if (t === 1) turn = null;
        }
        controls.update();
        renderer.render(scene, camera);
      };
      loop();

      apiRef.current = {
        reset: (v) => placeCamera(v),
        rotate: (axis) => {
          const from = root.quaternion.clone();
          const to = new THREE.Quaternion().setFromAxisAngle(AXES[axis], Math.PI / 2).multiply(from);
          turn = { from, to, start: performance.now() };
        },
        setTall: (t) => {
          for (const w of walls.children) {
            const base = w.userData.baseHeight as number;
            w.scale.y = base === RAILING_HEIGHT ? base : t ? CEILING_HEIGHT : LOW_WALL;
          }
        },
        refit: () => {
          resize();
          controls.enabled = fullRef.current;
          placeCamera("3d");
        },
      };
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        controls.dispose();
        renderer.dispose();
        scene.traverse((o) => {
          const m = o as Mesh;
          m.geometry?.dispose?.();
        });
        mount.innerHTML = "";
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
      apiRef.current = null;
    };
  }, []);

  const open = useCallback(() => {
    window.history.pushState({ ta390Plan3d: true }, "");
    setFull(true);
  }, []);
  const close = useCallback(() => {
    if (window.history.state?.ta390Plan3d) window.history.back();
    else setFull(false);
  }, []);

  useEffect(() => {
    fullRef.current = full;
    const raf = requestAnimationFrame(() => {
      apiRef.current?.refit();
      setView("3d");
    });
    if (!full) return () => cancelAnimationFrame(raf);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onPop = () => setFull(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
  }, [full, close]);

  useEffect(() => apiRef.current?.setTall(tall), [tall, ready]);

  const chip = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-2 text-xs font-semibold whitespace-nowrap shadow-soft transition sm:px-3 sm:text-sm ${
      active ? "border-primary bg-primary text-white" : "border-line bg-card text-ink hover:border-primary/40"
    }`;

  return (
    <div>
      {full && <div className="aspect-[4/3]" aria-hidden />}
      <div
        className={full ? "fixed inset-0 z-[60] flex flex-col bg-white" : "relative overflow-hidden rounded-2xl border border-line bg-white shadow-soft"}
        role={full ? "dialog" : undefined}
        aria-modal={full ? true : undefined}
        aria-label={full ? "Planimetria 3D a schermo intero" : undefined}
      >
        {full && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
            <button type="button" className={chip(view === "3d")} onClick={() => { setView("3d"); apiRef.current?.reset("3d"); }}>
              <Box className="h-4 w-4" aria-hidden /> Vista 3D
            </button>
            <button type="button" className={chip(view === "top")} onClick={() => { setView("top"); apiRef.current?.reset("top"); }}>
              <Layers className="h-4 w-4" aria-hidden /> Dall&apos;alto
            </button>
            <button type="button" className={chip(tall)} onClick={() => setTall((t) => !t)} aria-pressed={tall}>
              Muri 3 m
            </button>
            <span className="inline-flex items-center gap-1 rounded-full border border-line bg-card py-1 pr-1 pl-2.5 text-xs font-semibold text-slate-ink shadow-soft">
              Ruota
              {(["x", "y", "z"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => apiRef.current?.rotate(a)}
                  aria-label={`Ruota di 90° sull'asse ${a.toUpperCase()}`}
                  className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary uppercase hover:bg-primary hover:text-white"
                >
                  {a}
                </button>
              ))}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Chiudi"
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-2 text-sm font-semibold text-white shadow-soft sm:px-4"
            >
              <X className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Chiudi</span>
            </button>
          </div>
        )}
        <div ref={mountRef} className={`relative w-full ${full ? "min-h-0 flex-1" : "aspect-[4/3]"}`} />
        {full ? (
          <p className="flex items-center justify-center gap-1.5 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-xs text-slate-ink">
            <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Trascina per ruotare liberamente (assi X, Y e Z) · pizzica o rotellina per ingrandire · due dita per spostare
          </p>
        ) : (
          <button
            type="button"
            onClick={open}
            className="absolute inset-0 flex items-end justify-center bg-transparent p-3"
            aria-label="Apri la planimetria 3D a schermo intero"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-soft">
              <Maximize2 className="h-4 w-4" aria-hidden /> Esplora in 3D
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
