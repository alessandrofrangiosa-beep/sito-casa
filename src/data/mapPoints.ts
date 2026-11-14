/**
 * Punti mostrati sulla mappa della sezione "Posizione strategica".
 * Coordinate reali prese da OpenStreetMap (Nominatim), novembre 2026.
 * Sulla mappa si vede solo l'icona; il nome (con la distanza) si apre solo toccando l'icona.
 * Solo la casa ha il nome sempre aperto. "minor" = compare avvicinando lo zoom (negozi, farmacie, scuole, bar).
 * "side" = lato dell'etichetta rispetto al segnaposto, scelto per evitare sovrapposizioni.
 */
export type MapPoint = {
  id: string;
  label: string;
  emoji: string;
  lat: number;
  lng: number;
  tier: "home" | "major" | "minor";
  side: "left" | "right" | "top" | "bottom";
  /** distanza in linea d'aria dalla casa, solo informativa */
  meters?: number;
};

export const HOME: MapPoint = {
  id: "casa",
  label: "La tua casa",
  emoji: "🏠",
  lat: 40.75960,
  lng: 14.44825,
  tier: "home",
  side: "bottom",
};

export const MAP_POINTS: MapPoint[] = [
  HOME,
  { id: "circum", label: "Circumvesuviana Torre Annunziata–Oplonti", emoji: "🚆", lat: 40.759815, lng: 14.451023, tier: "major", side: "right", meters: 235 },
  { id: "scavi", label: "Scavi di Oplonti · Villa di Poppea", emoji: "🏛️", lat: 40.757063, lng: 14.452994, tier: "major", side: "right", meters: 489 },
  { id: "ospedale", label: "Ospedale di Boscotrecase", emoji: "🏥", lat: 40.76657, lng: 14.452177, tier: "major", side: "right", meters: 843 },
  { id: "molo", label: "Porto e Molo di Levante", emoji: "⚓", lat: 40.752265, lng: 14.449928, tier: "major", side: "left", meters: 830 },
  { id: "lungomare", label: "Lungomare di Oplonti", emoji: "🌊", lat: 40.751004, lng: 14.452899, tier: "major", side: "right", meters: 1033 },
  { id: "a3-nord", label: "Ingresso A3 Torre Annunziata Nord", emoji: "🛣️", lat: 40.765513, lng: 14.433016, tier: "major", side: "right", meters: 1440 },
  { id: "a3-sud", label: "Ingresso A3 Torre Annunziata Sud", emoji: "🛣️", lat: 40.753323, lng: 14.46903, tier: "major", side: "left", meters: 1880 },
  { id: "fs", label: "Stazione FS Torre Annunziata Centrale", emoji: "🚉", lat: 40.747066, lng: 14.463872, tier: "major", side: "left", meters: 1920 },
  { id: "farmacia", label: "Farmacia Mosca", emoji: "💊", lat: 40.759577, lng: 14.446566, tier: "minor", side: "left", meters: 142 },
  { id: "deco", label: "Supermercato Decò", emoji: "🛒", lat: 40.75811, lng: 14.443483, tier: "minor", side: "left", meters: 434 },
  { id: "sisa", label: "Supermercato SISA", emoji: "🛒", lat: 40.755565, lng: 14.449344, tier: "minor", side: "left", meters: 458 },
  { id: "elementare", label: "Scuola elementare C. N. Cesaro", emoji: "🏫", lat: 40.759363, lng: 14.4419, tier: "minor", side: "left", meters: 536 },
  { id: "superiore", label: "Istituto superiore E. Cesaro", emoji: "🎓", lat: 40.76023, lng: 14.452067, tier: "minor", side: "top", meters: 329 },
  { id: "media", label: "Scuola media G. Parini", emoji: "🏫", lat: 40.756084, lng: 14.455631, tier: "minor", side: "right", meters: 734 },
  { id: "bar", label: "Bar Royal", emoji: "☕", lat: 40.759273, lng: 14.451133, tier: "minor", side: "right", meters: 246 },
];
