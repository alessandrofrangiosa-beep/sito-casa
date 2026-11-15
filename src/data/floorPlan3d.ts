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
