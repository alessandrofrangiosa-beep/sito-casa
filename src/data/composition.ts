/**
 * Composizione reale dell'appartamento: unica fonte usata sia nella sezione
 * "Distribuzione degli spazi" sia nel pannello "Info Utili".
 */
export type CompositionItem = { area: string; text: string };

export const composition: CompositionItem[] = [
  { area: "Ingresso", text: "Ampio ingresso (già tinteggiato di bianco) che disimpegna sul corridoio centrale" },
  { area: "Zona giorno", text: "Soggiorno / Sala luminosa" },
  { area: "Cucina", text: "Cucina abitabile separata con accesso diretto al balcone" },
  {
    area: "Zona notte",
    text: "1 camera da letto matrimoniale + 2 stanze versatili (in passato studio e stanza multiuso), da usare come studio, cameretta, stanza ospiti o smart working",
  },
  {
    area: "Bagni",
    text: "2 bagni: 1 bagno principale completo interno con vasca + 1 bagno esterno/lavanderia finestrato sul balcone con WC, pilozzo e caldaia",
  },
  { area: "Esterni", text: "2 balconi e garage privato di 15 m² al piano seminterrato, adatto anche a un SUV" },
];

/** Dati rapidi mostrati nella barra sotto il prezzo */
export const quickFacts: { value: string; label: string }[] = [
  { value: "4", label: "stanze" },
  { value: "1", label: "cucina" },
  { value: "2", label: "bagni" },
  { value: "2", label: "balconi" },
  { value: "1", label: "garage" },
];
