import { Check, HardHat, Wifi } from "lucide-react";
import { BUILDER_BONUS, FIBER } from "@/data/highlights";
import { SectionTitle } from "./SectionTitle";

/** Dotazioni già presenti (la fibra è in testa, mostrata a parte) */
const ALREADY_DONE = [
  "Infissi bianchi con vetrocamera già sostituiti",
  "Pavimenti in buono stato: graniglia nera nel salone, alla veneziana nelle altre stanze",
  "Bagno completo con vasca e sanitari",
  "Riscaldamento con termosifoni e caldaia già installati",
  "Ingresso e corridoio già tinteggiati di bianco",
  "Soffitti alti che donano ampiezza, respiro e possibilità di controsoffitti con faretti LED",
  "Vista mare aperta e non ostruibile dal 6° piano: soleggiamento naturale tutto il giorno con risparmio energetico reale e brezza marina su terrazza e balconi",
];

export function Opportunity() {
  return (
    <section id="opportunita" className="mx-auto max-w-5xl scroll-mt-4 px-4">
      <SectionTitle
        eyebrow="Il potenziale"
        title="Già presente nell'appartamento"
        intro="Volumi ampi e regolari, tanta luce e la vista sul Golfo: la parte difficile (e costosa) è già fatta. A te resta la parte bella."
      />

      <article className="rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-6">
        <ul className="space-y-4">
          <li className="flex gap-3 rounded-xl border border-primary/20 bg-primary-soft p-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-white">
              <Wifi className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 text-base leading-snug text-ink sm:text-lg">
              <strong className="font-semibold">{FIBER.title}:</strong> {FIBER.text.charAt(0).toLowerCase() + FIBER.text.slice(1)}
            </span>
          </li>
          {ALREADY_DONE.map((t) => (
            <li key={t} className="flex gap-3 px-1 text-base leading-snug text-ink sm:text-lg">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </article>

      <aside className="mt-3 rounded-2xl border border-primary/20 bg-primary-soft p-5">
        <p className="flex items-center gap-2 text-base font-bold text-primary sm:text-lg">
          <HardHat className="h-5 w-5 shrink-0" aria-hidden /> {BUILDER_BONUS.title}
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-ink">{BUILDER_BONUS.text}</p>
      </aside>
    </section>
  );
}
