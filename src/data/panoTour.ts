/**
 * Tour virtuale 3D: 10 foto a 360° reali proiettate sulle stanze della planimetria ufficiale del sito
 * (src/data/floorPlan3d.ts: misure in metri, soffitti a 3,00 m, porte della planimetria).
 *
 * Coordinate: metri; x verso destra della planimetria, z verso l'alto (z = −y della planimetria / 70,3).
 * - `pos`: punto di ripresa della foto dentro la sua stanza; `h`: altezza dell'obiettivo; `off`: rotazione della foto
 *   (direzione = yaw della foto + off; direzione 0 = verso l'alto della planimetria, positivo in senso orario).
 *   Posizione, altezza e rotazione sono state stimate allineando le linee pavimento-parete e soffitto-parete della
 *   foto con la stanza della planimetria (le misure della stanza restano quelle della planimetria, entro ±1%).
 * - `box`: stanza della planimetria [x min, x max, z min, z max] rispetto al punto di ripresa.
 * - `links[].via`: porte della planimetria attraversate per arrivare alla stanza collegata.
 * - `yaw`: direzione di vista (della foto) con cui si arriva nella stanza: finestra o punto più bello.
 */
export type PanoLink = { to: string; via?: [number, number][]; direct?: boolean };

export type PanoStation = {
  id: string;
  name: string;
  src: string;
  preview: string;
  pos: [number, number];
  h: number;
  ceil: number;
  box: [number, number, number, number];
  off: number;
  yaw: number;
  links: PanoLink[];
};

export const PANO_STATIONS: PanoStation[] = [
  {
    id: "ingresso",
    name: "Ingresso",
    src: "/images/tour/room1.jpg",
    preview: "/images/tour/room1-sm.jpg",
    pos: [6.084, -9.661],
    h: 1.195,
    ceil: 3.0,
    box: [-1.561, 2.564, -0.894, 1.823],
    off: 94.50,
    yaw: 55,
    links: [{ to: "stanza-17", via: [[7.994, -7.795]] }, { to: "soggiorno", via: [[8.706, -8.492]] }, { to: "corridoio", via: [[6.003, -10.597]] }],
  },
  {
    id: "soggiorno",
    name: "Soggiorno 16,1 m²",
    src: "/images/tour/room4.jpg",
    preview: "/images/tour/room4-sm.jpg",
    pos: [10.908, -9.978],
    h: 1.565,
    ceil: 4.04,
    box: [-2.160, 1.866, -1.857, 2.140],
    off: 94.50,
    yaw: -33.5,
    links: [{ to: "ingresso", via: [[8.706, -8.492]] }, { to: "cucina", via: [[8.706, -11.266], [7.681, -11.38], [7.681, -11.92]] }],
  },
  {
    id: "stanza-17-balcone",
    name: "Stanza 17,6 m² · balcone",
    src: "/images/tour/room3.jpg",
    preview: "/images/tour/room3-sm.jpg",
    pos: [9.434, -4.758],
    h: 1.275,
    ceil: 3.02,
    box: [-1.938, 2.116, -2.994, 1.344],
    off: 94.50,
    yaw: -95,
    links: [{ to: "stanza-17", direct: true }],
  },
  {
    id: "stanza-17",
    name: "Stanza 17,6 m²",
    src: "/images/tour/room2.jpg",
    preview: "/images/tour/room2-sm.jpg",
    pos: [9.817, -6.781],
    h: 1.355,
    ceil: 3.01,
    box: [-2.320, 1.734, -0.971, 3.367],
    off: 94.50,
    yaw: -110,
    links: [{ to: "ingresso", via: [[7.994, -7.795]] }, { to: "stanza-17-balcone", direct: true }],
  },
  {
    id: "corridoio",
    name: "Corridoio",
    src: "/images/tour/corridoio.jpg",
    preview: "/images/tour/corridoio-sm.jpg",
    pos: [6.023, -14.217],
    h: 1.070,
    ceil: 2.61,
    box: [-0.646, 0.634, -7.475, 3.577],
    off: 321.50,
    yaw: -140,
    links: [{ to: "ingresso", via: [[6.003, -10.597]] }, { to: "cucina", via: [[6.686, -13.755]] }, { to: "bagno", via: [[6.686, -15.619]] }, { to: "stanza-16", via: [[6.686, -17.283]] }],
  },
  {
    id: "cucina",
    name: "Cucina",
    src: "/images/tour/room5.jpg",
    preview: "/images/tour/room5-sm.jpg",
    pos: [8.414, -12.940],
    h: 1.385,
    ceil: 2.85,
    box: [-1.685, 3.080, -1.427, 0.991],
    off: 94.50,
    yaw: 11.5,
    links: [{ to: "corridoio", via: [[6.686, -13.755]] }, { to: "soggiorno", via: [[7.681, -11.92], [7.681, -11.38], [8.706, -11.266]] }, { to: "balcone", via: [[11.65, -13.257]] }],
  },
  {
    id: "bagno",
    name: "Bagno",
    src: "/images/tour/room6.jpg",
    preview: "/images/tour/room6-sm.jpg",
    pos: [8.225, -15.461],
    h: 1.350,
    ceil: 3.0,
    box: [-1.497, 2.131, -0.656, 0.980],
    off: 94.50,
    yaw: -5,
    links: [{ to: "corridoio", via: [[6.686, -15.619]] }],
  },
  {
    id: "stanza-16",
    name: "Stanza 16,8 m²",
    src: "/images/tour/room7.jpg",
    preview: "/images/tour/room7-sm.jpg",
    pos: [8.582, -18.346],
    h: 1.350,
    ceil: 3.3,
    box: [-1.854, 2.912, -1.398, 2.101],
    off: 94.50,
    yaw: -15,
    links: [{ to: "corridoio", via: [[6.686, -17.283]] }, { to: "balcone", via: [[11.65, -17.568]] }],
  },
  {
    id: "balcone",
    name: "Balcone vista mare",
    src: "/images/tour/room9.jpg",
    preview: "/images/tour/room9-sm.jpg",
    pos: [12.997, -15.056],
    h: 1.640,
    ceil: 3.01,
    box: [-1.191, 0.089, -4.290, 2.893],
    off: 94.50,
    yaw: -10,
    links: [{ to: "cucina", via: [[11.65, -13.257]] }, { to: "stanza-20", via: [[12.447, -19.417], [12.447, -19.986]] }, { to: "stanza-16", via: [[11.65, -17.568]] }],
  },
  {
    id: "stanza-20",
    name: "Stanza 20,2 m²",
    src: "/images/tour/room8.jpg",
    preview: "/images/tour/room8-sm.jpg",
    pos: [11.343, -22.461],
    h: 1.355,
    ceil: 3.0,
    box: [-3.306, 1.744, -1.366, 2.546],
    off: 94.50,
    yaw: -75,
    links: [{ to: "balcone", via: [[12.447, -19.986], [12.447, -19.417]] }],
  },
];

export const PANO_START = "ingresso";
