"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Mesh, Texture } from "three";
import { ChevronDown, Maximize2, Minimize2, Footprints } from "lucide-react";
import { OPENINGS_3D, PX_PER_METER, ROOMS_3D } from "@/data/floorPlan3d";
import { PANO_START, PANO_STATIONS, WALK_ROOMS, type PanoStation } from "@/data/panoTour";

type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void };
type V2 = [number, number];

const BY_ID = new Map(PANO_STATIONS.map((s) => [s.id, s]));
const D2R = Math.PI / 180;
const DOOR_TOP = 2.1;
const GLASS_TOP = 2.3;
const RAIL_H = 1.05;
const WALK_SPEED = 2; // m/s
const FADE_MS = 520;
const MARGIN = 0.32; // distanza minima dalle pareti
const FREE_R = 0.9; // movimento libero attorno a ogni punto di ripresa (m)

/* ------------------------------------------------------------------ */
/* Modello dell'appartamento (metri) ricavato dalla planimetria         */
/* ------------------------------------------------------------------ */

const pointIn = (poly: V2[], [x, y]: V2) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const segDist = (p: V2, a: V2, b: V2) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
};
const edgeDist = (poly: V2[], p: V2) => Math.min(...poly.map((a, i) => segDist(p, a, poly[(i + 1) % poly.length])));

type Cut = { t0: number; t1: number; top: number };
type Room = { idx: number; poly: V2[]; ceil: number; panos: string[]; railing: Set<number>; cuts: Cut[][]; xf: (p: V2) => V2 };
type Opening = { center: V2; a: V2; b: V2; rooms: number[] };

