import { Hammer, PiggyBank, Paintbrush, Check } from "lucide-react";
import { PROPERTY } from "@/config/site";
import { SectionTitle } from "./SectionTitle";

const ALREADY_DONE = [
  "Infissi bianchi con vetrocamera già sostituiti",
  "Pavimenti in buono stato: graniglia nera nel salone, alla veneziana nelle camere",
  "Bagno completo con vasca e sanitari",
  "Riscaldamento con termosifoni e caldaia già installati",
  "Ingresso e corridoio già tinteggiati di bianco",
];

const TODO = [
  "Rinfrescare le pareti con i tuoi colori preferiti",
  "Scegliere e portare i tuoi arredi",
  "Goderti subito la vista mare e le 3 terrazze",
];

export function Opportunity() {
  return (
    <section id="opportunita" className="mx-auto max-w-5xl scroll-mt-4 px-4">
      <SectionTitle
        eyebrow="Il potenziale"
        title={<>Perché è un&apos;opportunità concreta</>}
        intro="Volumi ampi e regolari, tanta luce e la vista sul Golfo: la parte difficile (e costosa) è già fatta. A te resta la parte bella."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-primary/20 bg-primary-soft p-5">
          <PiggyBank className="h-7 w-7 text-primary" />
          <p className="mt-3 text-3xl font-bold tracking-tight text-primary tabular-nums">{PROPERTY.agencySavings}</p>
          <p className="mt-1 font-semibold text-ink">di provvigioni d&apos;agenzia risparmiate</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-ink">
            Vendita diretta dal proprietario: 0% commissioni, trattativa trasparente e un unico interlocutore.
          </p>
        </article>
        <article className="rounded-2xl border border-primary/20 bg-primary-soft p-5">
          <Hammer className="h-7 w-7 text-primary" />
          <p className="mt-3 text-3xl font-bold tracking-tight text-primary tabular-nums">{PROPERTY.condoWorksPaid}</p>
          <p className="mt-1 font-semibold text-ink">di lavori condominiali già pagati</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-ink">
            Lavori straordinari su facciate e balconi deliberati e saldati dal proprietario: il ponteggio visibile in foto
            è in fase di ultimazione.
          </p>
        </article>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-line bg-card p-5 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-wider text-ink">Già presente</p>
          <ul className="mt-3 space-y-2.5">
            {ALREADY_DONE.map((t) => (
              <li key={t} className="flex gap-2.5 text-[15px] leading-snug text-ink">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={3} />
                {t}
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-primary/20 bg-primary-soft p-5">
          <Paintbrush className="h-6 w-6 text-primary" />
          <p className="mt-2 text-sm font-bold uppercase tracking-wider text-ink">Zero opere murarie — ti resta solo:</p>
          <ol className="mt-3 space-y-2">
            {TODO.map((t, i) => (
              <li key={t} className="flex items-start gap-2.5 text-[15px] font-semibold leading-snug text-ink">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs text-white">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-slate-ink">Nessun lavoro strutturale o impianto da rifare: una tela bianca pronta in pochi giorni.</p>
        </article>
      </div>
    </section>
  );
}
