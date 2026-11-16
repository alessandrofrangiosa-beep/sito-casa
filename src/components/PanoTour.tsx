"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Mesh, ShaderMaterial, Texture } from "three";
import { ChevronDown, Footprints, Info, Maximize2, Minimize2 } from "lucide-react";
import { ROOMS_3D } from "@/data/floorPlan3d";
import { PANO_START, PANO_STATIONS, type PanoStation } from "@/data/panoTour";

type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void };
type V2 = [number, number];

const BY_ID = new Map(PANO_STATIONS.map((s) => [s.id, s]));
const D2R = Math.PI / 180;
const PX_M = 70.3; // pixel della planimetria per metro
/** Spostamento libero attorno al punto di ripresa (m): oltre, la foto si deformerebbe */
const FREE_R = 0.8;
const WALL_MARGIN = 0.6;
const SPEED = 1.5; // m/s
/** Spessore dei muri (m): le stanze si allargano di mezzo muro, così due stanze vicine si toccano sulla soglia */
const PAD = 0.18;

const angDiff = (a: number, b: number) => ((((a - b) % 360) + 540) % 360) - 180;
const bearingOf = (dx: number, dz: number) => Math.atan2(dx, dz) / D2R;
const dirOf = (b: number): V2 => [Math.sin(b * D2R), Math.cos(b * D2R)];

/** Distanza dal punto di ripresa al bordo della stanza lungo una direzione (m) */
function boxDist(s: PanoStation, b: number) {
  const [x0, x1, z0, z1] = s.box;
  const [dx, dz] = dirOf(b);
  const tx = dx > 1e-6 ? x1 / dx : dx < -1e-6 ? x0 / dx : Infinity;
  const tz = dz > 1e-6 ? z1 / dz : dz < -1e-6 ? z0 / dz : Infinity;
  return Math.min(tx, tz);
}

