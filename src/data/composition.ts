/**
 * Composizione reale dell'appartamento: unica fonte usata sia nella sezione
 * "Distribuzione degli spazi" sia nel pannello "Info Utili".
 */
export type CompositionItem = { area: string; text: string };

export const composition: CompositionItem[] = [
  { area: "Ingresso", text: "Ampio ingresso (già tinteggiato di bianco) che disimpegna sul corridoio centrale" },
  { area: "Zona giorno", text: "Soggiorno / Sala luminosa" },
  { area: "Cucina", text: "Cucina abitabile separata con accesso diretto alla terrazza" },
  {
    area: "Zona notte",
    text: "1 camera da letto matrimoniale + 2 stanze versatili (in passato studio e stanza multiuso), da usare come studio, cameretta, stanza ospiti o smart working",
  },
  {
    area: "Bagni",
    text: "2 bagni: 1 bagno principale completo interno con vasca + 1 bagno esterno/lavanderia finestrato su terrazza con WC, pilozzo e caldaia",
  },
  { area: "Esterni", text: "1 terrazza ampia + 2 balconi più piccoli e garage privato ampio, adatto anche a un SUV" },
];

/** Dati rapidi mostrati nella barra sotto il prezzo */
export const quickFacts: { value: string; label: string }[] = [
  { value: "4", label: "stanze" },
  { value: "1", label: "cucina" },
  { value: "144 m²", label: "superficie" },
  { value: "2", label: "bagni" },
  { value: "1 + 2", label: "terrazza + balconi" },
  { value: "1", label: "garage" },
];
