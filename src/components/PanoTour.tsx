"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Mesh, Object3D, Texture } from "three";
import { ChevronDown, Maximize2, Minimize2, Move } from "lucide-react";
import { PANO_START, PANO_STATIONS, planHeading, type PanoStation } from "@/data/panoTour";
import { ROOMS_3D } from "@/data/floorPlan3d";

type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void };

type Api = {
  go: (id: string, opts?: { yaw?: number }) => void;
  setFull: (full: boolean) => void;
};

const BY_ID = new Map(PANO_STATIONS.map((s) => [s.id, s]));
const D2R = Math.PI / 180;
/** Altezza degli occhi (unità della scena): le frecce stanno sul pavimento, un'unità più in basso */
const EYE = 1;
const FADE_MS = 800;

/** Direzione di vista (yaw/pitch in gradi) → vettore: yaw 0 = -Z (centro della panoramica), positivo verso destra */
const dirOf = (yaw: number, pitch: number): [number, number, number] => [
  Math.sin(yaw * D2R) * Math.cos(pitch * D2R),
  Math.sin(pitch * D2R),
  -Math.cos(yaw * D2R) * Math.cos(pitch * D2R),
];
/** Differenza tra due angoli in gradi, tra -180 e 180 */
const angDiff = (a: number, b: number) => ((((a - b) % 360) + 540) % 360) - 180;

/**
 * Tour virtuale a 360° stile Street View, costruito sulle foto panoramiche reali dell'appartamento.
 * - Trascina per guardarti intorno (su telefono, nella pagina, il trascinamento verticale fa scorrere la pagina:
 *   niente "trappola"; a schermo intero si muove la vista in tutte le direzioni).
 * - Per spostarti: tocca le frecce a terra (con il nome della stanza) oppure un punto del pavimento: il cursore
 *   circolare che segue il mouse diventa blu quando in quella direzione c'è un passaggio.
 * - Mini-planimetria con il punto in cui sei e la direzione in cui guardi; menu con tutte le stanze.
 */
