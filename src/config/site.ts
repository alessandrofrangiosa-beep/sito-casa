/**
 * Configurazione centrale della landing page.
 * Tutto ciò che va verificato prima della pubblicazione è marcato con `null`
 * e viene mostrato sul sito come segnaposto rosso [DA CONTROLLARE: ...].
 */

export const PROPERTY = {
  address: "Via Vittorio Veneto 390",
  city: "Torre Annunziata (NA)",
  floor: "6° piano di 8 con ascensore",
  sqm: 144,
  /** Prezzo totale della vendita in blocco (appartamento + garage) */
  price: "€\u00a0250.000",
  /** Prezzo del solo appartamento, mostrato come cifra principale nella hero */
  apartmentPrice: "€\u00a0225.000",
  /** Prezzo del garage privato */
  garagePrice: "€\u00a025.000",
  priceNote: "trattabili",
  agencySavings: "€\u00a07.500 – €\u00a010.000",
  /** Lavori straordinari su facciate e balconi già pagati dal proprietario */
  condoWorksPaid: "€\u00a015.000",
  /** Spese condominiali mensili, es. "€ 60/mese" */
  condoFees: null as string | null,
  /** Classe energetica APE, es. "G" */
  energyClass: null as string | null,
};

/**
 * Scomposizione trasparente del prezzo (sezione "Perché è un'opportunità concreta").
 * Il netto e il prezzo al m² sono calcolati in automatico da questi valori.
 */
export const PRICE_BREAKDOWN = {
  /** Prezzo del solo appartamento (il garage da € 25.000 è a parte) */
  askingPrice: 225_000,
  deductions: [
    { label: "Lavori straordinari su facciate e balconi già saldati", amount: 15_000 },
    { label: "Commissioni d'agenzia risparmiate (0% intermediari)", amount: 9_000 },
  ],
};

/**
 * Numero WhatsApp in formato internazionale senza "+" né spazi (es. "393331234567").
 * Si può impostare anche con la variabile NEXT_PUBLIC_WHATSAPP_NUMBER.
 */
const rawWhatsApp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
/** `null` finché il numero non è inserito o non è valido (8-15 cifre): il pulsante di invio resta disattivato. */
export const WHATSAPP_NUMBER: string | null = /^\d{8,15}$/.test(rawWhatsApp) ? rawWhatsApp : null;

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
