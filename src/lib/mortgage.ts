/** Rata mensile con ammortamento alla francese (rata costante, tasso fisso). */
export function monthlyPayment(principal: number, annualRatePct: number, years: number): number {
  const n = years * 12;
  const r = annualRatePct / 100 / 12;
  if (principal <= 0) return 0;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/** Importo in euro formattato all'italiana, es. "€ 1.054" */
export function formatEuro(n: number): string {
  return `€ ${new Intl.NumberFormat("it-IT", { useGrouping: "always", maximumFractionDigits: 0 }).format(Math.round(n))}`;
}

/** Valori pre-impostati del simulatore (prezzo totale: appartamento € 225.000 + garage € 25.000). */
export const MORTGAGE_DEFAULTS = {
  propertyValue: 250_000,
  downPayments: [
    { id: "20", pct: 20, label: "20% Standard" },
    { id: "10", pct: 10, label: "10%" },
    { id: "0", pct: 0, label: "0% Mutuo Giovani Under 36 / Consap" },
  ],
  defaultDownPaymentId: "20",
  years: [20, 25, 30],
  defaultYears: 30,
  rateMin: 2,
  rateMax: 5,
  rateStep: 0.05,
  defaultRate: 3,
};

/** Rata con i valori pre-impostati (mostrata anche nella hero) */
export function defaultMonthlyPayment(): number {
  const d = MORTGAGE_DEFAULTS;
  const down = d.downPayments.find((x) => x.id === d.defaultDownPaymentId)!;
  return monthlyPayment(d.propertyValue * (1 - down.pct / 100), d.defaultRate, d.defaultYears);
}
