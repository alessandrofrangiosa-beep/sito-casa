/**
 * Parametri del calcolatore mutuo e agevolazioni prima casa.
 * Tutti i numeri usati dalla sezione "Mutuo e agevolazioni" stanno qui, così il componente
 * può essere riusato per un altro immobile cambiando solo questo oggetto.
 * Fonte dei valori: quadro normativo e tassi medi indicati dal proprietario (novembre 2026).
 */
export const PROPERTY_FINANCE_CONFIG = {
  /** Prezzo totale (appartamento € 225.000 + garage € 25.000), vendita tra privati esente IVA */
  propertyPrice: 250_000,
  /** Tetto di prezzo del Fondo di Garanzia Prima Casa (Consap) */
  consapPriceCap: 250_000,

  /** Anticipo: slider da 0 a 100.000 € */
  downPaymentMin: 0,
  downPaymentMax: 100_000,
  downPaymentStep: 5_000,
  /** Classico 20% richiesto senza garanzia statale */
  standardDownPayment: 50_000,
  defaultDownPayment: 50_000,

  years: [20, 25, 30] as const,
  defaultYears: 30,

  /** Tasso fisso medio stimato in base al rapporto mutuo/prezzo (LTV) */
  fixedRateLtvUpTo80: 3.15,
  fixedRateLtvOver80: 3.45,
  /** Oltre questa soglia di LTV le banche chiedono di norma la garanzia Consap */
  standardMaxLtv: 80,

  /** Prezzo-valore: valore catastale = rendita × 1,05 × 110 (prima casa) o × 120 (altri casi) */
  defaultRenditaCatastale: 650,
  catastoCoeffPrimaCasa: 115.5,
  catastoCoeffSecondaCasa: 126,
  registroPrimaCasa: 0.02,
  registroSecondaCasa: 0.09,
  registroMinimo: 1_000,
  impostaIpotecaria: 50,
  impostaCatastale: 50,

  /** Imposta sostitutiva sul mutuo */
  sostitutivaPrimaCasa: 0.0025,
  sostitutivaOrdinaria: 0.02,

  /** Detrazione IRPEF interessi passivi abitazione principale: 19% su massimo 4.000 €/anno */
  irpefInterestRate: 0.19,
  irpefInterestCap: 4_000,

  /** Bonus ristrutturazione abitazione principale e bonus mobili (spese 2026) */
  renovationBonusRate: 0.5,
  renovationMaxSpend: 96_000,
  defaultRenovationBudget: 40_000,
  renovationYears: 10,
  furnitureBonusRate: 0.5,
  furnitureMaxSpend: 5_000,
} as const;

const C = PROPERTY_FINANCE_CONFIG;

/** Rata mensile con ammortamento alla francese: M = P · r(1+r)^n / ((1+r)^n − 1) */
export function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  const n = years * 12;
  const r = annualRatePct / 100 / 12;
  if (principal <= 0) return 0;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/** Interessi pagati nei primi 12 mesi (base della detrazione IRPEF del primo anno) */
export function firstYearInterest(principal: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12;
  const rata = monthlyPayment(principal, annualRatePct, years);
  let debt = principal;
  let interest = 0;
  for (let m = 0; m < 12 && debt > 0; m++) {
    const i = debt * r;
    interest += i;
    debt -= rata - i;
  }
  return interest;
}

/** Tasso fisso stimato: più alto quando si finanzia oltre l'80% del prezzo */
export function estimatedFixedRate(ltvPct: number): number {
  return ltvPct > C.standardMaxLtv ? C.fixedRateLtvOver80 : C.fixedRateLtvUpTo80;
}

/** Imposte al rogito con il prezzo-valore (acquisto da privato) */
export function notaryTaxes(rendita: number, primaCasa: boolean) {
  const valoreCatastale = rendita * (primaCasa ? C.catastoCoeffPrimaCasa : C.catastoCoeffSecondaCasa);
  const registro = Math.max(C.registroMinimo, valoreCatastale * (primaCasa ? C.registroPrimaCasa : C.registroSecondaCasa));
  return { valoreCatastale, registro, totale: registro + C.impostaIpotecaria + C.impostaCatastale };
}

/** Importo in euro formattato all'italiana, es. "€ 1.054" (spazio non divisibile: "€" non va mai a capo da solo) */
export function formatEuro(n: number): string {
  return `€\u00a0${new Intl.NumberFormat("it-IT", { useGrouping: "always", maximumFractionDigits: 0 }).format(Math.round(n))}`;
}

/** Come formatEuro ma con i centesimi quando servono, es. "€ 1.601,50" */
export function formatEuroCents(n: number): string {
  const cents = Math.round(n * 100) % 100 !== 0;
  return `€\u00a0${new Intl.NumberFormat("it-IT", {
    useGrouping: "always",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(n)}`;
}

/** Rata con i valori di partenza del calcolatore (mostrata anche nella hero) */
export function defaultMonthlyPayment(): number {
  const loan = C.propertyPrice - C.defaultDownPayment;
  return monthlyPayment(loan, estimatedFixedRate((loan / C.propertyPrice) * 100), C.defaultYears);
}
