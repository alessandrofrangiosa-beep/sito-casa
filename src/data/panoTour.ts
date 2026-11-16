/**
 * Tour virtuale a 360°: 9 punti di ripresa con foto panoramiche equirettangolari (3840 × 1920).
 * Dati ricavati dal rilievo del tour (posizioni, direzioni delle porte e collegamenti tra i punti).
 *
 * Convenzioni degli angoli (gradi):
 * - `yaw`: 0 = centro della foto panoramica, positivo verso destra; è lo stesso riferimento in tutte le foto,
 *   così passando da un punto all'altro si continua a guardare nella stessa direzione.
 * - `pitch`: 0 = orizzonte, negativo verso il pavimento.
 * - `links`: direzione del passaggio (di solito la porta) verso un altro punto, sul pavimento.
 * - `plan`: posizione sulla planimetria del sito (stesso riferimento di src/data/floorPlan3d.ts, 1382 × 2000 px).
 */
export type PanoLink = { to: string; yaw: number; pitch: number };

export type PanoStation = {
  id: string;
  name: string;
  /** Foto panoramica (alta risoluzione) e anteprima leggera che compare subito */
  src: string;
  preview: string;
  /** Direzione di vista iniziale (verso la finestra o il punto più bello) quando si arriva dal menu */
  yaw: number;
  links: PanoLink[];
  plan: [number, number];
};

const pano = (n: number) => ({ src: `/images/tour/room${n}.jpg`, preview: `/images/tour/room${n}-sm.jpg` });

export const PANO_STATIONS: PanoStation[] = [
  {
    id: "ingresso",
    name: "Ingresso",
    ...pano(1),
    yaw: 55,
    plan: [469, 680],
    links: [
      { to: "cucina", yaw: 74.04, pitch: -19.84 },
      { to: "stanza-17-balcone", yaw: -48.06, pitch: -26.25 },
      { to: "bagno", yaw: 77.89, pitch: -13.83 },
      { to: "soggiorno", yaw: -22.06, pitch: -20.02 },
    ],
  },
  {
    id: "soggiorno",
    name: "Soggiorno 16,1 m²",
    ...pano(4),
    yaw: -33.5,
    plan: [757, 734],
    links: [
      { to: "cucina", yaw: 134.65, pitch: -22.31 },
      { to: "ingresso", yaw: -150.97, pitch: -25.91 },
    ],
  },
  {
    id: "stanza-17-balcone",
    name: "Stanza 17,6 m² · balcone",
    ...pano(3),
    yaw: -95,
    plan: [726, 398],
    links: [
      { to: "stanza-17", yaw: 76.42, pitch: -35.93 },
      { to: "ingresso", yaw: 111.06, pitch: -18.94 },
    ],
  },
  {
    id: "stanza-17",
    name: "Stanza 17,6 m²",
    ...pano(2),
    yaw: -110,
    plan: [730, 527],
    links: [{ to: "stanza-17-balcone", yaw: -103.58, pitch: -35.93 }],
  },
  {
    id: "cucina",
    name: "Cucina",
    ...pano(5),
    yaw: 11.5,
    plan: [611, 907],
    links: [
      { to: "soggiorno", yaw: -99.5, pitch: -41.51 },
      { to: "ingresso", yaw: 153.67, pitch: -36.5 },
      { to: "balcone", yaw: -3.5, pitch: -19.09 },
    ],
  },
  {
    id: "bagno",
    name: "Bagno",
    ...pano(6),
    yaw: -5,
    plan: [589, 1070],
    links: [
      { to: "stanza-16", yaw: 155.75, pitch: -35.17 },
      { to: "ingresso", yaw: 177.26, pitch: -36.13 },
    ],
  },
  {
    id: "stanza-16",
    name: "Stanza 16,8 m²",
    ...pano(7),
    yaw: -15,
    plan: [585, 1255],
    links: [{ to: "bagno", yaw: -149.15, pitch: -27.48 }],
  },
  {
    id: "balcone",
    name: "Balcone vista mare",
    ...pano(9),
    yaw: -10,
    plan: [904, 1054],
    links: [
      { to: "cucina", yaw: -130.62, pitch: -34.07 },
      { to: "stanza-20", yaw: 92.03, pitch: -10.56 },
    ],
  },
  {
    id: "stanza-20",
    name: "Stanza 20,2 m²",
    ...pano(8),
    yaw: -75,
    plan: [769, 1561],
    links: [{ to: "balcone", yaw: -85.83, pitch: -14.2 }],
  },
];

export const PANO_START = "ingresso";

/**
 * Direzione sulla planimetria di uno sguardo con un certo yaw (vettore unitario in pixel della planimetria):
 * rotazione + specchiatura stimate confrontando le posizioni dei punti di ripresa con le stanze.
 */
const MAP_A = -0.2038;
const MAP_B = 0.979;
export function planHeading(yawDeg: number): [number, number] {
  const r = (yawDeg * Math.PI) / 180;
  const x = Math.sin(r);
  const z = -Math.cos(r);
  return [MAP_A * x - MAP_B * z, MAP_B * x + MAP_A * z];
}
