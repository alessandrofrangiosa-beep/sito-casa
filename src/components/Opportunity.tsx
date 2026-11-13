import { Check, HardHat } from "lucide-react";
import { BUILDER_BONUS, FIBER } from "@/data/highlights";
import { SectionTitle } from "./SectionTitle";

/** Dotazioni già presenti: la fibra è il primo punto, con lo stesso stile degli altri */
const ALREADY_DONE = [
  "Infissi bianchi con vetrocamera già sostituiti",
  "Pavimenti in buono stato: graniglia nera nel salone, alla veneziana nelle altre stanze",
  "Bagno completo con vasca e sanitari",
  "Riscaldamento con termosifoni e caldaia già installati",
  "Ingresso e corridoio già tinteggiati di bianco",
  "Soffitti alti che donano ampiezza, respiro e possibilità di controsoffitti con faretti LED",
  "Vista mare aperta e non ostruibile dal 6° piano con soleggiamento naturale tutto il giorno",
];

const ITEMS = [`${FIBER.title}: ${FIBER.text}`, ...ALREADY_DONE];

export function Opportunity() {
  return (
    <section id="opportunita" className="mx-auto max-w-5xl scroll-mt-4 px-4">
      <SectionTitle
        eyebrow="Il potenziale"
        title="Già presente nell'appartamento"
        intro="Volumi ampi e regolari, tanta luce e la vista sul Golfo: la parte difficile (e costosa) è già fatta. A te resta la parte bella."
      />

      <aside className="flex gap-3.5 rounded-2xl bg-primary p-5 text-white shadow-soft">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-primary">
          <HardHat className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-base font-bold leading-snug sm:text-lg">{BUILDER_BONUS.title}</p>
          <p className="mt-1 text-[15px] leading-snug text-white/90">{BUILDER_BONUS.text}</p>
        </div>
      </aside>

      <article className="mt-3 rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-6">
        <ul className="space-y-4">
          {ITEMS.map((t) => (
            <li key={t} className="flex gap-3 px-1 text-base leading-snug text-ink sm:text-lg">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