/* ------------------------------------------------------------------ */
/* Shader: proiezione della foto equirettangolare dal punto di ripresa  */
/* ------------------------------------------------------------------ */
const VERT = /* glsl */ `
varying vec3 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const FRAG = /* glsl */ `
uniform sampler2D tex;
uniform vec3 center;
uniform float off;
uniform float opacity;
varying vec3 vW;
const float PI = 3.141592653589793;
void main() {
  // coordinate della casa: x = X, z = -Z
  vec3 d = vec3(vW.x - center.x, vW.y - center.y, -vW.z - center.z);
  float yaw = atan(d.x, d.z) - off;
  float pitch = atan(d.y, length(d.xz));
  float u = yaw / (2.0 * PI) + 0.5;
  float v = clamp(pitch / PI + 0.5, 0.0005, 0.9995);
  vec2 uv1 = vec2(fract(u), v);
  vec2 uv2 = vec2(fract(u + 0.5) - 0.5, v);
  vec2 dx1 = dFdx(uv1);
  vec2 dy1 = dFdy(uv1);
  vec2 dx2 = dFdx(uv2);
  vec2 dy2 = dFdy(uv2);
  bool seam = dot(dx2, dx2) + dot(dy2, dy2) < dot(dx1, dx1) + dot(dy1, dy1);
  vec4 c = textureGrad(tex, uv1, seam ? dx2 : dx1, seam ? dy2 : dy1);
  gl_FragColor = vec4(c.rgb, opacity);
}`;

type Move = {
  pts: V2[];
  lens: number[];
  len: number;
  t: number;
  T: number;
  to: string | null; // stanza di arrivo (null = passo nella stessa stanza)
  fade0: number; // tratto (m) in cui avviene la dissolvenza tra le due foto
  fade1: number;
  h0: number;
  h1: number;
  turnTo: number | null;
  /** dopo la soglia, lo sguardo va dolcemente verso il punto più bello della stanza */
  arrive: number | null;
};

/**
 * Tour virtuale 3D costruito sulle foto a 360° reali dell'appartamento.
 * - Ogni foto è proiettata sulla geometria della propria stanza (misurata sulla foto): dal punto di ripresa la vista
 *   è identica alla foto, e ci si può spostare di qualche passo con la prospettiva corretta.
 * - Cerchio sul pavimento che segue il cursore: clic / tocco per camminare fin lì; verso una porta si passa nella
 *   stanza accanto: si cammina fino alla porta e lì le due foto si sovrappongono e si dissolvono l'una nell'altra.
 * - Etichette sulle porte, mini-planimetria, menu delle stanze, tasti W/S e frecce, schermo intero.
 */
export function PanoTour() {
  const boxRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tipRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const coneRef = useRef<SVGPathElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{ jump: (id: string) => void; go: (to: string) => void; setFull: () => void } | null>(null);
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
      const canvas = renderer.domElement;
      canvas.style.display = "block";
      canvas.style.cursor = "grab";
      mount.appendChild(canvas);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1f2937);
      const camera = new THREE.PerspectiveCamera(75, 1, 0.02, 100);
      const maxAniso = renderer.capabilities.getMaxAnisotropy();

      // --- Una "stanza" (scatola) per foto, con la foto proiettata dal suo punto di ripresa ---
      const loader = new THREE.TextureLoader();
      const texCache = new Map<string, Promise<Texture>>();
      const loadTex = (url: string) => {
        let p = texCache.get(url);
        if (!p) {
          p = loader.loadAsync(url).then((t) => {
            t.wrapS = THREE.RepeatWrapping;
            t.anisotropy = maxAniso;
            t.colorSpace = THREE.NoColorSpace;
            return t;
          });
          p.catch(() => texCache.delete(url));
          texCache.set(url, p);
        }
        return p;
      };
      const full = new Set<string>();
      type Room = { s: PanoStation; mesh: Mesh; mat: ShaderMaterial; origin: V2 };
      const rooms = new Map<string, Room>();
      for (const s of PANO_STATIONS) {
        const [x0, x1, z0, z1] = s.box;
        const geo = new THREE.BoxGeometry(x1 - x0 + 2 * PAD, s.ceil, z1 - z0 + 2 * PAD);
        const mat = new THREE.ShaderMaterial({
          uniforms: { tex: { value: null }, center: { value: new THREE.Vector3() }, off: { value: s.off * D2R }, opacity: { value: 1 } },
          vertexShader: VERT,
          fragmentShader: FRAG,
          side: THREE.BackSide,
          transparent: true,
          depthTest: false,
          depthWrite: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.visible = false;
        scene.add(mesh);
        rooms.set(s.id, { s, mesh, mat, origin: [0, 0] });
      }
      // Sfondo a 360° con la foto della stanza di destinazione: nei punti di passaggio che non appartengono a nessuna
      // stanza della planimetria (es. disimpegno) non si vede mai il vuoto
      const skyMat = new THREE.ShaderMaterial({
        uniforms: { tex: { value: null }, center: { value: new THREE.Vector3() }, off: { value: 0 }, opacity: { value: 1 } },
        vertexShader: VERT,
        fragmentShader: FRAG,
        side: THREE.BackSide,
        depthTest: false,
        depthWrite: false,
      });
      const sky = new THREE.Mesh(new THREE.SphereGeometry(40, 48, 32), skyMat);
      sky.renderOrder = -1;
      scene.add(sky);
      const place = (r: Room, origin: V2) => {
        r.origin = origin;
        const [x0, x1, z0, z1] = r.s.box;
        r.mesh.position.set(origin[0] + (x0 + x1) / 2, r.s.ceil / 2, -(origin[1] + (z0 + z1) / 2));
        r.mat.uniforms.center.value.set(origin[0], r.s.h, origin[1]);
      };
      const ensure = async (s: PanoStation) => {
        const r = rooms.get(s.id)!;
        if (!r.mat.uniforms.tex.value) r.mat.uniforms.tex.value = await loadTex(s.preview);
        if (!full.has(s.id))
          loadTex(s.src)
            .then((t) => {
              full.add(s.id);
              r.mat.uniforms.tex.value = t;
            })
            .catch(() => {});
      };
      const preloadNeighbours = (s: PanoStation) => s.links.forEach((l) => void ensure(BY_ID.get(l.to)!).catch(() => {}));

      // Cursore sul pavimento
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthTest: false });
      const fillMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthTest: false });
      const cursor = new THREE.Group();
      cursor.add(new THREE.Mesh(new THREE.RingGeometry(0.19, 0.23, 64), ringMat), new THREE.Mesh(new THREE.CircleGeometry(0.19, 48), fillMat));
      cursor.rotation.x = -Math.PI / 2;
      cursor.renderOrder = 10;
      cursor.visible = false;
      scene.add(cursor);

      // --- Stato ---
      let cur = rooms.get(PANO_START)!;
      let next: Room | null = null;
      const pos: V2 = [cur.s.pos[0], cur.s.pos[1]]; // posizione della camera (metri, riferimento della planimetria)
      let eye = cur.s.h;
      let heading = cur.s.yaw + cur.s.off; // direzione di vista (gradi)
      let pitch = -5;
      let baseFov = 75;
      let userZoomed = false;
      let move: Move | null = null;
      let velH = 0;
      let velP = 0;
      const keys = new Set<string>();
      for (const r of rooms.values()) place(r, r.s.pos);
      cur.mesh.visible = true;

      const local = (): V2 => [pos[0] - cur.origin[0], pos[1] - cur.origin[1]];
      /** Punto della stanza attuale raggiungibile camminando (lontano dai muri, vicino al punto di ripresa) */
      const clampFree = (p: V2): V2 => {
        const [x0, x1, z0, z1] = cur.s.box;
        let x = Math.max(x0 + WALL_MARGIN, Math.min(x1 - WALL_MARGIN, p[0]));
        let z = Math.max(z0 + WALL_MARGIN, Math.min(z1 - WALL_MARGIN, p[1]));
        const d = Math.hypot(x, z);
        if (d > FREE_R) {
          x *= FREE_R / d;
          z *= FREE_R / d;
        }
        return [x, z];
      };
      const pathOf = (pts: V2[]) => {
        const lens = [0];
        for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        return { lens, len: lens[lens.length - 1] };
      };
      const at = (m: Move, s: number): V2 => {
        for (let i = 1; i < m.pts.length; i++) {
          if (s <= m.lens[i] || i === m.pts.length - 1) {
            const l = m.lens[i] - m.lens[i - 1];
            const k = l > 1e-6 ? Math.min(1, Math.max(0, (s - m.lens[i - 1]) / l)) : 1;
            return [m.pts[i - 1][0] + (m.pts[i][0] - m.pts[i - 1][0]) * k, m.pts[i - 1][1] + (m.pts[i][1] - m.pts[i - 1][1]) * k];
          }
        }
        return m.pts[m.pts.length - 1];
      };
      const startMove = (pts: V2[], to: string | null, fade0 = 0, fade1 = 0, h1 = eye) => {
        const { lens, len } = pathOf(pts);
        if (len < 0.03) return;
        const md = bearingOf(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
        move = {
          pts,
          lens,
          len,
          t: 0,
          T: Math.min(3, Math.max(0.7, len / SPEED + (to ? 0.9 : 0.25))),
          to,
          fade0,
          fade1,
          h0: eye,
          h1,
          turnTo: Math.abs(angDiff(md, heading)) > 55 ? md : null,
          arrive: null,
        };
        velH = velP = 0;
      };
      /** Camminata verso un punto della stanza attuale (coordinate locali) */
      const stepTo = (p: V2) => {
        const q = clampFree(p);
        // non si arriva mai "con il naso" contro un muro: almeno 1,2 m davanti nella direzione di marcia
        // sia nella direzione di marcia sia in quella in cui si guarda
        for (const dirB of [bearingOf(q[0] - local()[0], q[1] - local()[1]), heading]) {
          const room: PanoStation = { ...cur.s, box: [cur.s.box[0] - q[0], cur.s.box[1] - q[0], cur.s.box[2] - q[1], cur.s.box[3] - q[1]] };
          const ahead = boxDist(room, dirB);
          if (ahead < 1.2) {
            const back = 1.2 - ahead;
            const [dx, dz] = dirOf(dirB);
            const r = clampFree([q[0] - dx * back, q[1] - dz * back]);
            q[0] = r[0];
            q[1] = r[1];
          }
        }
        startMove([[pos[0], pos[1]], [cur.origin[0] + q[0], cur.origin[1] + q[1]]], null);
      };
      /** Passaggio nella stanza collegata: fino alla porta, dissolvenza sulla soglia, poi al punto di ripresa */
      const go = async (toId: string) => {
        if (move?.to) return;
        const link = cur.s.links.find((l) => l.to === toId);
        const b = BY_ID.get(toId);
        if (!link || !b) return;
        const nr = rooms.get(toId)!;
        if (!nr.mat.uniforms.tex.value) {
          setBusy(true);
          try {
            await ensure(b);
          } catch {
            setFailed(true);
            setBusy(false);
            return;
          }
          setBusy(false);
        } else void ensure(b);
        if (disposed) return;
        let pts: V2[];
        let f0: number;
        let f1: number;
        if (link.direct) {
          // stessa stanza (due punti di ripresa): passaggio diretto
          pts = [[pos[0], pos[1]], b.pos];
          const { len } = pathOf(pts);
          f0 = len * 0.2;
          f1 = len * 0.8;
        } else {
          // percorso dalle porte della planimetria; la foto della stanza accanto compare sulla soglia dell'ultima porta
          const via = link.via ?? [];
          pts = [[pos[0], pos[1]], ...via, b.pos];
          const { lens } = pathOf(pts);
          // dissolvenza dalla prima all'ultima porta (es. soggiorno → disimpegno → cucina)
          f0 = Math.max(0, lens[1] - 0.08);
          f1 = lens[pts.length - 2] + 0.55;
        }
        next = nr;
        nr.mat.uniforms.opacity.value = 0;
        nr.mesh.visible = true;
        nr.mesh.renderOrder = 1;
        cur.mesh.renderOrder = 0;
        startMove(pts, toId, f0, f1, b.h);
        if (move) (move as Move).arrive = b.yaw + b.off;
        setMenuOpen(false);
      };
      const finishTransition = () => {
        if (!next) return;
        cur.mesh.visible = false;
        cur.mat.uniforms.opacity.value = 1;
        cur = next;
        next = null;
        cur.mat.uniforms.opacity.value = 1;
        cur.mesh.renderOrder = 0;
        setStationId(cur.s.id);
        preloadNeighbours(cur.s);
      };
      /** Salto diretto (menu / mini-planimetria): dissolvenza in nero */
      const jump = async (id: string) => {
        const s = BY_ID.get(id);
        if (!s || move?.to) return;
        setMenuOpen(false);
        if (id === cur.s.id) return;
        try {
          await ensure(s);
        } catch {
          setFailed(true);
          return;
        }
        const f = fadeRef.current;
        if (f) f.style.opacity = "1";
        await new Promise((r) => setTimeout(r, 200));
        if (disposed) return;
        move = null;
        cur.mesh.visible = false;
        cur = rooms.get(id)!;
        cur.mat.uniforms.opacity.value = 1;
        cur.mesh.visible = true;
        pos[0] = s.pos[0];
        pos[1] = s.pos[1];
        eye = s.h;
        heading = s.yaw + s.off;
        pitch = -5;
        setStationId(id);
        preloadNeighbours(s);
        if (f) f.style.opacity = "0";
      };

      // --- Puntamento: dove si va con un clic / tocco ---
      const ray = new THREE.Ray();
      const ndc = new THREE.Vector2();
      type Pick = { kind: "step"; p: V2 } | { kind: "go"; to: string; p: V2 } | null;
      const doorTargets = () =>
        cur.s.links.map((l) => {
          const b = BY_ID.get(l.to)!;
          if (l.direct) return { to: l.to, p: [b.pos[0] - cur.origin[0], b.pos[1] - cur.origin[1]] as V2, direct: true };
          // prima porta del percorso, in coordinate locali della stanza attuale
          const d = l.via?.[0] ?? b.pos;
          return { to: l.to, p: [d[0] - cur.origin[0], d[1] - cur.origin[1]] as V2, direct: false };
        });
      const pick = (cx: number, cy: number): Pick => {
        const r = canvas.getBoundingClientRect();
        ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
        ray.origin.setFromMatrixPosition(camera.matrixWorld);
        ray.direction.set(ndc.x, ndc.y, 0.5).unproject(camera).sub(ray.origin).normalize();
        // coordinate locali della stanza attuale (casa: z = -Z)
        const o: [number, number, number] = [ray.origin.x - cur.origin[0], ray.origin.y, -ray.origin.z - cur.origin[1]];
        const d: [number, number, number] = [ray.direction.x, ray.direction.y, -ray.direction.z];
        const [x0, x1, z0, z1] = cur.s.box;
        const far = (lo: number, hi: number, oo: number, dd: number) => (Math.abs(dd) < 1e-9 ? Infinity : ((dd > 0 ? hi : lo) - oo) / dd);
        const t = Math.min(far(x0, x1, o[0], d[0]), far(0, cur.s.ceil, o[1], d[1]), far(z0, z1, o[2], d[2]));
        if (!isFinite(t) || t <= 0) return null;
        const hx = o[0] + d[0] * t;
        const hy = o[1] + d[1] * t;
        const hz = o[2] + d[2] * t;
        if (hy > cur.s.ceil - 0.05) return null; // soffitto
        const onFloor = hy < 0.03;
        const here = local();
        const hitB = bearingOf(hx - here[0], hz - here[1]);
        const hitD = Math.hypot(hx - here[0], hz - here[1]);
        // porta in quella direzione?
        let best: { to: string; p: V2 } | null = null;
        let bestScore = Infinity;
        for (const dt of doorTargets()) {
          const db = bearingOf(dt.p[0] - here[0], dt.p[1] - here[1]);
          const dd = Math.hypot(dt.p[0] - here[0], dt.p[1] - here[1]);
          const near = Math.hypot(hx - dt.p[0], hz - dt.p[1]);
          const half = Math.max(9, (Math.atan2(0.55, Math.max(dd, 0.3)) / D2R) * (dt.direct ? 1.4 : 1));
          const ok = near < (dt.direct ? 1.1 : 0.75) || (Math.abs(angDiff(hitB, db)) < half && hitD > dd - 0.6);
          const sc = near + Math.abs(angDiff(hitB, db)) / 30;
          if (ok && sc < bestScore) {
            bestScore = sc;
            best = { to: dt.to, p: dt.p };
          }
        }
        if (best) return { kind: "go", to: best.to, p: best.p };
        const p: V2 = onFloor ? [hx, hz] : [hx - (d[0] / Math.hypot(d[0], d[2])) * 0.4, hz - (d[2] / Math.hypot(d[0], d[2])) * 0.4];
        return { kind: "step", p };
      };

      // --- Interazione ---
      const pointers = new Map<number, { x: number; y: number }>();
      let down: { x: number; y: number; t: number; moved: boolean } | null = null;
      let pinch: { dist: number; fov: number } | null = null;
      const showTip = (text: string | null, x = 0, y = 0) => {
        const el = tipRef.current;
        if (!el) return;
        if (!text) {
          el.style.opacity = "0";
          return;
        }
        el.textContent = text;
        el.style.opacity = "1";
        el.style.transform = `translate(-50%, -140%) translate(${x}px, ${y}px)`;
      };
      const onDown = (e: PointerEvent) => {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        canvas.setPointerCapture?.(e.pointerId);
        if (pointers.size === 1) {
          down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
          velH = velP = 0;
        } else if (pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), fov: baseFov };
          down = null;
        }
      };
      const onMove = (e: PointerEvent) => {
        const prev = pointers.get(e.pointerId);
        if (!prev) {
          if (e.pointerType !== "mouse" || move) return;
          const pk = pick(e.clientX, e.clientY);
          if (!pk) {
            cursor.visible = false;
            showTip(null);
            canvas.style.cursor = "grab";
            return;
          }
          const p = pk.kind === "step" ? clampFree(pk.p) : pk.p;
          cursor.visible = true;
          cursor.position.set(cur.origin[0] + p[0], 0.01, -(cur.origin[1] + p[1]));
          const c = pk.kind === "go" ? 0x60b5ff : 0xffffff;
          ringMat.color.set(c);
          fillMat.color.set(c);
          canvas.style.cursor = "pointer";
          const r = canvas.getBoundingClientRect();
          showTip(pk.kind === "go" ? BY_ID.get(pk.to)!.name : null, e.clientX - r.left, e.clientY - r.top);
          return;
        }
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch && pointers.size >= 2) {
          const [a, b] = [...pointers.values()];
          baseFov = Math.max(30, Math.min(95, (pinch.fov * pinch.dist) / Math.max(Math.hypot(a.x - b.x, a.y - b.y), 1)));
          userZoomed = true;
          return;
        }
        if (!down) return;
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;
        if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) {
          down.moved = true;
          canvas.style.cursor = "grabbing";
          cursor.visible = false;
          showTip(null);
        }
        const k = camera.fov / canvas.clientHeight;
        heading -= dx * k;
        pitch += dy * k;
        velH = -dx * k;
        velP = dy * k;
        if (move) move.turnTo = null;
      };
      const onUp = (e: PointerEvent) => {
        pointers.delete(e.pointerId);
        if (pointers.size < 2) pinch = null;
        canvas.style.cursor = "grab";
        if (down && pointers.size === 0) {
          const tap = !down.moved && performance.now() - down.t < 600;
          down = null;
          if (tap && !move?.to) {
            velH = velP = 0;
            const pk = pick(e.clientX, e.clientY);
            if (pk?.kind === "go") void go(pk.to);
            else if (pk?.kind === "step") stepTo(pk.p);
          }
        }
      };
      const onCancel = (e: PointerEvent) => {
        pointers.delete(e.pointerId);
        down = null;
        pinch = null;
      };
      const onLeave = () => {
        cursor.visible = false;
        showTip(null);
      };
      const onWheel = (e: WheelEvent) => {
        if (!fullRef.current && !e.ctrlKey) return;
        e.preventDefault();
        baseFov = Math.max(30, Math.min(95, baseFov + e.deltaY * (e.ctrlKey ? 0.2 : 0.04)));
        userZoomed = true;
      };
      const KEYS = ["w", "s", "a", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"];
      const onKeyDown = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase();
        if (!KEYS.includes(k)) return;
        if (!fullRef.current && !boxRef.current?.matches(":hover")) return;
        e.preventDefault();
        keys.add(k);
      };
      const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onCancel);
      canvas.addEventListener("pointerleave", onLeave);
      canvas.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      const applyTouchMode = () => (canvas.style.touchAction = fullRef.current ? "none" : "pan-y");
      applyTouchMode();

      const resize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        camera.aspect = w / h;
        if (!userZoomed) baseFov = w / h < 1 ? 85 : 72;
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(mount);
      let visible = true;
      const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting), { threshold: 0 });
      io.observe(mount);

      // Etichette sulle porte + mini-planimetria
      const v3 = new THREE.Vector3();
      const placeOverlay = () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const targets = doorTargets();
        labelRefs.current.forEach((el, i) => {
          if (!el) return;
          const t = targets[i];
          if (!t || move) {
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
            return;
          }
          // etichetta a metà altezza della porta: sempre nell'inquadratura quando si guarda la porta
          v3.set(cur.origin[0] + t.p[0], 1.15, -(cur.origin[1] + t.p[1])).project(camera);
          const x = (v3.x * 0.5 + 0.5) * w;
          const y = (-v3.y * 0.5 + 0.5) * h;
          const on = v3.z < 1 && x > 20 && x < w - 20 && y > 50 && y < h - 20;
          el.style.opacity = on ? "1" : "0";
          el.style.pointerEvents = on ? "auto" : "none";
          if (on) el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        });
        // posizione in pianta: x = metri verso est, z = metri verso nord (y della planimetria verso il basso)
        const px = pos[0] * PX_M;
        const py = -pos[1] * PX_M;
        dotRef.current?.setAttribute("cx", `${px}`);
        dotRef.current?.setAttribute("cy", `${py}`);
        const hf = (2 * Math.atan(Math.tan((camera.fov * D2R) / 2) * camera.aspect)) / D2R;
        const L = 170;
        const a0 = (heading - 90 - hf / 2) * D2R;
        const a1 = (heading - 90 + hf / 2) * D2R;
        coneRef.current?.setAttribute(
          "d",
          `M${px},${py} L${px + Math.cos(a0) * L},${py + Math.sin(a0) * L} A${L},${L} 0 0 1 ${px + Math.cos(a1) * L},${py + Math.sin(a1) * L} Z`,
        );
      };

      // Stato per i test automatici (sola lettura)
      const w = window as unknown as { __panoDebug?: () => unknown; __panoGo?: (to: string) => void; __panoLook?: (h: number, p: number) => void };
      w.__panoGo = (to) => void go(to);
      w.__panoLook = (h, p) => {
        heading = h;
        pitch = p;
      };
      w.__panoDebug = () => ({
        station: cur.s.id,
        next: next?.s.id ?? null,
        pos: local(),
        moving: !!move,
        heading,
      });

      let raf = 0;
      let last = performance.now();
      const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
      const smooth = (a: number, b: number, x: number) => {
        const t = Math.max(0, Math.min(1, (x - a) / Math.max(b - a, 1e-6)));
        return t * t * (3 - 2 * t);
      };
      const loop = () => {
        raf = requestAnimationFrame(loop);
        const now = performance.now();
        // (__panoSlow: rallentatore usato solo dai test automatici per fotografare le transizioni)
        const dt = Math.min(0.05, (now - last) / 1000) / ((window as unknown as { __panoSlow?: number }).__panoSlow || 1);
        last = now;
        if (!visible && !fullRef.current) return;

        if (move) {
          move.t = Math.min(1, move.t + dt / move.T);
          const s = ease(move.t) * move.len;
          const p = at(move, s);
          pos[0] = p[0];
          pos[1] = p[1];
          if (move.arrive !== null && s > move.fade1) heading += angDiff(move.arrive, heading) * Math.min(1, dt * 2.2);
          else if (move.turnTo !== null) heading += angDiff(move.turnTo, heading) * Math.min(1, dt * 3.5);
          if (next) {
            const f = smooth(move.fade0, move.fade1, s);
            next.mat.uniforms.opacity.value = f;
            eye = move.h0 + (move.h1 - move.h0) * f;
          }
          if (move.t >= 1) {
            if (move.to) finishTransition();
            move = null;
          }
        } else if (keys.size) {
          const f = (keys.has("w") || keys.has("arrowup") ? 1 : 0) - (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
          const turn = (keys.has("arrowright") || keys.has("d") ? 1 : 0) - (keys.has("arrowleft") || keys.has("a") ? 1 : 0);
          heading += turn * 75 * dt;
          if (f) {
            const [dx, dz] = dirOf(heading + (f < 0 ? 180 : 0));
            const lp = local();
            const want: V2 = [lp[0] + dx * 1.2 * dt, lp[1] + dz * 1.2 * dt];
            const q = clampFree(want);
            if (Math.hypot(q[0] - want[0], q[1] - want[1]) < 1e-4) {
              pos[0] = cur.origin[0] + q[0];
              pos[1] = cur.origin[1] + q[1];
            } else if (f > 0) {
              // al limite: se davanti c'è una porta, si passa nella stanza accanto
              const t = doorTargets().find((d) => Math.abs(angDiff(bearingOf(d.p[0] - lp[0], d.p[1] - lp[1]), heading)) < 35);
              if (t) {
                keys.clear();
                void go(t.to);
              }
            }
          }
        }
        if (!down && !pinch && (Math.abs(velH) > 0.001 || Math.abs(velP) > 0.001)) {
          heading += velH;
          pitch += velP;
          velH *= 0.9;
          velP *= 0.9;
        }
        pitch = Math.max(-85, Math.min(85, pitch));
        camera.fov = baseFov;
        camera.updateProjectionMatrix();
        camera.position.set(pos[0], eye, -pos[1]);
        const [hx, hz] = dirOf(heading);
        const cp = Math.cos(pitch * D2R);
        camera.lookAt(pos[0] + hx * cp, eye + Math.sin(pitch * D2R), -(pos[1] + hz * cp));
        const skyRoom = next ?? cur;
        skyMat.uniforms.tex.value = skyRoom.mat.uniforms.tex.value;
        skyMat.uniforms.off.value = skyRoom.s.off * D2R;
        // proiezione dal punto della camera: la foto resta "all'infinito", senza deformazioni
        skyMat.uniforms.center.value.set(pos[0], eye, pos[1]);
        sky.position.set(pos[0], eye, -pos[1]);
        if (cur.mat.uniforms.tex.value) renderer.render(scene, camera);
        // Avviso "artefatto" quando la zona deformata della foto è al centro della vista
        const art = artRef.current;
        if (art) {
          const vyaw = heading - cur.s.off;
          const hf = (2 * Math.atan(Math.tan((camera.fov * D2R) / 2) * camera.aspect)) / D2R;
          const on =
            !move &&
            (cur.s.artifacts ?? []).some(
              (a) => Math.abs(angDiff(vyaw, a.yaw)) < a.w + hf * 0.3 && Math.abs(pitch - a.pitch) < camera.fov * 0.45,
            );
          if (art.dataset.on !== String(on)) {
            art.dataset.on = String(on);
            art.style.opacity = on ? "1" : "0";
            art.style.transform = `translate(-50%, ${on ? "0" : "-6px"})`;
          }
        }
        placeOverlay();
      };

      apiRef.current = {
        jump: (id) => void jump(id),
        go: (to) => void go(to),
        setFull: () => {
          applyTouchMode();
          requestAnimationFrame(resize);
        },
      };

      try {
        await ensure(cur.s);
        setBusy(false);
      } catch {
        setFailed(true);
        setBusy(false);
      }
      preloadNeighbours(cur.s);
      loop();
      // Anteprime di tutte le stanze in sottofondo
      PANO_STATIONS.forEach((s) => void loadTex(s.preview).catch(() => {}));

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
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        texCache.forEach((p) => p.then((t) => t.dispose()).catch(() => {}));
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
    apiRef.current?.setFull();
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

  const plan = useMemo(() => {
    const pts = ROOMS_3D.flatMap((r) => r.pts);
    const pad = 110;
    const minX = Math.min(...pts.map((p) => p[0])) - pad;
    const minY = Math.min(...pts.map((p) => p[1])) - pad;
    const maxX = Math.max(...pts.map((p) => p[0])) + pad;
    const maxY = Math.max(...pts.map((p) => p[1])) + pad;
    return { minX, minY, w: maxX - minX, h: maxY - minY };
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

        {/* Nomi delle stanze sulle porte (toccali per passare di là) */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {station.links.map((l, i) => (
            <button
              key={`${station.id}-${l.to}`}
              ref={(el) => {
                labelRefs.current[i] = el;
              }}
              type="button"
              onClick={() => apiRef.current?.go(l.to)}
              className="absolute top-0 left-0 rounded-full bg-ink/65 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-soft backdrop-blur-sm transition-opacity duration-200 hover:bg-primary"
            >
              {BY_ID.get(l.to)?.name}
            </button>
          ))}
          <div
            ref={tipRef}
            className="absolute top-0 left-0 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-soft"
          />
        </div>

        <svg
          viewBox={`${plan.minX} ${plan.minY} ${plan.w} ${plan.h}`}
          className={`absolute left-3 z-10 h-28 rounded-xl bg-white/85 shadow-soft backdrop-blur-sm sm:h-40 ${
            full ? "bottom-[max(0.75rem,env(safe-area-inset-bottom))]" : "bottom-3"
          }`}
          style={{ aspectRatio: plan.w / plan.h }}
          aria-label="Mini planimetria: tocca un punto per andarci"
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
          {PANO_STATIONS.map((s) => (
            <g key={s.id} onClick={() => apiRef.current?.jump(s.id)} className="cursor-pointer">
              <title>{s.name}</title>
              <circle cx={s.pos[0] * PX_M} cy={-s.pos[1] * PX_M} r={70} fill="transparent" />
              <circle cx={s.pos[0] * PX_M} cy={-s.pos[1] * PX_M} r={22} fill="#94a3b8" stroke="#fff" strokeWidth={10} />
            </g>
          ))}
          <path ref={coneRef} fill="#0e6ba8" fillOpacity={0.3} pointerEvents="none" />
          <circle ref={dotRef} r={36} fill="#0e6ba8" stroke="#fff" strokeWidth={12} pointerEvents="none" />
        </svg>

        {/* Avviso puntuale: compare solo guardando le zone della foto in cui la ricostruzione non è fedele */}
        <div
          ref={artRef}
          data-on="false"
          role="status"
          aria-live="polite"
          className={`pointer-events-none absolute left-1/2 z-20 flex w-max max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-xl bg-amber-400 px-3 py-2 text-[13px] leading-snug font-semibold text-ink opacity-0 shadow-soft transition-[opacity,transform] duration-300 sm:text-sm ${
            full ? "top-[calc(max(0.75rem,env(safe-area-inset-top))+3.25rem)]" : "top-16"
          }`}
          style={{ transform: "translate(-50%, -6px)" }}
        >
          <span aria-hidden>⚠️</span>
          <span>Non rappresenta la realtà: questa porta è un artefatto della ricostruzione 3D</span>
        </div>

        {/* Avviso sugli artefatti: ben leggibile ma piccolo, in basso a destra, e non intercetta i gesti */}
        <div
          className={`pointer-events-none absolute right-3 z-10 flex max-w-[10.5rem] items-start gap-1.5 rounded-xl bg-ink/70 px-2.5 py-1.5 text-[11px] leading-snug text-white shadow-soft backdrop-blur-sm sm:max-w-[16rem] sm:text-xs ${
            full ? "bottom-[max(0.75rem,env(safe-area-inset-bottom))]" : "bottom-3"
          }`}
          role="note"
        >
          <Info className="mt-px h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden />
          {/* Telefono: versione breve; schermi grandi: testo completo */}
          <span className="sm:hidden">
            <strong className="font-semibold">3D indicativo:</strong> possibili artefatti, non sempre fedele alla realtà
          </span>
          <span className="hidden sm:inline">
            <strong className="font-semibold">Ricostruzione 3D indicativa:</strong> alcune immagini possono contenere
            artefatti e non rappresentare fedelmente la realtà.
          </span>
        </div>

        <div ref={fadeRef} className="pointer-events-none absolute inset-0 z-[15] bg-ink opacity-0 transition-opacity duration-200" />

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
                    onClick={() => apiRef.current?.jump(s.id)}
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

        {(busy || failed) && (
          <div className="pointer-events-none absolute inset-0 z-[16] grid place-items-center">
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
        <Footprints className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>Tocca il pavimento per camminare · tocca una porta per passare nella stanza accanto · trascina per guardarti intorno</span>
      </p>
    </>
  );
}
