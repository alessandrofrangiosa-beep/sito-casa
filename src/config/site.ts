/**
 * Configurazione centrale della landing page.
 * Tutto ciò che va verificato prima della pubblicazione è marcato con `null`
 * e viene mostrato sul sito come segnaposto rosso [DA CONTROLLARE: ...].
 */

export const PROPERTY = {
  address: "Via Vittorio Veneto 390",
  city: "Torre Annunziata (NA)",
  floor: "6° piano di 8 con ascensore",
  sqm: 120,
  price: "€\u00a0250.000",
  priceNote: "trattabili",
  agencySavings: "€\u00a07.500 – €\u00a010.000",
  condoWorksPaid: "€\u00a010.000 – €\u00a015.000",
  /** Importo dei lavori già pagati mostrato sotto il prezzo nella hero */
  worksPaidHero: "€\u00a015.000",
  /** Spese condominiali mensili, es. "€ 60/mese" */
  condoFees: null as string | null,
  /** Classe energetica APE, es. "G" */
  energyClass: null as string | null,
};

/**
 * Numero WhatsApp in formato internazionale senza "+" né spazi (es. "393331234567").
 * Si può impostare anche con la variabile NEXT_PUBLIC_WHATSAPP_NUMBER.
 */
export const WHATSAPP_NUMBER: string | null =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || null;

/**
 * Tour virtuale 360°.
 * Impostare a `true` e compilare TOUR_EMBED_URL con l'URL di embed
 * (Matterport: https://my.matterport.com/show/?m=XXXX, Zillow 3D Home, Kuula, ecc.).
 */
export const ENABLE_3D_TOUR = false;
export const TOUR_EMBED_URL = "";

/** Limiti dello studio "Crea il tuo Render AI" */
export const AI_FREE_RENDERS = 2;
export const AI_BONUS_RENDERS = 3;
