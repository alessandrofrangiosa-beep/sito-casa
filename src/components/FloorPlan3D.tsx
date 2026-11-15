"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LineBasicMaterial, Material, Mesh } from "three";
import { Box, Layers, RotateCcw, X } from "lucide-react";
import { CEILING_HEIGHT, OPENINGS_3D, PX_PER_METER, ROOMS_3D, STREET_LABEL, type RoomKind } from "@/data/floorPlan3d";

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
  setTall: (tall: boolean) => void;
  refit: () => void;
};

/**
 * Planimetria in 3D (three.js): ogni stanza è un pavimento colorato con i suoi muri, porte e finestre e il nome scritto a terra.
 * Anteprima nella pagina che ruota lentamente; a schermo intero si ruota sui due assi con un dito
 * (o il mouse), si ingrandisce con due dita / rotellina e si sposta con due dita / tasto destro.
 */
export function FloorPlan3D({ onClose }: { onClose: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  // Si apre sempre a schermo intero: niente anteprima rimpicciolita nella pagina
  const fullRef = useRef(true);
  const full = true;
  const [tall, setTall] = useState(false);
  const [view, setView] = useState<"3d" | "top">("3d");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
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

      const doorMat = new THREE.MeshStandardMaterial({ color: 0xb98a5e, roughness: 0.7 });
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x7cc4f2,
        transparent: true,
        opacity: 0.45,
        roughness: 0.1,
        metalness: 0.1,
        depthWrite: false,
      });
      const frameMat = new THREE.LineBasicMaterial({ color: 0x64748b });
      type P = readonly [number, number];

      /** Blocco orientato lungo il segmento p→q, tra le quote y0 e y1 (metri) */
      const addBox = (p: P, q: P, y0: number, y1: number, depth: number, mat: Material, lines: LineBasicMaterial | null, shadow = true) => {
        const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
        if (len < 0.02 || y1 - y0 < 0.01) return;
        const geo = new THREE.BoxGeometry(len, y1 - y0, depth);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set((p[0] + q[0]) / 2, (y0 + y1) / 2, (p[1] + q[1]) / 2);
        mesh.rotation.y = -Math.atan2(q[1] - p[1], q[0] - p[0]);
        mesh.castShadow = shadow;
        mesh.receiveShadow = shadow;
        walls.add(mesh);
        if (lines) {
          const line = new THREE.LineSegments(new THREE.EdgesGeometry(geo), lines);
          line.position.copy(mesh.position);
          line.rotation.copy(mesh.rotation);
          walls.add(line);
        }
        return mesh;
      };

      // Muri di tutte le stanze e vani di porte e finestre, in metri
      const wallEdges: { a: P; b: P; rail: boolean }[] = [];
      for (const room of ROOMS_3D) {
        const pts = room.pts.map(toM);
        pts.forEach((p, i) => wallEdges.push({ a: p, b: pts[(i + 1) % pts.length], rail: room.kind === "balcony" }));
      }
      const openings = OPENINGS_3D.map((o) => ({
        ...o,
        a: toM(o.a),
        b: toM(o.b),
        into: o.into ? toM(o.into) : undefined,
        tol: (o.tol ?? 32) / PX_PER_METER,
      }));
      const DOOR_H = 2.1;
      const GLASS_DOOR_H = 2.3;
      const WINDOW_TOP = 2.2;

      /** (Ri)costruisce muri, porte e finestre per l'altezza scelta: muri bassi in sezione o pieni a 3 m */
      const buildWalls = (tall: boolean) => {
        for (const o of [...walls.children]) {
          walls.remove(o);
          (o as Mesh).geometry?.dispose?.();
        }
        const H = tall ? CEILING_HEIGHT : LOW_WALL;
        // Con i muri bassi il davanzale si abbassa, così il vetro della finestra resta ben visibile
        const SILL_H = tall ? 0.9 : 0.5;
        const half = WALL_THICKNESS / 2;

        for (const e of wallEdges) {
          const len = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]);
          if (len < 0.05) continue;
          const u = [(e.b[0] - e.a[0]) / len, (e.b[1] - e.a[1]) / len] as const;
          const at = (t: number): P => [e.a[0] + u[0] * t, e.a[1] + u[1] * t];
          const h = e.rail ? RAILING_HEIGHT : H;
          const mat = e.rail ? railMat : wallMat;
          const lines = e.rail ? null : wallEdgeMat;

          // Vani che cadono su questo muro (paralleli e vicini)
          const cuts: { t0: number; t1: number; type: string }[] = [];
          for (const o of openings) {
            if (e.rail && o.type === "window") continue;
            const ol = Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1]);
            const ou = [(o.b[0] - o.a[0]) / ol, (o.b[1] - o.a[1]) / ol];
            if (Math.abs(u[0] * ou[1] - u[1] * ou[0]) > 0.05) continue;
            const rel = [o.a[0] - e.a[0], o.a[1] - e.a[1]];
            if (Math.abs(u[0] * rel[1] - u[1] * rel[0]) > o.tol) continue;
            const ta = rel[0] * u[0] + rel[1] * u[1];
            const tb = (o.b[0] - e.a[0]) * u[0] + (o.b[1] - e.a[1]) * u[1];
            const t0 = Math.max(0, Math.min(ta, tb));
            const t1 = Math.min(len, Math.max(ta, tb));
            if (t1 - t0 > 0.1) cuts.push({ t0, t1, type: o.type });
          }
          cuts.sort((x, y) => x.t0 - y.t0);

          // Tratti pieni (allungati di mezzo spessore agli angoli) e parti sopra/sotto i vani
          const solid = (s: number, f: number) => {
            if (f - s < 0.02) return;
            addBox(at(s === 0 ? -half : s), at(f === len ? len + half : f), 0, h, WALL_THICKNESS, mat, lines);
          };
          let pos = 0;
          for (const c of cuts) {
            if (c.t0 > pos) solid(pos, c.t0);
            if (!e.rail) {
              const p = at(Math.max(pos, c.t0));
              const q = at(c.t1);
              if (c.type === "door" && h > DOOR_H) addBox(p, q, DOOR_H, h, WALL_THICKNESS, mat, lines);
              if (c.type === "glassDoor" && h > GLASS_DOOR_H) addBox(p, q, GLASS_DOOR_H, h, WALL_THICKNESS, mat, lines);
              if (c.type === "window") {
                addBox(p, q, 0, Math.min(SILL_H, h), WALL_THICKNESS, mat, lines);
                if (h > WINDOW_TOP) addBox(p, q, WINDOW_TOP, h, WALL_THICKNESS, mat, lines);
              }
            }
            pos = Math.max(pos, c.t1);
          }
          solid(pos, len);
        }

        // Ante delle porte (socchiuse a 70°) e vetri di finestre e portafinestre
        for (const o of openings) {
          const w = Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1]);
          if (o.type === "door") {
            if (o.leaf === false || !o.into) continue;
            const u = [(o.b[0] - o.a[0]) / w, (o.b[1] - o.a[1]) / w];
            let n = [-u[1], u[0]];
            if ((o.into[0] - o.a[0]) * n[0] + (o.into[1] - o.a[1]) * n[1] < 0) n = [-n[0], -n[1]];
            const ang = (70 * Math.PI) / 180;
            const d = [u[0] * Math.cos(ang) + n[0] * Math.sin(ang), u[1] * Math.cos(ang) + n[1] * Math.sin(ang)];
            const end: P = [o.a[0] + d[0] * (w - 0.04), o.a[1] + d[1] * (w - 0.04)];
            addBox(o.a, end, 0.06, Math.min(DOOR_H - 0.05, H), 0.045, doorMat, frameMat);
          } else {
            const y0 = o.type === "window" ? SILL_H : 0.06;
            const y1 = Math.min(o.type === "window" ? WINDOW_TOP : GLASS_DOOR_H, H);
            const g = addBox(o.a, o.b, y0, y1, 0.04, glassMat, frameMat, false);
            if (g) g.renderOrder = 2;
          }
        }
      };
      buildWalls(false);

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

      // Solo due movimenti: girare la planimetria (attorno all'asse verticale) e inclinare la vista
      // fino quasi all'altezza degli occhi per vedere i muri; più zoom e spostamento con due dita.
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 4;
      controls.maxDistance = 45;
      controls.minPolarAngle = 0;
      controls.maxPolarAngle = Math.PI / 2 - 0.2; // fino a ~79°: si vedono bene i muri senza finire "di taglio"
      controls.screenSpacePanning = true;
      controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
      controls.enabled = false;

      const placeCamera = (v: "3d" | "top") => {
        const aspect = camera.aspect || 1;
        // Distanza che fa stare tutto il piano nell'inquadratura, in verticale e in orizzontale
        const fov = (camera.fov * Math.PI) / 180;
        const need = Math.max(spanZ * 0.5, (spanX / aspect) * 0.62);
        const dist = need / Math.tan(fov / 2) + 1;
        root.quaternion.identity();
        controls.target.set(0, 0, 0);
        camera.up.set(0, 1, 0);
        if (v === "top") {
          camera.position.set(0, dist * 1.2, 0.01); // nord (Via Vittorio Veneto) in alto
        } else {
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
      };
      resize();
      placeCamera("3d");

      const ro = new ResizeObserver(resize);
      ro.observe(mount);

      // In anteprima (non a schermo intero) disegna solo quando la planimetria è visibile
      let visible = true;
      const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
      io.observe(mount);

      let raf = 0;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (!visible && !fullRef.current) return;
        // Anteprima nella pagina: il modello gira lentamente su sé stesso
        controls.update();
        renderer.render(scene, camera);
      };
      loop();

      apiRef.current = {
        reset: (v) => placeCamera(v),
        setTall: (t) => buildWalls(t),
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

  // Il tasto Indietro del telefono chiude la vista 3D invece di lasciare il sito
  const close = useCallback(() => {
    if (window.history.state?.ta390Plan3d) window.history.back();
    else onClose();
  }, [onClose]);

  useEffect(() => {
    window.history.pushState({ ta390Plan3d: true }, "");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onPop = () => onClose();
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
  }, [close, onClose]);

  // Appena il modello è pronto: inquadratura iniziale e comandi attivi
  useEffect(() => {
    if (!ready) return;
    const raf = requestAnimationFrame(() => apiRef.current?.refit());
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  useEffect(() => apiRef.current?.setTall(tall), [tall, ready]);

  const chip = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-2 text-xs font-semibold whitespace-nowrap shadow-soft transition sm:px-3 sm:text-sm ${
      active ? "border-primary bg-primary text-white" : "border-line bg-card text-ink hover:border-primary/40"
    }`;

  return (
    <div>
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
            Trascina per girare e inclinare la planimetria · pizzica o rotellina per avvicinarti · due dita per spostarti
          </p>
        ) : null}
      </div>
    </div>
  );
}