export function PanoTour() {
  const boxRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const coneRef = useRef<SVGPathElement>(null);
  const apiRef = useRef<Api | null>(null);
  const fullRef = useRef(false);

  const [stationId, setStationId] = useState(PANO_START);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [full, setFull] = useState(false);

  const station = BY_ID.get(stationId)!;

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      const mount = mountRef.current;
      if (disposed || !mount) return;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      const canvas = renderer.domElement;
      canvas.style.display = "block";
      canvas.style.cursor = "grab";
      mount.appendChild(canvas);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.05, 200);
      const maxAniso = renderer.capabilities.getMaxAnisotropy();

      // Due sfere con la foto panoramica all'interno: A = stanza attuale, B = stanza successiva in dissolvenza
      const sphereGeo = new THREE.SphereGeometry(50, 96, 64);
      sphereGeo.scale(-1, 1, 1);
      const makeSphere = (order: number) => {
        const m = new THREE.Mesh(
          sphereGeo,
          new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide }),
        );
        m.rotation.y = -Math.PI / 2; // centro della foto = davanti (-Z)
        m.renderOrder = order;
        scene.add(m);
        return m;
      };
      const sphereA = makeSphere(0);
      const sphereB = makeSphere(1);
      sphereB.visible = false;
      const matA = sphereA.material as InstanceType<typeof THREE.MeshBasicMaterial>;
      const matB = sphereB.material as InstanceType<typeof THREE.MeshBasicMaterial>;

      // Frecce a terra stile Street View
      const arrows = new THREE.Group();
      scene.add(arrows);
      const chevronShape = new THREE.Shape();
      [
        [0, 0.2],
        [0.24, -0.05],
        [0.16, -0.14],
        [0, 0.03],
        [-0.16, -0.14],
        [-0.24, -0.05],
      ].forEach(([x, y], i) => (i ? chevronShape.lineTo(x, y) : chevronShape.moveTo(x, y)));
      const chevronGeo = new THREE.ShapeGeometry(chevronShape);
      const discGeo = new THREE.CircleGeometry(0.34, 48);
      const hitGeo = new THREE.CircleGeometry(0.55, 24);

      // Cursore sul pavimento (segue il mouse)
      const cursor = new THREE.Group();
      const cursorRingMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthTest: false });
      const cursorDiscMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthTest: false });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.25, 64), cursorRingMat);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.2, 48), cursorDiscMat);
      ring.renderOrder = disc.renderOrder = 5;
      cursor.add(ring, disc);
      cursor.rotation.x = -Math.PI / 2;
      cursor.visible = false;
      scene.add(cursor);

      // Vista
      let lon = BY_ID.get(PANO_START)!.yaw;
      let lat = -8;
      let baseFov = 75;
      let fovPulse = 0;
      let current: PanoStation = BY_ID.get(PANO_START)!;
      let transitioning = false;
      let velLon = 0;
      let velLat = 0;

      const updateCamera = () => {
        lat = Math.max(-85, Math.min(85, lat));
        camera.fov = baseFov * (1 - fovPulse);
        camera.updateProjectionMatrix();
        const [x, y, z] = dirOf(lon, lat);
        camera.lookAt(x, y, z);
      };

      // Texture: anteprima leggera subito, alta risoluzione appena arriva (con cache)
      const loader = new THREE.TextureLoader();
      const cache = new Map<string, Promise<Texture>>();
      const loadTex = (url: string) => {
        let p = cache.get(url);
        if (!p) {
          p = loader.loadAsync(url).then((t) => {
            t.colorSpace = THREE.SRGBColorSpace;
            t.anisotropy = maxAniso;
            return t;
          });
          p.catch(() => cache.delete(url));
          cache.set(url, p);
        }
        return p;
      };
      const fullLoaded = new Set<string>();
      const bestTex = async (s: PanoStation) => (fullLoaded.has(s.id) ? loadTex(s.src) : loadTex(s.preview));
      const upgrade = (s: PanoStation) => {
        loadTex(s.src)
          .then((t) => {
            fullLoaded.add(s.id);
            if (current.id === s.id && !transitioning) {
              matA.map = t;
              matA.needsUpdate = true;
            }
          })
          .catch(() => {});
      };

      const buildArrows = (s: PanoStation) => {
        for (const o of [...arrows.children]) arrows.remove(o);
        s.links.forEach((l, i) => {
          const pitch = Math.min(l.pitch, -9);
          const hd = Math.min(EYE / Math.tan(-pitch * D2R), 6);
          const holder = new THREE.Group();
          holder.position.set(Math.sin(l.yaw * D2R) * hd, -EYE, -Math.cos(l.yaw * D2R) * hd);
          holder.rotation.y = -l.yaw * D2R;
          const flat = new THREE.Group();
          flat.rotation.x = -Math.PI / 2;
          const back = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.32, depthTest: false }));
          const chev = new THREE.Mesh(chevronGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthTest: false }));
          const hit = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false }));
          back.renderOrder = 3;
          chev.renderOrder = 4;
          flat.add(back, chev, hit);
          holder.add(flat);
          holder.userData = { link: i, chev };
          hit.userData = { link: i };
          arrows.add(holder);
        });
      };

      const show = async (id: string, opts: { yaw?: number; fade: boolean }) => {
        const s = BY_ID.get(id);
        if (!s || transitioning || disposed) return;
        setBusy(true);
        let tex: Texture;
        try {
          tex = await bestTex(s);
        } catch {
          setFailed(true);
          setBusy(false);
          return;
        }
        if (disposed) return;
        setFailed(false);
        setBusy(false);
        setStationId(s.id);
        setMenuOpen(false);
        const finish = () => {
          matA.map = tex;
          matA.opacity = 1;
          matA.needsUpdate = true;
          sphereB.visible = false;
          current = s;
          transitioning = false;
          fovPulse = 0;
          buildArrows(s);
          upgrade(s);
          // Precarica le anteprime delle stanze collegate: il passaggio successivo è immediato
          s.links.forEach((l) => {
            const n = BY_ID.get(l.to);
            if (n) loadTex(n.preview).catch(() => {});
          });
        };
        // Arrivando in una stanza la vista si gira dolcemente verso il punto più bello (finestra, vista mare)
        const targetYaw = opts.yaw ?? s.yaw;
        if (!opts.fade || !matA.map) {
          lon = targetYaw;
          finish();
          return;
        }
        const lon0 = lon;
        const turn = angDiff(targetYaw, lon0);
        // Dissolvenza con una leggera "spinta in avanti" (zoom), come camminare verso la porta
        transitioning = true;
        for (const o of [...arrows.children]) arrows.remove(o);
        matB.map = tex;
        matB.opacity = 0;
        matB.needsUpdate = true;
        sphereB.visible = true;
        const t0 = performance.now();
        await new Promise<void>((resolve) => {
          const step = () => {
            if (disposed) return resolve();
            const t = Math.min(1, (performance.now() - t0) / FADE_MS);
            const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            matB.opacity = e;
            fovPulse = 0.16 * Math.sin(Math.PI * t);
            lon = lon0 + turn * e;
            velLon = velLat = 0;
            if (t < 1) requestAnimationFrame(step);
            else resolve();
          };
          requestAnimationFrame(step);
        });
        finish();
      };

      // Interazione: trascinamento, pizzico, rotellina, clic sulle frecce o sul pavimento
      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const pointers = new Map<number, { x: number; y: number }>();
      let down: { x: number; y: number; t: number; moved: boolean } | null = null;
      let pinch: { dist: number; fov: number } | null = null;
      let hoverLink = -1;

      const rayFrom = (cx: number, cy: number) => {
        const r = canvas.getBoundingClientRect();
        ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        return raycaster.ray;
      };
      /** Passaggio verso cui punta il puntatore: freccia colpita o, sul pavimento, la porta più vicina in quella direzione */
      const linkAt = (cx: number, cy: number): { link: number; floor: [number, number, number] | null } => {
        const ray = rayFrom(cx, cy);
        const hits = raycaster.intersectObjects(arrows.children, true);
        const hit = hits.find((h) => h.object.userData.link !== undefined);
        let floor: [number, number, number] | null = null;
        if (ray.direction.y < -0.04) {
          const t = -EYE / ray.direction.y;
          floor = [ray.direction.x * t, -EYE, ray.direction.z * t];
        }
        if (hit) return { link: hit.object.userData.link as number, floor };
        if (!floor) return { link: -1, floor };
        const yaw = Math.atan2(floor[0], -floor[2]) / D2R;
        let best = -1;
        let bestD = 32;
        current.links.forEach((l, i) => {
          const d = Math.abs(angDiff(l.yaw, yaw));
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        });
        return { link: best, floor };
      };

      const setHover = (i: number) => {
        hoverLink = i;
        for (const a of arrows.children) {
          const on = a.userData.link === i;
          a.scale.setScalar(on ? 1.18 : 1);
          ((a.userData.chev as Mesh).material as InstanceType<typeof THREE.MeshBasicMaterial>).color.set(on ? 0x60b5ff : 0xffffff);
        }
        labelRefs.current.forEach((el, k) => el?.classList.toggle("is-hover", k === i));
      };

      const onDown = (e: PointerEvent) => {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        canvas.setPointerCapture?.(e.pointerId);
        if (pointers.size === 1) {
          down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
          velLon = velLat = 0;
          canvas.style.cursor = "grabbing";
        } else if (pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), fov: baseFov };
          down = null;
        }
      };
      const onMove = (e: PointerEvent) => {
        const prev = pointers.get(e.pointerId);
        if (!prev) {
          // Solo mouse in sospensione: cursore circolare sul pavimento
          if (e.pointerType === "mouse" && !transitioning) {
            const { link, floor } = linkAt(e.clientX, e.clientY);
            cursor.visible = !!floor;
            if (floor) cursor.position.set(floor[0], -EYE + 0.002, floor[2]);
            const color = link >= 0 ? 0x60b5ff : 0xffffff;
            cursorRingMat.color.set(color);
            cursorDiscMat.color.set(color);
            canvas.style.cursor = link >= 0 ? "pointer" : "grab";
            if (link !== hoverLink) setHover(link);
          }
          return;
        }
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch && pointers.size >= 2) {
          const [a, b] = [...pointers.values()];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          baseFov = Math.max(30, Math.min(90, (pinch.fov * pinch.dist) / Math.max(d, 1)));
          userZoomed = true;
          return;
        }
        if (!down) return;
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;
        if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) down.moved = true;
        const degPerPx = camera.fov / canvas.clientHeight;
        lon -= dx * degPerPx;
        lat += dy * degPerPx;
        velLon = -dx * degPerPx;
        velLat = dy * degPerPx;
        cursor.visible = false;
      };
      const onUp = (e: PointerEvent) => {
        pointers.delete(e.pointerId);
        if (pointers.size < 2) pinch = null;
        canvas.style.cursor = "grab";
        if (down && pointers.size === 0) {
          const tap = !down.moved && performance.now() - down.t < 600;
          down = null;
          if (tap && !transitioning) {
            velLon = velLat = 0;
            const { link } = linkAt(e.clientX, e.clientY);
            if (link >= 0) void show(current.links[link].to, { fade: true });
          }
        }
      };
      const onCancel = (e: PointerEvent) => {
        // Il browser ha preso il gesto (scorrimento verticale della pagina): nessun clic
        pointers.delete(e.pointerId);
        down = null;
        pinch = null;
      };
      const onLeave = () => {
        cursor.visible = false;
        if (hoverLink !== -1) setHover(-1);
      };
      // Rotellina: zoom a schermo intero (o con Ctrl / pizzico del trackpad); altrimenti scorre la pagina
      const onWheel = (e: WheelEvent) => {
        if (!fullRef.current && !e.ctrlKey) return;
        e.preventDefault();
        baseFov = Math.max(30, Math.min(90, baseFov + e.deltaY * (e.ctrlKey ? 0.2 : 0.04)));
      };
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onCancel);
      canvas.addEventListener("pointerleave", onLeave);
      canvas.addEventListener("wheel", onWheel, { passive: false });

      const applyTouchMode = () => {
        // Nella pagina il trascinamento verticale fa scorrere la pagina; a schermo intero muove la vista
        canvas.style.touchAction = fullRef.current ? "none" : "pan-y";
      };
      applyTouchMode();

      const resize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        camera.aspect = w / h;
        if (!userZoomed) baseFov = w / h < 1 ? 82 : 72;
      };
      let userZoomed = false;
      canvas.addEventListener("wheel", () => (userZoomed = true), { passive: true });
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(mount);

      let visible = true;
      const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting), { threshold: 0 });
      io.observe(mount);

      // Etichette HTML delle frecce + cono della direzione sulla mini-planimetria
      const v3 = new THREE.Vector3();
      const placeLabels = () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const placed: { el: HTMLButtonElement; x: number; y: number; w: number }[] = [];
        arrows.children.forEach((a: Object3D) => {
          const el = labelRefs.current[a.userData.link as number];
          if (!el) return;
          v3.copy(a.position);
          v3.y += 0.02;
          v3.project(camera);
          const behind = v3.z > 1 || v3.z < -1;
          const x = (v3.x * 0.5 + 0.5) * w;
          const y = (-v3.y * 0.5 + 0.5) * h + 22;
          const off = behind || x < -40 || x > w + 40 || y < -20 || y > h + 60;
          el.style.opacity = off || transitioning ? "0" : "1";
          el.style.pointerEvents = off || transitioning ? "none" : "auto";
          if (!off) placed.push({ el, x, y, w: el.offsetWidth || 90 });
        });
        // Due porte vicine (es. cucina e bagno in fondo al corridoio): le etichette non si coprono
        placed.sort((p, q) => p.y - q.y);
        placed.forEach((p, i) => {
          for (let j = 0; j < i; j++) {
            const q = placed[j];
            if (Math.abs(p.x - q.x) < (p.w + q.w) / 2 + 4 && p.y < q.y + 30) p.y = q.y + 30;
          }
          p.el.style.transform = `translate(-50%, 0) translate(${p.x}px, ${p.y}px)`;
        });
        for (let k = arrows.children.length; k < labelRefs.current.length; k++) {
          const el = labelRefs.current[k];
          if (el) el.style.opacity = "0";
        }
        const cone = coneRef.current;
        if (cone) {
          const [px, py] = current.plan;
          const hfov = 2 * Math.atan(Math.tan((camera.fov * D2R) / 2) * camera.aspect) / D2R;
          const L = 160;
          const [ax, ay] = planHeading(lon - hfov / 2);
          const [bx, by] = planHeading(lon + hfov / 2);
          cone.setAttribute("d", `M${px},${py} L${px + ax * L},${py + ay * L} A${L},${L} 0 0 ${planSweep()} ${px + bx * L},${py + by * L} Z`);
        }
      };
      // Verso dell'arco del cono (la mappa è specchiata rispetto alle foto)
      const planSweep = () => {
        const [ax, ay] = planHeading(0);
        const [bx, by] = planHeading(10);
        return ax * by - ay * bx > 0 ? 1 : 0;
      };

      let raf = 0;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (!visible && !fullRef.current) return;
        if (!down && !pinch && (Math.abs(velLon) > 0.001 || Math.abs(velLat) > 0.001)) {
          lon += velLon;
          lat += velLat;
          velLon *= 0.9;
          velLat *= 0.9;
        }
        updateCamera();
        renderer.render(scene, camera);
        placeLabels();
      };
      loop();

      apiRef.current = {
        go: (id, opts) => void show(id, { fade: true, yaw: opts?.yaw }),
        setFull: () => {
          applyTouchMode();
          requestAnimationFrame(resize);
        },
      };
      await show(PANO_START, { fade: false, yaw: BY_ID.get(PANO_START)!.yaw });

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointercancel", onCancel);
        canvas.removeEventListener("pointerleave", onLeave);
        canvas.removeEventListener("wheel", onWheel);
        cache.forEach((p) => p.then((t) => t.dispose()).catch(() => {}));
        scene.traverse((o) => (o as Mesh).geometry?.dispose?.());
        renderer.dispose();
        mount.innerHTML = "";
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
      apiRef.current = null;
    };
  }, []);

  // Schermo intero: nativo dove possibile (Android, computer), altrimenti a tutta finestra (iPhone)
  const exitNative = () => {
    const d = document as FsDocument;
    if (d.fullscreenElement) void d.exitFullscreen?.().catch(() => {});
    else if (d.webkitFullscreenElement) void d.webkitExitFullscreen?.();
  };
  const openFull = useCallback(() => {
    setFull(true);
    window.history.pushState({ ta390Pano: true }, "");
    const el = boxRef.current as FsElement | null;
    try {
      const req = el?.requestFullscreen?.bind(el) ?? el?.webkitRequestFullscreen?.bind(el);
      const p = req?.();
      if (p && typeof (p as Promise<void>).catch === "function") (p as Promise<void>).catch(() => {});
    } catch {
      /* non disponibile: resta la vista a tutta finestra */
    }
  }, []);
  const closeFull = useCallback(() => {
    if (window.history.state?.ta390Pano) window.history.back();
    else setFull(false);
  }, []);

  useEffect(() => {
    fullRef.current = full;
    apiRef.current?.setFull(full);
    if (!full) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onPop = () => {
      exitNative();
      setFull(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeFull();
    const onFs = () => {
      const d = document as FsDocument;
      if (!d.fullscreenElement && !d.webkitFullscreenElement) closeFull();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs);
    };
  }, [full, closeFull]);

  // Mini-planimetria: stanze del modello 3D, ritagliate sull'appartamento
  const plan = useMemo(() => {
    const pts = ROOMS_3D.flatMap((r) => r.pts);
    const pad = 110;
    const minX = Math.min(...pts.map((p) => p[0])) - pad;
    const minY = Math.min(...pts.map((p) => p[1])) - pad;
    const maxX = Math.max(...pts.map((p) => p[0])) + pad;
    const maxY = Math.max(...pts.map((p) => p[1])) + pad;
    return { viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`, aspect: (maxX - minX) / (maxY - minY) };
  }, []);

  return (
    <>
      <div
        ref={boxRef}
        className={
          full
            ? "fixed inset-0 z-[70] bg-ink"
            : "relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-line bg-ink shadow-soft sm:aspect-[4/3]"
        }
        role={full ? "dialog" : undefined}
        aria-modal={full ? true : undefined}
        aria-label="Tour virtuale 3D dell'appartamento"
      >
        <div ref={mountRef} className="absolute inset-0" />

        {/* In alto a sinistra: stanza attuale e menu di tutte le stanze */}
        <div className={`absolute left-3 z-20 ${full ? "top-[max(0.75rem,env(safe-area-inset-top))]" : "top-3"}`}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            className="inline-flex max-w-[60vw] items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-sm font-bold text-ink shadow-soft backdrop-blur-sm"
          >
            <span className="truncate">{station.name}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 transition ${menuOpen ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {menuOpen && (
            <ul className="mt-2 max-h-[min(60vh,20rem)] w-56 overflow-y-auto rounded-2xl border border-line bg-white p-1.5 shadow-soft">
              {PANO_STATIONS.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      if (s.id !== stationId) apiRef.current?.go(s.id, { yaw: s.yaw });
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                      s.id === stationId ? "bg-primary text-white" : "text-ink hover:bg-ice"
                    }`}
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={full ? closeFull : openFull}
          aria-label={full ? "Esci dallo schermo intero" : "Schermo intero"}
          className={`absolute right-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-ink/75 px-3 py-2 text-sm font-semibold text-white shadow-soft backdrop-blur-sm transition hover:bg-ink ${
            full ? "top-[max(0.75rem,env(safe-area-inset-top))]" : "top-3"
          }`}
        >
          {full ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
          <span className={full ? "" : "hidden sm:inline"}>{full ? "Esci" : "Schermo intero"}</span>
        </button>

        {/* Mini-planimetria: punti di ripresa (toccabili), posizione attuale e direzione dello sguardo */}
        <svg
          viewBox={plan.viewBox}
          className={`absolute left-3 h-28 rounded-xl bg-white/85 shadow-soft backdrop-blur-sm sm:h-40 ${
            full ? "bottom-[max(0.75rem,env(safe-area-inset-bottom))]" : "bottom-3"
          }`}
          style={{ aspectRatio: plan.aspect }}
          aria-label="Mini planimetria: tocca un punto per spostarti"
          role="group"
        >
          {ROOMS_3D.map((r, i) => (
            <polygon
              key={i}
              points={r.pts.map((p) => p.join(",")).join(" ")}
              fill={r.kind === "balcony" ? "#e2e8f0" : "#ffffff"}
              stroke="#64748b"
              strokeWidth={9}
              strokeLinejoin="round"
            />
          ))}
          <path ref={coneRef} fill="#0e6ba8" fillOpacity={0.28} />
          {PANO_STATIONS.map((s) => {
            const on = s.id === stationId;
            return (
              <g key={s.id} onClick={() => !on && apiRef.current?.go(s.id, { yaw: s.yaw })} className={on ? "" : "cursor-pointer"}>
                <title>{s.name}</title>
                <circle cx={s.plan[0]} cy={s.plan[1]} r={70} fill="transparent" />
                <circle cx={s.plan[0]} cy={s.plan[1]} r={on ? 38 : 26} fill={on ? "#0e6ba8" : "#94a3b8"} stroke="#fff" strokeWidth={12} />
              </g>
            );
          })}
        </svg>

        {/* Nomi delle stanze sotto le frecce a terra (posizionati a ogni fotogramma) */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {station.links.map((l, i) => (
            <button
              key={`${station.id}-${l.to}`}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              type="button"
              onClick={() => apiRef.current?.go(l.to)}
              className="pano-label absolute top-0 left-0 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-soft backdrop-blur-sm transition-[background-color,opacity] duration-150 [&.is-hover]:bg-primary"
            >
              {BY_ID.get(l.to)?.name}
            </button>
          ))}
        </div>

        {(busy || failed) && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-2.5 rounded-2xl bg-ink/55 px-5 py-4 text-white backdrop-blur-sm" role="status">
              {failed ? (
                <span className="text-sm font-medium">Impossibile caricare la foto, riprova</span>
              ) : (
                <>
                  <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-white/25 border-t-white" aria-hidden />
                  <span className="text-sm font-medium">Caricamento…</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-slate-ink">
        <Move className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          Trascina per guardarti intorno · tocca le frecce a terra o il pavimento per spostarti · menu in alto per
          scegliere la stanza
        </span>
      </p>
    </>
  );
}
