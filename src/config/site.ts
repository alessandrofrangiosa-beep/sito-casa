/**
 * Configurazione centrale della landing page.
 * Tutto ciò che va verificato prima della pubblicazione è marcato con `null`
 * e viene mostrato sul sito come segnaposto rosso [DA CONTROLLARE: ...].
 */

export const PROPERTY = {
  address: "Via Vittorio Veneto 390",
  city: "Torre Annunziata (NA)",
  floor: "6° piano di 10 con ascensore",
  /** Superficie catastale da visura (Agenzia Entrate, 15/11/2026): 140 m², 136 m² escluse aree scoperte */
  sqm: 140,
  /** Dati catastali ufficiali (visura del 15/11/2026) */
  catasto: {
    appartamento: { categoria: "A/2", classe: 6, vani: "6,0", superficie: "140 m² (136 m² esclusi i balconi)", rendita: "€\u00a0480,30" },
    garage: { categoria: "C/6", classe: 2, superficie: "15 m²", piano: "S1 (seminterrato)", rendita: "€\u00a050,35" },
    renditaTotale: "€\u00a0530,65",
  },
  /** Prezzo totale della vendita in blocco (appartamento + garage) */
  price: "€\u00a0250.000",
  /** Prezzo del solo appartamento, mostrato come cifra principale nella hero */
  apartmentPrice: "€\u00a0225.000",
  /** Prezzo del garage privato */
  garagePrice: "€\u00a025.000",
  priceNote: "trattabili",
  agencySavings: "€\u00a07.500 – €\u00a010.000",
  /** Spese mensili */
  monthlyCosts: {
    condominio: "€\u00a060",
    box: "€\u00a05",
    riscaldamento: "€\u00a035",
  },
};


/**
 * Numero WhatsApp in formato internazionale senza "+" né spazi (es. "393331234567").
 * Si può impostare anche con la variabile NEXT_PUBLIC_WHATSAPP_NUMBER.
 */
const rawWhatsApp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
/** `null` finché il numero non è inserito o non è valido (8-15 cifre): il pulsante di invio resta disattivato. */
export const WHATSAPP_NUMBER: string | null = /^\d{8,15}$/.test(rawWhatsApp) ? rawWhatsApp : null;

/**
 * Tour virtuale 3D (pulsante "Tour virtuale 3D" sopra le schede Foto Attuali / Arredala tu):
 * visore a 360° con le foto panoramiche in /public/images/tour e i dati in src/data/panoTour.ts.
 * `false` = pulsante nascosto.
 */
export const ENABLE_3D_TOUR = true;

/** Limiti dello studio "Crea il tuo Render AI" */
export const AI_FREE_RENDERS = 2;
export const AI_BONUS_RENDERS = 3;
