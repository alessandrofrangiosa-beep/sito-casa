/**
 * Composizione reale dell'appartamento: unica fonte usata sia nella sezione
 * "Distribuzione degli spazi" sia nel pannello "Info Utili".
 */
export type CompositionItem = { area: string; text: string };

export const composition: CompositionItem[] = [
  { area: "Ingresso", text: "Ampio ingresso (già tinteggiato di bianco) che disimpegna sul corridoio centrale" },
  { area: "Zona giorno", text: "Soggiorno / Sala luminosa" },
  { area: "Cucina", text: "Cucina abitabile separata con accesso alla terrazza principale" },
  {
    area: "Zona notte",
    text: "3 camere da letto: 1 camera matrimoniale principale + 2 ampie camere polivalenti, ideali per figli, ospiti o studio",
  },
  {
    area: "Bagni",
    text: "2 bagni: 1 bagno principale completo interno con vasca + 1 bagno esterno/lavanderia finestrato su terrazza con WC, pilozzo e caldaia",
  },
  { area: "Esterni", text: "3 terrazze (1 terrazza principale ampia + 2 terrazze più piccole) e garage privato ampio, adatto anche a un SUV" },
];

/** Dati rapidi mostrati nella barra sotto il prezzo */
export const quickFacts: { value: string; label: string }[] = [
  { value: "4 locali", label: "sala + 3 camere" },
  { value: "120 m²", label: "superficie" },
  { value: "2", label: "bagni" },
  { value: "3", label: "terrazze" },
  { value: "1", label: "garage" },
];
