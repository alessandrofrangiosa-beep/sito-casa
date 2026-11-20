import { Check } from "lucide-react";
import { FIBER } from "@/data/highlights";
import { PROPERTY } from "@/config/site";
import { SectionTitle } from "./SectionTitle";

/** Dotazioni già presenti: bullet brevissimi, inizio in grassetto per una lettura veloce su smartphone */
const ITEMS: { bold: string; rest?: string }[] = [
  { bold: "Casa già sgomberata:", rest: " libera subito, né attese né spese per lo sgombero." },
  { bold: "Ascensore", rest: " disponibile." },
  {
    bold: "Silenzio e privacy",
    rest: " al 6°\u00a0piano: nessun rumore dalla strada e nessuna finestra adiacente, con vista aperta.",
  },
  { bold: `${FIBER.title}.` },
  { bold: "Riscaldamento centralizzato." },
  { bold: "Soffitti alti." },
  {
    bold: "Spese mensili:",
    rest: ` condominio ${PROPERTY.monthlyCosts.condominio}, box auto ${PROPERTY.monthlyCosts.box}, riscaldamento ${PROPERTY.monthlyCosts.riscaldamento}.`,
  },
  {
    bold: "Doppia esposizione Sud-Ovest:",
    rest: " luce diretta dal lato Est e affaccio aperto sul lato Nord. Ottima luminosità naturale al mattino, ventilazione su due lati e freschezza d'estate",
  },
];

export function Opportunity() {
  return (
    <section id="opportunita" className="mx-auto max-w-5xl scroll-mt-4 px-4">
      <SectionTitle
        eyebrow="Il potenziale"
        title="Già presente nell'appartamento"
      />

      <article className="rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-6">
        <ul className="space-y-4">
          {ITEMS.map((t) => (
            <li key={t.bold} className="flex gap-3 px-1 text-base leading-snug text-ink sm:text-lg">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
              </span>
              <span className="min-w-0">
                <strong className="font-semibold">{t.bold}</strong>
                {t.rest}
              </span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
