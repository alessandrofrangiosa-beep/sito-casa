/**
 * Tour virtuale "a camminata": le foto panoramiche reali (9 del tour a 360° + il corridoio, dalla panoramica del
 * proprietario convertita nello stesso formato) proiettate su un modello 3D
 * dell'appartamento ricavato dalla planimetria (stanze in metri, porte aperte, soffitti).
 *
 * Coordinate del modello: metri, x verso destra e z verso il basso della planimetria (1 m = 70,3 px del disegno
 * di src/data/floorPlan3d.ts), y in alto; il pavimento è a y = 0.
 *
 * Per ogni foto è stata stimata la posizione esatta di ripresa (`pos`), l'altezza dell'obiettivo (`h`) e la
 * rotazione (`alpha`: direzione in pianta, in gradi, del centro della foto), allineando le linee pavimento-parete e
 * soffitto-parete della foto con le stanze della planimetria e le porte con le aperture. Così, stando nel punto di
 * ripresa, la vista è identica alla foto; spostandosi, la prospettiva cambia come nella realtà.
 */
export type PanoStation = {
  id: string;
  name: string;
  /** Foto panoramica (alta risoluzione) e anteprima leggera che compare subito */
  src: string;
  preview: string;
  /** Punto di ripresa (m) e altezza dell'obiettivo dal pavimento (m) */
  pos: [number, number];
  h: number;
  /** Direzione in pianta (gradi) del centro della foto */
  alpha: number;
  /** Direzione di vista (gradi, rispetto al centro della foto) quando si arriva dal menu */
  yaw: number;
};

const pano = (n: number) => ({ src: `/images/tour/room${n}.jpg`, preview: `/images/tour/room${n}-sm.jpg` });

export const PANO_STATIONS: PanoStation[] = [
  { id: "ingresso", name: "Ingresso", ...pano(1), pos: [5.8729, 9.6742], h: 1.229, alpha: 2.62, yaw: 55 },
  { id: "soggiorno", name: "Soggiorno 16,1 m²", ...pano(4), pos: [10.6407, 10.0014], h: 1.536, alpha: 6.98, yaw: -33.5 },
  { id: "stanza-17-balcone", name: "Stanza 17,6 m² · balcone", ...pano(3), pos: [9.6007, 4.7895], h: 1.376, alpha: 8.92, yaw: -95 },
  { id: "stanza-17", name: "Stanza 17,6 m²", ...pano(2), pos: [9.813, 6.768], h: 1.422, alpha: 4.2, yaw: -110 },
  {
    id: "corridoio",
    name: "Corridoio",
    src: "/images/tour/corridoio.jpg",
    preview: "/images/tour/corridoio-sm.jpg",
    pos: [6.0564, 14.2441],
    h: 1.491,
    alpha: -129.28,
    yaw: -140,
  },
  { id: "cucina", name: "Cucina", ...pano(5), pos: [7.7925, 13.2762], h: 1.741, alpha: 2.8, yaw: 11.5 },
  { id: "bagno", name: "Bagno", ...pano(6), pos: [9.0314, 15.3719], h: 1.482, alpha: 6.84, yaw: -5 },
  { id: "stanza-16", name: "Stanza 16,8 m²", ...pano(7), pos: [8.2136, 18.3726], h: 1.573, alpha: 4.99, yaw: -15 },
  { id: "balcone", name: "Balcone vista mare", ...pano(9), pos: [12.8465, 14.3758], h: 1.569, alpha: 9.28, yaw: -10 },
  { id: "stanza-20", name: "Stanza 20,2 m²", ...pano(8), pos: [11.3722, 22.5009], h: 1.412, alpha: 9.1, yaw: -75 },
];

export const PANO_START = "ingresso";

/**
 * Stanze del modello (indici di ROOMS_3D): piccola correzione di scala stimata dalle foto, altezza del soffitto
 * vista nelle foto, foto usate per "dipingere" la stanza (la più vicina se sono due) e lati con la sola ringhiera.
 */
export type WalkRoom = { scale: [number, number]; ceil: number; panos: string[]; railing?: number[] };

export const WALK_ROOMS: Record<number, WalkRoom> = {
  0: { scale: [1, 1], ceil: 3, panos: ["stanza-17-balcone"], railing: [0, 1, 3] },
  1: { scale: [0.95, 0.984], ceil: 3, panos: ["stanza-17", "stanza-17-balcone"] },
  2: { scale: [0.983, 1.011], ceil: 3, panos: ["ingresso"] },
  3: { scale: [1.08, 1.0], ceil: 4.12, panos: ["soggiorno"] },
  4: { scale: [1, 1], ceil: 3, panos: ["soggiorno", "cucina"] },
  5: { scale: [0.971, 0.979], ceil: 3, panos: ["ingresso", "corridoio"] },
  6: { scale: [1.054, 0.927], ceil: 3.28, panos: ["cucina"] },
  7: { scale: [0.981, 1.057], ceil: 4.46, panos: ["bagno"] },
  8: { scale: [1, 1], ceil: 3, panos: ["balcone"] },
  9: { scale: [1.071, 0.92], ceil: 3.23, panos: ["stanza-16"] },
  10: { scale: [1.059, 0.952], ceil: 3, panos: ["balcone"], railing: [1] },
  11: { scale: [1.006, 1.04], ceil: 3, panos: ["stanza-20"] },
};