function buildModel() {
  const rooms: Room[] = ROOMS_3D.map((r, idx) => {
    const cfg = WALK_ROOMS[idx];
    const pts = r.pts.map(([x, y]) => [x / PX_PER_METER, y / PX_PER_METER] as V2);
    const c: V2 = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
    const [sx, sy] = cfg?.scale ?? [1, 1];
    const xf = (p: V2): V2 => [c[0] + (p[0] - c[0]) * sx, c[1] + (p[1] - c[1]) * sy];
    return {
      idx,
      poly: pts.map(xf),
      ceil: cfg?.ceil ?? 3,
      panos: cfg?.panos ?? [PANO_START],
      railing: new Set(cfg?.railing ?? []),
      cuts: pts.map(() => []),
      xf,
    };
  });

  // Porte e portefinestre aperte: tagliano le pareti (di tutte e due le stanze) e collegano le stanze
  const openings: Opening[] = [];
  for (const o of OPENINGS_3D) {
    if (o.type === "window") continue;
    const top = o.type === "door" ? DOOR_TOP : GLASS_TOP;
    const tol = (o.tol ?? 32) / PX_PER_METER + 0.12;
    const linked: number[] = [];
    const centers: V2[] = [];
    for (const room of rooms) {
      const a = room.xf([o.a[0] / PX_PER_METER, o.a[1] / PX_PER_METER]);
      const b = room.xf([o.b[0] / PX_PER_METER, o.b[1] / PX_PER_METER]);
      const ol = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const ou = [(b[0] - a[0]) / ol, (b[1] - a[1]) / ol];
      room.poly.forEach((p, i) => {
        const q = room.poly[(i + 1) % room.poly.length];
        const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
        const u = [(q[0] - p[0]) / len, (q[1] - p[1]) / len];
        if (Math.abs(u[0] * ou[1] - u[1] * ou[0]) > 0.05) return;
        const rel = [a[0] - p[0], a[1] - p[1]];
        if (Math.abs(u[0] * rel[1] - u[1] * rel[0]) > tol) return;
        const ta = rel[0] * u[0] + rel[1] * u[1];
        const tb = (b[0] - p[0]) * u[0] + (b[1] - p[1]) * u[1];
        const t0 = Math.max(0, Math.min(ta, tb));
        const t1 = Math.min(len, Math.max(ta, tb));
        if (t1 - t0 < 0.3) return;
        room.cuts[i].push({ t0, t1, top: room.railing.has(i) ? 0 : top });
        if (!linked.includes(room.idx)) linked.push(room.idx);
        centers.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
      });
    }
    if (linked.length >= 2) {
      const center: V2 = [centers.reduce((s, p) => s + p[0], 0) / centers.length, centers.reduce((s, p) => s + p[1], 0) / centers.length];
      const a: V2 = [o.a[0] / PX_PER_METER, o.a[1] / PX_PER_METER];
      const b: V2 = [o.b[0] / PX_PER_METER, o.b[1] / PX_PER_METER];
      openings.push({ center, a, b, rooms: linked });
    }
  }
  return { rooms, openings };
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
uniform sampler2D texA;
uniform sampler2D texB;
uniform vec3 cA;
uniform vec3 cB;
uniform float aA;
uniform float aB;
uniform float mixB;
varying vec3 vW;
const float PI = 3.141592653589793;
vec4 pano(sampler2D t, vec3 c, float a, vec3 p) {
  vec3 d = p - c;
  float yaw = atan(d.z, d.x) - a;
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
  return textureGrad(t, uv1, seam ? dx2 : dx1, seam ? dy2 : dy1);
}
void main() {
  vec4 col = pano(texA, cA, aA, vW);
  if (mixB > 0.001) col = mix(col, pano(texB, cB, aB, vW), mixB);
  gl_FragColor = vec4(col.rgb, 1.0);
}`;

/**
 * Tour virtuale "a camminata" costruito sulle foto a 360° reali: si cammina liberamente nell'appartamento.
 * - Clic / tocco sul pavimento (o su una parete) per camminare fin lì; tra stanze diverse il percorso passa dalle porte.
 * - Cerchio sul pavimento che segue il mouse, come un cursore; tasti W A S D o frecce per muoversi.
 * - Cerchietti a terra = punti di ripresa: lì la vista è identica alla foto.
 * - Mini-planimetria (cliccabile) con posizione e direzione; menu delle stanze; schermo intero.
 */
export function PanoTour() {
  const boxRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const dotRef = useRef<SVGCircleElement>(null);
  const coneRef = useRef<SVGPathElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{ goStation: (id: string) => void; walkToPlan: (p: V2) => void; setFull: () => void } | null>(null);
  const fullRef = useRef(false);

  const [roomName, setRoomName] = useState(BY_ID.get(PANO_START)!.name);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      const mount = mountRef.current;
      if (disposed || !mount) return;
      const { rooms, openings } = buildModel();

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      const canvas = renderer.domElement;
      canvas.style.display = "block";
      canvas.style.cursor = "grab";
      mount.appendChild(canvas);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.03, 1000);
      const maxAniso = renderer.capabilities.getMaxAnisotropy();

      const uniforms = {
        texA: { value: null as Texture | null },
        texB: { value: null as Texture | null },
        cA: { value: new THREE.Vector3() },
        cB: { value: new THREE.Vector3() },
        aA: { value: 0 },
        aB: { value: 0 },
        mixB: { value: 0 },
      };
      const mkMat = (side: number) => new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, side: side as never });
      const matFront = mkMat(THREE.FrontSide);
      const matDouble = mkMat(THREE.DoubleSide);
      const matBack = mkMat(THREE.BackSide);

      // --- Geometria: pareti (rivolte verso l'interno), pavimenti, soffitti, stipiti delle porte ---
      const wallPos: number[] = [];
      const floorPos: number[] = [];
      const ceilPos: number[] = [];
      const jambPos: number[] = [];
      const quad = (out: number[], a: number[], b: number[], c: number[], d: number[], inward?: number[]) => {
        let tri = [a, b, c, a, c, d];
        if (inward) {
          const n = [
            (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]),
            (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]),
            (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]),
          ];
          if (n[0] * inward[0] + n[1] * inward[1] + n[2] * inward[2] < 0) tri = [a, c, b, a, d, c];
        }
        tri.forEach((v) => out.push(v[0], v[1], v[2]));
      };
      for (const room of rooms) {
        const P = room.poly;
        P.forEach((p, i) => {
          const q = P[(i + 1) % P.length];
          const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
          const u = [(q[0] - p[0]) / len, (q[1] - p[1]) / len];
          let n = [-u[1], u[0]];
          const mid: V2 = [(p[0] + q[0]) / 2 + n[0] * 0.02, (p[1] + q[1]) / 2 + n[1] * 0.02];
          if (!pointIn(P, mid)) n = [-n[0], -n[1]];
          const inward = [n[0], 0, n[1]];
          const at = (t: number) => [p[0] + u[0] * t, p[1] + u[1] * t];
          const box = (t0: number, t1: number, y0: number, y1: number) => {
            if (t1 - t0 < 0.005 || y1 - y0 < 0.005) return;
            const A = at(t0);
            const B = at(t1);
            quad(wallPos, [A[0], y0, A[1]], [B[0], y0, B[1]], [B[0], y1, B[1]], [A[0], y1, A[1]], inward);
          };
          const top = room.railing.has(i) ? RAIL_H : room.ceil;
          const cuts = [...room.cuts[i]].sort((x, y) => x.t0 - y.t0);
          let pos = 0;
          for (const c of cuts) {
            if (c.t0 > pos) box(pos, c.t0, 0, top);
            if (c.top > 0) box(Math.max(pos, c.t0), c.t1, c.top, top);
            // Stipiti e architrave (spessore del muro) verso l'esterno della stanza
            const out = [-n[0] * 0.17, -n[1] * 0.17];
            const ch = c.top > 0 ? c.top : RAIL_H;
            for (const t of [c.t0, c.t1]) {
              const A = at(t);
              quad(jambPos, [A[0], 0, A[1]], [A[0] + out[0], 0, A[1] + out[1]], [A[0] + out[0], ch, A[1] + out[1]], [A[0], ch, A[1]]);
            }
            if (c.top > 0) {
              const A = at(c.t0);
              const B = at(c.t1);
              quad(jambPos, [A[0], c.top, A[1]], [B[0], c.top, B[1]], [B[0] + out[0], c.top, B[1] + out[1]], [A[0] + out[0], c.top, A[1] + out[1]]);
            }
            pos = Math.max(pos, c.t1);
          }
          if (pos < len) box(pos, len, 0, top);
        });
        const shape = P.map(([x, z]) => new THREE.Vector2(x, z));
        const tris = THREE.ShapeUtils.triangulateShape(shape, []);
        for (const t of tris) {
          const [a, b, c] = t.map((k) => P[k]);
          quad(floorPos, [a[0], 0, a[1]], [b[0], 0, b[1]], [c[0], 0, c[1]], [c[0], 0, c[1]], [0, 1, 0]);
          quad(ceilPos, [a[0], room.ceil, a[1]], [b[0], room.ceil, b[1]], [c[0], room.ceil, c[1]], [c[0], room.ceil, c[1]], [0, -1, 0]);
        }
      }
      // Pavimento continuo sotto le soglie delle porte
      const all = rooms.flatMap((r) => r.poly);
      const bx0 = Math.min(...all.map((p) => p[0])) - 0.3;
      const bx1 = Math.max(...all.map((p) => p[0])) + 0.3;
      const bz0 = Math.min(...all.map((p) => p[1])) - 0.3;
      const bz1 = Math.max(...all.map((p) => p[1])) + 0.3;
      quad(floorPos, [bx0, -0.004, bz0], [bx1, -0.004, bz0], [bx1, -0.004, bz1], [bx0, -0.004, bz1], [0, 1, 0]);

      const mkMesh = (pos: number[], mat: InstanceType<typeof THREE.ShaderMaterial>) => {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        g.computeBoundingSphere();
        const m = new THREE.Mesh(g, mat);
        scene.add(m);
        return m;
      };
      const wallMesh = mkMesh(wallPos, matFront);
      const floorMesh = mkMesh(floorPos, matFront);
      mkMesh(ceilPos, matFront);
      mkMesh(jambPos, matDouble);
      // Cielo / esterno a distanza "infinita" (finestre e ringhiere)
      const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 32), matBack);
      sky.position.set((bx0 + bx1) / 2, 0, (bz0 + bz1) / 2);
      scene.add(sky);

      // --- Punti di ripresa: cerchietti a terra ---
      const markers = new THREE.Group();
      scene.add(markers);
      const ringGeo = new THREE.RingGeometry(0.15, 0.2, 48);
      const markerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
      for (const s of PANO_STATIONS) {
        const m = new THREE.Mesh(ringGeo, markerMat);
        m.rotation.x = -Math.PI / 2;
        m.position.set(s.pos[0], 0.012, s.pos[1]);
        m.userData.station = s.id;
        const hit = new THREE.Mesh(new THREE.CircleGeometry(0.32, 24), new THREE.MeshBasicMaterial({ visible: false }));
        hit.userData.station = s.id;
        m.add(hit);
        markers.add(m);
      }
      // Cursore sul pavimento
      const cursorMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthTest: false });
      const cursorFill = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, depthTest: false });
      const cursor = new THREE.Group();
      cursor.add(new THREE.Mesh(new THREE.RingGeometry(0.2, 0.245, 64), cursorMat), new THREE.Mesh(new THREE.CircleGeometry(0.2, 48), cursorFill));
      cursor.rotation.x = -Math.PI / 2;
      cursor.renderOrder = 10;
      cursor.visible = false;
      scene.add(cursor);

      // --- Foto: anteprima leggera subito, alta risoluzione appena arriva ---
      const loader = new THREE.TextureLoader();
      const texCache = new Map<string, Promise<Texture>>();
      const loadTex = (url: string) => {
        let p = texCache.get(url);
        if (!p) {
          p = loader.loadAsync(url).then((t) => {
            t.wrapS = THREE.RepeatWrapping;
            t.anisotropy = maxAniso;
            t.minFilter = THREE.LinearMipmapLinearFilter;
            t.generateMipmaps = true;
            return t;
          });
          p.catch(() => texCache.delete(url));
          texCache.set(url, p);
        }
        return p;
      };
      const best = new Map<string, Texture>();
      let shownA = PANO_START;
      let shownB: string | null = null;
      const ensure = async (s: PanoStation) => {
        if (!best.has(s.id)) best.set(s.id, await loadTex(s.preview));
        loadTex(s.src)
          .then((t) => {
            best.set(s.id, t);
            if (shownA === s.id) uniforms.texA.value = t;
            if (shownB === s.id) uniforms.texB.value = t;
          })
          .catch(() => {});
        return best.get(s.id)!;
      };

      // --- Stato della visita ---
      const start = BY_ID.get(PANO_START)!;
      const pos: V2 = [start.pos[0], start.pos[1]];
      let eye = start.h;
      let lon = start.yaw + start.alpha; // direzione in pianta (gradi)
      let lat = -6;
      let baseFov = 75;
      let userZoomed = false;
      let curRoom = rooms.findIndex((r) => pointIn(r.poly, pos));
      let fade = 0;
      let path: { pts: V2[]; len: number; t: number; T: number; turn: boolean } | null = null;
      const keys = new Set<string>();
      let lastDest: unknown = null;
      let velLon = 0;
      let velLat = 0;

      const roomAt = (p: V2, prefer = curRoom) => {
        if (prefer >= 0 && pointIn(rooms[prefer].poly, p)) return prefer;
        return rooms.findIndex((r) => pointIn(r.poly, p));
      };
      const panoFor = (room: number, p: V2) => {
        const ids = room >= 0 ? rooms[room].panos : [shownA];
        let bestId = ids[0];
        let bestD = Infinity;
        for (const id of ids) {
          const s = BY_ID.get(id)!;
          const d = Math.hypot(s.pos[0] - p[0], s.pos[1] - p[1]);
          if (d < bestD) {
            bestD = d;
            bestId = id;
          }
        }
        return bestId;
      };
      const setUniform = (slot: "A" | "B", id: string) => {
        const s = BY_ID.get(id)!;
        const t = best.get(id) ?? null;
        if (slot === "A") {
          uniforms.texA.value = t;
          uniforms.cA.value.set(s.pos[0], s.h, s.pos[1]);
          uniforms.aA.value = s.alpha * D2R;
        } else {
          uniforms.texB.value = t;
          uniforms.cB.value.set(s.pos[0], s.h, s.pos[1]);
          uniforms.aB.value = s.alpha * D2R;
        }
      };
      let switching: string | null = null;
      const switchTo = async (id: string) => {
        if (id === switching) return;
        switching = id;
        const s = BY_ID.get(id)!;
        if (!best.has(id)) {
          setBusy(true);
          try {
            await ensure(s);
          } catch {
            setFailed(true);
          }
          setBusy(false);
        } else void ensure(s);
        switching = null;
        if (disposed) return;
        if (shownB) {
          // dissolvenza già in corso: si riparte dalla foto di arrivo
          shownA = shownB;
          setUniform("A", shownA);
        }
        if (id === shownA) {
          shownB = null;
          uniforms.mixB.value = 0;
        } else {
          shownB = id;
          setUniform("B", id);
          fade = 0;
        }
        setRoomName(s.name);
      };

      // Percorso tra stanze: dalle porte (ricerca in ampiezza sul grafo stanza-porta-stanza)
      const route = (from: number, to: number): V2[] => {
        if (from === to || from < 0 || to < 0) return [];
        const prev = new Map<number, { room: number; door: Opening }>();
        const q = [from];
        const seen = new Set([from]);
        while (q.length) {
          const r = q.shift()!;
          if (r === to) break;
          for (const o of openings) {
            if (!o.rooms.includes(r)) continue;
            for (const n of o.rooms) {
              if (seen.has(n)) continue;
              seen.add(n);
              prev.set(n, { room: r, door: o });
              q.push(n);
            }
          }
        }
        if (!prev.has(to)) return [];
        const pts: V2[] = [];
        let r = to;
        while (r !== from) {
          const step = prev.get(r)!;
          pts.unshift(step.door.center);
          r = step.room;
        }
        return pts;
      };
      /** Punto più interno di ogni stanza (anche per stanze a L come il corridoio) e sua distanza dalle pareti */
      const cores = rooms.map((r) => {
        const xs = r.poly.map((v) => v[0]);
        const zs = r.poly.map((v) => v[1]);
        let bestP: V2 = r.poly[0];
        let bestD = -1;
        for (let x = Math.min(...xs); x <= Math.max(...xs); x += 0.08)
          for (let z = Math.min(...zs); z <= Math.max(...zs); z += 0.08) {
            const q: V2 = [x, z];
            if (!pointIn(r.poly, q)) continue;
            const d = edgeDist(r.poly, q);
            if (d > bestD) {
              bestD = d;
              bestP = q;
            }
          }
        return { p: bestP, d: bestD };
      });
      /** Punto raggiungibile più vicino dentro la stanza, a distanza dalle pareti (spinto via dal muro più vicino) */
      const clampInRoom = (room: number, p: V2): V2 => {
        const P = rooms[room].poly;
        const core = cores[room];
        const need = Math.min(MARGIN, core.d * 0.85);
        let q: V2 = [p[0], p[1]];
        for (let i = 0; i < 12; i++) {
          const inside = pointIn(P, q);
          if (inside && edgeDist(P, q) >= need - 1e-3) return q;
          // lato più vicino e sua normale verso l'interno
          let bi = 0;
          let bd = Infinity;
          P.forEach((a, k) => {
            const d = segDist(q, a, P[(k + 1) % P.length]);
            if (d < bd) {
              bd = d;
              bi = k;
            }
          });
          const a = P[bi];
          const b = P[(bi + 1) % P.length];
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
          let n: V2 = [-(b[1] - a[1]) / len, (b[0] - a[0]) / len];
          const mid: V2 = [(a[0] + b[0]) / 2 + n[0] * 0.01, (a[1] + b[1]) / 2 + n[1] * 0.01];
          if (!pointIn(P, mid)) n = [-n[0], -n[1]];
          const push = (inside ? need - bd : need + bd) + 0.01;
          q = [q[0] + n[0] * push, q[1] + n[1] * push];
        }
        return pointIn(P, q) ? q : core.p;
      };
      /**
       * Dove si arriva con un clic: dentro la stanza ci si muove liberamente fino a FREE_R dal punto di ripresa
       * (prospettiva sempre pulita); più lontano o in un'altra stanza si arriva al punto di ripresa più vicino.
       */
      const destFor = (target: V2, room: number): { dest: V2; room: number; station: string } => {
        const sid = panoFor(room, target);
        const st = BY_ID.get(sid)!;
        const sRoom = roomAt(st.pos, -1);
        const dx = target[0] - st.pos[0];
        const dz = target[1] - st.pos[1];
        const d = Math.hypot(dx, dz);
        if (sRoom !== room || d > FREE_R * 1.6) return { dest: [st.pos[0], st.pos[1]], room: sRoom, station: sid };
        const k = d > FREE_R ? FREE_R / d : 1;
        return { dest: clampInRoom(sRoom, [st.pos[0] + dx * k, st.pos[1] + dz * k]), room: sRoom, station: sid };
      };
      const walkTo = (target: V2, room?: number, exact = false) => {
        const tr0 = room ?? roomAt(target, -1);
        if (tr0 < 0) return;
        let { dest, room: tr } = exact ? { dest: target, room: tr0 } : destFor(target, tr0);
        if (!exact && Math.hypot(dest[0] - pos[0], dest[1] - pos[1]) < 0.3) {
          // il punto scelto è quello in cui si è già: si va al punto di ripresa più vicino al tocco, escluso il proprio
          const here = BY_ID.get(panoFor(curRoom, pos))!.id;
          let alt: PanoStation | null = null;
          let ad = Infinity;
          // prima i punti di ripresa che "dipingono" la stanza toccata, poi tutti gli altri
          const own = rooms[tr0].panos.filter((id) => id !== here).map((id) => BY_ID.get(id)!);
          for (const st of own.length ? own : PANO_STATIONS) {
            if (st.id === here) continue;
            const d = Math.hypot(st.pos[0] - target[0], st.pos[1] - target[1]);
            if (d < ad) {
              ad = d;
              alt = st;
            }
          }
          if (alt && ad < 4) {
            dest = [alt.pos[0], alt.pos[1]];
            tr = roomAt(dest, -1);
          }
        }
        lastDest = { target, room: tr, dest };
        const pts: V2[] = [[pos[0], pos[1]], ...route(curRoom, tr), dest];
        let len = 0;
        for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        if (len < 0.05) return;
        // Si gira verso la direzione di marcia se il percorso passa da altre stanze o se il punto è di lato
        const first = pts[1];
        const dirDiff = Math.abs(((((Math.atan2(first[1] - pos[1], first[0] - pos[0]) / D2R - lon) % 360) + 540) % 360) - 180);
        path = { pts, len, t: 0, T: Math.min(4, Math.max(0.5, len / WALK_SPEED + 0.2)), turn: pts.length > 2 || dirDiff > 35 };
        velLon = velLat = 0;
      };
      const pointOnPath = (s: number): V2 => {
        const pts = path!.pts;
        for (let i = 1; i < pts.length; i++) {
          const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
          if (s <= l || i === pts.length - 1) {
            const k = l ? Math.min(1, s / l) : 1;
            return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
          }
          s -= l;
        }
        return pts[pts.length - 1];
      };
      /** Salto a un punto di ripresa (menu): breve dissolvenza in nero */
      const goStation = async (id: string) => {
        const s = BY_ID.get(id);
        if (!s) return;
        setMenuOpen(false);
        await ensure(s).catch(() => setFailed(true));
        const f = fadeRef.current;
        if (f) f.style.opacity = "1";
        await new Promise((r) => setTimeout(r, 180));
        path = null;
        pos[0] = s.pos[0];
        pos[1] = s.pos[1];
        eye = s.h;
        lon = s.yaw + s.alpha;
        lat = -6;
        curRoom = roomAt(pos, -1);
        shownA = s.id;
        shownB = null;
        fade = 0;
        uniforms.mixB.value = 0;
        setUniform("A", s.id);
        setRoomName(s.name);
        if (f) f.style.opacity = "0";
      };

      // --- Interazione ---
      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const pointers = new Map<number, { x: number; y: number }>();
      let down: { x: number; y: number; t: number; moved: boolean } | null = null;
      let pinch: { dist: number; fov: number } | null = null;

      const pick = (cx: number, cy: number): { station?: string; target?: V2; room?: number } => {
        const r = canvas.getBoundingClientRect();
        ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObjects([markers, floorMesh, wallMesh], true);
        const h = hits[0];
        if (!h) return {};
        if (h.object.userData.station) return { station: h.object.userData.station as string };
        let p: V2 = [h.point.x, h.point.z];
        if (h.object === wallMesh) {
          // parete: si cammina fino al piede del muro, un passo prima
          const dx = pos[0] - p[0];
          const dz = pos[1] - p[1];
          const d = Math.hypot(dx, dz) || 1;
          p = [p[0] + (dx / d) * 0.45, p[1] + (dz / d) * 0.45];
        }
        const room = roomAt(p, -1);
        return room >= 0 ? { target: p, room } : {};
      };

      const onDown = (e: PointerEvent) => {
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        canvas.setPointerCapture?.(e.pointerId);
        if (pointers.size === 1) {
          down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
          velLon = velLat = 0;
        } else if (pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), fov: baseFov };
          down = null;
        }
      };
      const onMove = (e: PointerEvent) => {
        const prev = pointers.get(e.pointerId);
        if (!prev) {
          if (e.pointerType === "mouse") {
            const res = pick(e.clientX, e.clientY);
            const p = res.target ? clampInRoom(res.room!, res.target) : res.station ? BY_ID.get(res.station)!.pos : null;
            cursor.visible = !!p;
            if (p) cursor.position.set(p[0], 0.015, p[1]);
            // azzurro = si va in un altro punto di ripresa (altra stanza); bianco = passo nella stanza
            const far = res.station || (res.target && destFor(res.target, res.room!).room !== curRoom);
            const c = far ? 0x60b5ff : 0xffffff;
            cursorMat.color.set(c);
            cursorFill.color.set(c);
            canvas.style.cursor = p ? "pointer" : "grab";
          }
          return;
        }
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pinch && pointers.size >= 2) {
          const [a, b] = [...pointers.values()];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          baseFov = Math.max(30, Math.min(95, (pinch.fov * pinch.dist) / Math.max(d, 1)));
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
        }
        const degPerPx = camera.fov / canvas.clientHeight;
        lon -= dx * degPerPx;
        lat += dy * degPerPx;
        velLon = -dx * degPerPx;
        velLat = dy * degPerPx;
      };
      const onUp = (e: PointerEvent) => {
        pointers.delete(e.pointerId);
        if (pointers.size < 2) pinch = null;
        canvas.style.cursor = "grab";
        if (down && pointers.size === 0) {
          const tap = !down.moved && performance.now() - down.t < 600;
          down = null;
          if (tap) {
            velLon = velLat = 0;
            const res = pick(e.clientX, e.clientY);
            if (res.station) {
              const s = BY_ID.get(res.station)!;
              walkTo(s.pos, roomAt(s.pos, -1), true);
            } else if (res.target) walkTo(res.target, res.room);
          }
        }
      };
      const onCancel = (e: PointerEvent) => {
        pointers.delete(e.pointerId);
        down = null;
        pinch = null;
      };
      const onLeave = () => (cursor.visible = false);
      const onWheel = (e: WheelEvent) => {
        if (!fullRef.current && !e.ctrlKey) return;
        e.preventDefault();
        baseFov = Math.max(30, Math.min(95, baseFov + e.deltaY * (e.ctrlKey ? 0.2 : 0.04)));
        userZoomed = true;
      };
      const KEYS = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"];
      const onKeyDown = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase();
        if (!KEYS.includes(k)) return;
        const tgt = e.target as HTMLElement | null;
        if (tgt && /input|textarea|select/i.test(tgt.tagName)) return;
        if (!fullRef.current && !boxRef.current?.matches(":hover")) return;
        e.preventDefault();
        keys.add(k);
        path = null;
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
        if (!userZoomed) baseFov = w / h < 1 ? 82 : 72;
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(mount);
      let visible = true;
      const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting), { threshold: 0 });
      io.observe(mount);

      // Movimento con la tastiera: dentro le stanze e attraverso le porte
      const walkable = (p: V2) => {
        for (const r of rooms) if (pointIn(r.poly, p) && edgeDist(r.poly, p) > 0.22) return true;
        return openings.some((o) => segDist(p, o.a, o.b) < 0.35 || Math.hypot(p[0] - o.center[0], p[1] - o.center[1]) < 0.4);
      };

      // Etichette dei punti di ripresa e mini-planimetria
      const v3 = new THREE.Vector3();
      const v3b = new THREE.Vector3();
      const placeLabels = () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        for (const s of PANO_STATIONS) {
          const el = labelRefs.current[s.id];
          if (!el) continue;
          const d = Math.hypot(s.pos[0] - pos[0], s.pos[1] - pos[1]);
          v3.set(s.pos[0], 0.02, s.pos[1]).project(camera);
          const x = (v3.x * 0.5 + 0.5) * w;
          const y = (-v3.y * 0.5 + 0.5) * h;
          let on = d > 0.6 && d < 9 && v3.z < 1 && x > 10 && x < w - 10 && y > 40 && y < h - 10 && !path;
          if (on) {
            // nascosta se dietro un muro
            v3b.set(s.pos[0], 0.05, s.pos[1]);
            const dist = camera.position.distanceTo(v3b);
            raycaster.set(camera.position, v3b.sub(camera.position).normalize());
            const hit = raycaster.intersectObject(wallMesh, false)[0];
            if (hit && hit.distance < dist - 0.1) on = false;
          }
          el.style.opacity = on ? "1" : "0";
          el.style.pointerEvents = on ? "auto" : "none";
          if (on) el.style.transform = `translate(-50%, 0) translate(${x}px, ${y + 14}px)`;
        }
        const px = pos[0] * PX_PER_METER;
        const py = pos[1] * PX_PER_METER;
        dotRef.current?.setAttribute("cx", `${px}`);
        dotRef.current?.setAttribute("cy", `${py}`);
        const hfov = (2 * Math.atan(Math.tan((camera.fov * D2R) / 2) * camera.aspect)) / D2R;
        const L = 170;
        const a0 = (lon - hfov / 2) * D2R;
        const a1 = (lon + hfov / 2) * D2R;
        coneRef.current?.setAttribute(
          "d",
          `M${px},${py} L${px + Math.cos(a0) * L},${py + Math.sin(a0) * L} A${L},${L} 0 0 1 ${px + Math.cos(a1) * L},${py + Math.sin(a1) * L} Z`,
        );
      };

      let raf = 0;
      let last = performance.now();
      const loop = () => {
        raf = requestAnimationFrame(loop);
        const now = performance.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!visible && !fullRef.current) return;

        if (path) {
          path.t = Math.min(1, path.t + dt / path.T);
          const e = path.t < 0.5 ? 2 * path.t * path.t : 1 - Math.pow(-2 * path.t + 2, 2) / 2;
          const p = pointOnPath(e * path.len);
          // Lo sguardo segue la direzione di marcia (come camminando), senza scatti
          const ahead = pointOnPath(Math.min(path.len, e * path.len + 0.6));
          const mdx = ahead[0] - p[0];
          const mdz = ahead[1] - p[1];
          if (path.turn && Math.hypot(mdx, mdz) > 0.05) {
            const want = Math.atan2(mdz, mdx) / D2R;
            const diff = ((((want - lon) % 360) + 540) % 360) - 180;
            lon += diff * Math.min(1, dt * 3.2);
            lat += (-6 - lat) * Math.min(1, dt * 2);
          }
          pos[0] = p[0];
          pos[1] = p[1];
          if (path.t >= 1) path = null;
        } else if (keys.size && !path) {
          const f = (keys.has("w") || keys.has("arrowup") ? 1 : 0) - (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
          const sd = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0);
          const turn = (keys.has("arrowright") ? 1 : 0) - (keys.has("arrowleft") ? 1 : 0);
          lon += turn * 70 * dt;
          const a = lon * D2R;
          const step = 1.3 * dt;
          const nx = pos[0] + (Math.cos(a) * f - Math.sin(a) * sd) * step;
          const nz = pos[1] + (Math.sin(a) * f + Math.cos(a) * sd) * step;
          const home = BY_ID.get(panoFor(curRoom, pos))!;
          const near = (q: V2) => Math.hypot(q[0] - home.pos[0], q[1] - home.pos[1]) <= FREE_R + 0.05;
          const ok = (q: V2) => walkable(q) && near(q);
          if (ok([nx, nz])) {
            pos[0] = nx;
            pos[1] = nz;
          } else if (ok([nx, pos[1]])) pos[0] = nx;
          else if (ok([pos[0], nz])) pos[1] = nz;
          else if (f !== 0 || sd !== 0) {
            // oltre il raggio: si passa al punto di ripresa nella direzione di marcia (se c'è)
            const md = Math.atan2(Math.sin(a) * f + Math.cos(a) * sd, Math.cos(a) * f - Math.sin(a) * sd) / D2R;
            let bestS: PanoStation | null = null;
            let bestD = Infinity;
            for (const st of PANO_STATIONS) {
              if (st.id === home.id) continue;
              const ang = Math.abs(((((Math.atan2(st.pos[1] - pos[1], st.pos[0] - pos[0]) / D2R - md) % 360) + 540) % 360) - 180);
              const dd = Math.hypot(st.pos[0] - pos[0], st.pos[1] - pos[1]);
              if (ang < 40 && dd < bestD) {
                bestD = dd;
                bestS = st;
              }
            }
            if (bestS) {
              keys.clear();
              walkTo(bestS.pos, roomAt(bestS.pos, -1), true);
            }
          }
        }
        const r = roomAt(pos);
        if (r >= 0) curRoom = r;
        const want = panoFor(curRoom, pos);
        if (want !== (shownB ?? shownA)) void switchTo(want);
        if (shownB) {
          fade = Math.min(1, fade + (dt * 1000) / FADE_MS);
          uniforms.mixB.value = fade < 0.5 ? 2 * fade * fade : 1 - Math.pow(-2 * fade + 2, 2) / 2;
          if (fade >= 1) {
            shownA = shownB;
            shownB = null;
            setUniform("A", shownA);
            uniforms.mixB.value = 0;
          }
        }
        const cur = BY_ID.get(shownB ?? shownA)!;
        eye += (cur.h - eye) * Math.min(1, dt * 3);

        if (!down && !pinch && (Math.abs(velLon) > 0.001 || Math.abs(velLat) > 0.001)) {
          lon += velLon;
          lat += velLat;
          velLon *= 0.9;
          velLat *= 0.9;
        }
        lat = Math.max(-85, Math.min(85, lat));
        camera.fov = baseFov;
        camera.updateProjectionMatrix();
        camera.position.set(pos[0], eye, pos[1]);
        camera.lookAt(pos[0] + Math.cos(lon * D2R) * Math.cos(lat * D2R), eye + Math.sin(lat * D2R), pos[1] + Math.sin(lon * D2R) * Math.cos(lat * D2R));
        if (uniforms.texA.value) renderer.render(scene, camera);
        placeLabels();
      };

      // Stato per i test automatici (sola lettura)
      (window as unknown as { __panoDebug?: () => unknown }).__panoDebug = () => ({
        pos: [...pos],
        room: curRoom,
        roomName: curRoom >= 0 ? ROOMS_3D[curRoom].name : null,
        shownA,
        shownB,
        walking: !!path,
        dest: lastDest,
        lon,
      });

      apiRef.current = {
        goStation: (id) => void goStation(id),
        walkToPlan: ([px, py]) => walkTo([px / PX_PER_METER, py / PX_PER_METER]),
        setFull: () => {
          applyTouchMode();
          requestAnimationFrame(resize);
        },
      };

      try {
        await ensure(start);
        setUniform("A", start.id);
        setBusy(false);
      } catch {
        setFailed(true);
        setBusy(false);
      }
      loop();
      // Anteprime di tutte le stanze in sottofondo: i passaggi sono immediati
      PANO_STATIONS.forEach((s) => {
        if (s.id !== start.id)
          loadTex(s.preview)
            .then((t) => {
              if (!best.has(s.id)) best.set(s.id, t);
            })
            .catch(() => {});
      });

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

  // Mini-planimetria: stanze del modello, ritagliate sull'appartamento
  const plan = useMemo(() => {
    const pts = ROOMS_3D.flatMap((r) => r.pts);
    const pad = 110;
    const minX = Math.min(...pts.map((p) => p[0])) - pad;
    const minY = Math.min(...pts.map((p) => p[1])) - pad;
    const maxX = Math.max(...pts.map((p) => p[0])) + pad;
    const maxY = Math.max(...pts.map((p) => p[1])) + pad;
    return { minX, minY, w: maxX - minX, h: maxY - minY };
  }, []);

  const onPlanClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = plan.minX + ((e.clientX - r.left) / r.width) * plan.w;
    const py = plan.minY + ((e.clientY - r.top) / r.height) * plan.h;
    apiRef.current?.walkToPlan([px, py]);
  };

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

        {/* Mini-planimetria: tocca un punto per andarci; puntino = dove sei, cono = dove guardi */}
        <svg
          viewBox={`${plan.minX} ${plan.minY} ${plan.w} ${plan.h}`}
          onClick={onPlanClick}
          className={`absolute left-3 h-28 cursor-pointer rounded-xl bg-white/85 shadow-soft backdrop-blur-sm sm:h-40 ${
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
            <circle key={s.id} cx={s.pos[0] * PX_PER_METER} cy={s.pos[1] * PX_PER_METER} r={22} fill="#94a3b8" stroke="#fff" strokeWidth={10} />
          ))}
          <path ref={coneRef} fill="#0e6ba8" fillOpacity={0.3} />
          <circle ref={dotRef} r={36} fill="#0e6ba8" stroke="#fff" strokeWidth={12} />
        </svg>

        {/* Nomi dei punti di ripresa visibili (toccali per andarci) */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          {PANO_STATIONS.map((s) => (
            <button
              key={s.id}
              ref={(el) => {
                labelRefs.current[s.id] = el;
              }}
              type="button"
              onClick={() => apiRef.current?.goStation(s.id)}
              className="absolute top-0 left-0 rounded-full bg-ink/65 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-white opacity-0 shadow-soft backdrop-blur-sm transition-opacity duration-200 hover:bg-primary"
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Dissolvenza per i salti dal menu */}
        <div ref={fadeRef} className="pointer-events-none absolute inset-0 z-[15] bg-ink opacity-0 transition-opacity duration-200" />

        <div className={`absolute left-3 z-20 ${full ? "top-[max(0.75rem,env(safe-area-inset-top))]" : "top-3"}`}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            className="inline-flex max-w-[60vw] items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-2 text-sm font-bold text-ink shadow-soft backdrop-blur-sm"
          >
            <span className="truncate">{roomName}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 transition ${menuOpen ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {menuOpen && (
            <ul className="mt-2 max-h-[min(60vh,20rem)] w-56 overflow-y-auto rounded-2xl border border-line bg-white p-1.5 shadow-soft">
              {PANO_STATIONS.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => apiRef.current?.goStation(s.id)}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                      s.name === roomName ? "bg-primary text-white" : "text-ink hover:bg-ice"
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
        <span>
          Tocca il pavimento per spostarti (anche nelle altre stanze) · trascina per guardarti intorno · sui cerchietti a
          terra la vista è identica alla foto
        </span>
      </p>
    </>
  );
}
