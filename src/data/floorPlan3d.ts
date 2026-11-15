/**
 * Ambienti per la planimetria 3D, ricavati dalla planimetria catastale (piano 6).
 * Coordinate in pixel del disegno di riferimento (1382 × 2000 px); scala misurata sulle superfici: 70,3 px = 1 m.
 * Le superfici in m² sono quelle annotate sulla planimetria (valori netti indicativi, ±3% circa).
 */
export const PX_PER_METER = 70.3;
/** Altezza utile dei vani (planimetria: H = 3,00 m) */
export const CEILING_HEIGHT = 3;

export type RoomKind = "room" | "kitchen" | "wet" | "corridor" | "balcony";

export type Room3D = {
  name: string;
  /** Superficie annotata, es. "17,6" */
  area: string;
  kind: RoomKind;
  /** Poligono del pavimento in pixel del disegno (ordine orario) */
  pts: [number, number][];
};

export const ROOMS_3D: Room3D[] = [
  { name: "Balcone", area: "5,1", kind: "balcony", pts: [[537, 128], [827, 128], [827, 215], [537, 215]] },
  { name: "Stanza", area: "17,6", kind: "room", pts: [[527, 240], [812, 240], [812, 545], [527, 545]] },
  {
    name: "Ingresso",
    area: "12,6",
    kind: "corridor",
    pts: [[318, 551], [608, 551], [608, 742], [247, 742], [247, 660], [318, 660]],
  },
  { name: "Stanza", area: "16,1", kind: "room", pts: [[615, 551], [898, 551], [898, 832], [615, 832]] },
  { name: "Disimpegno", area: "2,3", kind: "corridor", pts: [[474, 748], [608, 748], [608, 832], [474, 832]] },
  {
    name: "Corridoio",
    area: "15,0",
    kind: "corridor",
    pts: [[378, 748], [468, 748], [468, 1395], [565, 1395], [565, 1490], [465, 1490], [465, 1520], [378, 1525]],
  },
  { name: "Cucina", area: "11,6", kind: "kitchen", pts: [[473, 840], [808, 840], [808, 1010], [473, 1010]] },
  { name: "Bagno", area: "5,9", kind: "wet", pts: [[473, 1018], [728, 1018], [728, 1133], [473, 1133]] },
  { name: "Lavanderia", area: "1,6", kind: "wet", pts: [[752, 1025], [835, 1025], [835, 1125], [752, 1125]] },
  { name: "Stanza", area: "16,8", kind: "room", pts: [[473, 1142], [808, 1142], [808, 1388], [473, 1388]] },
  { name: "Balcone", area: "9,2", kind: "balcony", pts: [[830, 855], [920, 855], [920, 1360], [830, 1360]] },
  { name: "Stanza", area: "20,2", kind: "room", pts: [[565, 1400], [920, 1400], [920, 1675], [565, 1675]] },
];

/** Etichetta della strada, sopra il balcone su Via Vittorio Veneto */
export const STREET_LABEL = { text: "Via Vittorio Veneto", at: [682, 70] as [number, number] };

export type OpeningType = "door" | "window" | "glassDoor";

/**
 * Porte e finestre ricavate dalla planimetria catastale (posizioni indicative).
 * `a`→`b` è il vano sul muro (in pixel del disegno); la porta è incernierata in `a` e si apre verso `into`.
 * Il vano taglia tutti i muri paralleli entro `tol` pixel (default 32): così si apre anche il muro della stanza accanto.
 * - door: porta interna o di ingresso (anta in legno socchiusa)
 * - glassDoor: portafinestra verso il balcone
 * - window: finestra con davanzale a 90 cm
 */
export type Opening3D = {
  type: OpeningType;
  a: [number, number];
  b: [number, number];
  into?: [number, number];
  /** false = vano senza anta (passaggio o porta scorrevole) */
  leaf?: boolean;
  tol?: number;
};

export const OPENINGS_3D: Opening3D[] = [
  // Ingresso dell'appartamento dal ballatoio condominiale
  { type: "door", a: [282, 742], b: [348, 742], into: [315, 700] },
  // Stanza 17,6: porta dall'ingresso e portafinestra sul balcone su Via Vittorio Veneto
  { type: "door", a: [535, 545], b: [590, 545], into: [560, 500] },
  { type: "glassDoor", a: [635, 240], b: [720, 240] },
  // Stanza 16,1: porta dall'ingresso, porta dal disimpegno e finestra
  { type: "door", a: [615, 570], b: [615, 625], into: [660, 600] },
  { type: "door", a: [615, 820], b: [615, 765], into: [660, 790] },
  { type: "window", a: [898, 600], b: [898, 690] },
  // Corridoio: porta dall'ingresso; passaggio scorrevole disimpegno-cucina
  { type: "door", a: [390, 748], b: [455, 748], into: [420, 790] },
  { type: "door", a: [490, 836], b: [585, 836], leaf: false },
  // Cucina: porta sul corridoio e portafinestra sul balcone laterale
  { type: "door", a: [473, 940], b: [473, 995], into: [510, 965] },
  { type: "glassDoor", a: [808, 900], b: [808, 965] },
  // Bagno e lavanderia
  { type: "door", a: [473, 1068], b: [473, 1128], into: [510, 1100] },
  // Bagno-lavanderia: solo una finestra in fondo al bagno (nessuna porta tra i due ambienti)
  { type: "window", a: [728, 1060], b: [728, 1102] },
  { type: "window", a: [835, 1055], b: [835, 1100] },
  // Stanza 16,8: porta sul corridoio e portafinestra sul balcone laterale
  { type: "door", a: [473, 1185], b: [473, 1245], into: [510, 1215] },
  { type: "glassDoor", a: [808, 1195], b: [808, 1275] },
  // Stanza 20,2: porta dal corridoio e portafinestra verso il balcone laterale
  { type: "door", a: [565, 1405], b: [565, 1465], into: [600, 1440] },
  { type: "glassDoor", a: [840, 1400], b: [905, 1400], tol: 45 },
];
