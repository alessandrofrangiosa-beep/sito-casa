/**
 * Tour virtuale 3D: 10 foto a 360° reali (9 dal tour ricavato dal video della casa + il corridoio dalla foto
 * panoramica del proprietario), ognuna con la geometria della propria stanza.
 *
 * Come sono stati ricavati i dati (script di analisi, non nel sito):
 * - orientamento e posizione di ripresa di ogni foto dalla ricostruzione 3D del video (tutte le foto condividono
 *   lo stesso riferimento: `off` = rotazione tra la foto e gli assi della casa);
 * - forma di ogni stanza (scatola allineata agli assi) misurata sulla foto stessa: linee pavimento-parete e
 *   soffitto-parete; altezza dell'obiettivo uguale per tutte le riprese (1,35 m, stesso telefono), da cui le
 *   misure in metri, che coincidono con la planimetria (es. stanza 20,2 m²: 3,95 × 5,09 m);
 * - porte: direzione in cui ogni foto vede la porta verso la stanza vicina (`links[].yaw`). Il passaggio tra due
 *   stanze avviene esattamente sulla porta, dove le due foto si sovrappongono.
 *
 * Convenzioni: metri; asse x e z della casa; `box` = [x min, x max, z min, z max] rispetto al punto di ripresa;
 * direzione (gradi) = atan2(dx, dz); yaw della foto = direzione − `off` (0 = centro della foto, positivo a destra).
 * `plan` / `planAlpha`: posizione e rotazione sulla mini-planimetria (pixel di src/data/floorPlan3d.ts).
 */
export type PanoLink = { to: string; yaw?: number; direct?: [number, number] };

export type PanoStation = {
  id: string;
  name: string;
  src: string;
  preview: string;
  /** Altezza dell'obiettivo e del soffitto (m) */
  h: number;
  ceil: number;
  box: [number, number, number, number];
  off: number;
  /** Direzione di vista (yaw della foto) quando si arriva dal menu */
  yaw: number;
  plan: [number, number];
  planAlpha: number;
  links: PanoLink[];
};

export const PANO_STATIONS: PanoStation[] = [
  {
    id: "ingresso",
    name: "Ingresso",
    src: "/images/tour/room1.jpg",
    preview: "/images/tour/room1-sm.jpg",
    h: 1.35,
    ceil: 3.041,
    box: [-1.783, 0.837, -1.254, 1.712],
    off: 4.5,
    yaw: 55,
    plan: [412.9, 680.1],
    planAlpha: 2.62,
    links: [{ to: "stanza-17-balcone", yaw: -48.06 }, { to: "soggiorno", yaw: -22.06 }, { to: "corridoio", yaw: 75.97 }],
  },
  {
    id: "soggiorno",
    name: "Soggiorno 16,1 m²",
    src: "/images/tour/room4.jpg",
    preview: "/images/tour/room4-sm.jpg",
    h: 1.35,
    ceil: 3.537,
    box: [-1.805, 1.579, -1.947, 1.667],
    off: 4.5,
    yaw: -33.5,
    plan: [748.0, 703.1],
    planAlpha: 6.98,
    links: [{ to: "ingresso", yaw: -150.97 }, { to: "cucina", yaw: 134.65 }],
  },
  {
    id: "stanza-17-balcone",
    name: "Stanza 17,6 m² · balcone",
    src: "/images/tour/room3.jpg",
    preview: "/images/tour/room3-sm.jpg",
    h: 1.35,
    ceil: 3.0,
    box: [-1.32, 2.954, -1.895, 2.069],
    off: 4.5,
    yaw: -95,
    plan: [674.9, 336.7],
    planAlpha: 8.92,
    links: [{ to: "ingresso", yaw: 111.06 }, { to: "stanza-17", direct: [2.077, 0.332] }],
  },
  {
    id: "stanza-17",
    name: "Stanza 17,6 m²",
    src: "/images/tour/room2.jpg",
    preview: "/images/tour/room2-sm.jpg",
    h: 1.35,
    ceil: 2.933,
    box: [-3.285, 0.953, -2.285, 1.706],
    off: 4.5,
    yaw: -110,
    plan: [689.9, 475.8],
    planAlpha: 4.2,
    links: [{ to: "stanza-17-balcone", direct: [-2.031, -0.325] }],
  },
  {
    id: "corridoio",
    name: "Corridoio",
    src: "/images/tour/corridoio.jpg",
    preview: "/images/tour/corridoio-sm.jpg",
    h: 1.35,
    ceil: 2.219,
    box: [-3.269, 3.333, -0.674, 0.579],
    off: -131.52,
    yaw: -140,
    plan: [425.8, 1001.4],
    planAlpha: -129.28,
    links: [{ to: "ingresso", yaw: 36.0 }, { to: "cucina", yaw: 93.6 }, { to: "bagno", yaw: -166.8 }, { to: "stanza-16", yaw: -150.0 }],
  },
  {
    id: "cucina",
    name: "Cucina",
    src: "/images/tour/room5.jpg",
    preview: "/images/tour/room5-sm.jpg",
    h: 1.35,
    ceil: 2.531,
    box: [-0.956, 1.388, -1.718, 3.592],
    off: 4.5,
    yaw: 11.5,
    plan: [547.8, 933.3],
    planAlpha: 2.8,
    links: [{ to: "soggiorno", yaw: -99.5 }, { to: "balcone", yaw: -3.5 }, { to: "corridoio", yaw: 153.67 }],
  },
  {
    id: "bagno",
    name: "Bagno",
    src: "/images/tour/room6.jpg",
    preview: "/images/tour/room6-sm.jpg",
    h: 1.35,
    ceil: 2.786,
    box: [-1.129, 0.764, -1.625, 2.151],
    off: 4.5,
    yaw: -5,
    plan: [634.9, 1080.6],
    planAlpha: 6.84,
    links: [{ to: "corridoio", yaw: 177.26 }],
  },
  {
    id: "stanza-16",
    name: "Stanza 16,8 m²",
    src: "/images/tour/room7.jpg",
    preview: "/images/tour/room7-sm.jpg",
    h: 1.35,
    ceil: 3.27,
    box: [-2.037, 1.36, -1.827, 2.912],
    off: 4.5,
    yaw: -15,
    plan: [577.4, 1291.6],
    planAlpha: 4.99,
    links: [{ to: "corridoio", yaw: -149.15 }],
  },
  {
    id: "balcone",
    name: "Balcone vista mare",
    src: "/images/tour/room9.jpg",
    preview: "/images/tour/room9-sm.jpg",
    h: 1.35,
    ceil: 2.471,
    box: [-2.307, 2.721, -1.09, 0.232],
    off: 4.5,
    yaw: -10,
    plan: [903.1, 1010.6],
    planAlpha: 9.28,
    links: [{ to: "cucina", yaw: -130.62 }, { to: "stanza-20", yaw: 92.03 }],
  },
  {
    id: "stanza-20",
    name: "Stanza 20,2 m²",
    src: "/images/tour/room8.jpg",
    preview: "/images/tour/room8-sm.jpg",
    h: 1.35,
    ceil: 2.945,
    box: [-2.569, 1.378, -3.334, 1.759],
    off: 4.5,
    yaw: -75,
    plan: [799.5, 1581.8],
    planAlpha: 9.1,
    links: [{ to: "balcone", yaw: -85.83 }],
  },
];

export const PANO_START = "ingresso";
