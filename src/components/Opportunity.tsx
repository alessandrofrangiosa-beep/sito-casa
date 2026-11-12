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

const TODO = ["Rimuovere la vecchia carta da parati", "Tinteggiare", "Arredare a tuo gusto"];

export function Opportunity() {
  return (
    <section id="opportunita" className="mx-auto max-w-5xl scroll-mt-4 px-4">
      <SectionTitle
        eyebrow="Il potenziale"
        title={<>Perché è un&apos;opportunità concreta</>}
        intro="Volumi ampi e regolari, tanta luce e la vista sul Golfo: la parte difficile (e costosa) è già fatta. A te resta la parte bella."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-3xl border border-emerald-brand/25 bg-emerald-soft p-5">
          <PiggyBank className="h-7 w-7 text-emerald-brand" />
          <p className="mt-3 font-serif text-3xl font-bold text-emerald-brand">{PROPERTY.agencySavings}</p>
          <p className="mt-1 font-semibold text-ink">di provvigioni d&apos;agenzia risparmiate</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-ink">
            Vendita diretta dal proprietario: 0% commissioni, trattativa trasparente e un unico interlocutore.
          </p>
        </article>
        <article className="rounded-3xl border border-emerald-brand/25 bg-emerald-soft p-5">
          <Hammer className="h-7 w-7 text-emerald-brand" />
          <p className="mt-3 font-serif text-3xl font-bold text-emerald-brand">{PROPERTY.condoWorksPaid}</p>
          <p className="mt-1 font-semibold text-ink">di lavori condominiali già pagati</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-ink">
            Lavori straordinari su facciate e balconi deliberati e saldati dal proprietario: il ponteggio visibile in foto
            è in fase di ultimazione.
          </p>
        </article>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
        <article className="rounded-3xl border border-line bg-card p-5 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-wider text-gulf">Già presente</p>
          <ul className="mt-3 space-y-2.5">
            {ALREADY_DONE.map((t) => (
              <li key={t} className="flex gap-2.5 text-[15px] leading-snug text-ink">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-brand" strokeWidth={3} />
                {t}
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-3xl border border-terra/30 bg-terra-soft p-5">
          <Paintbrush className="h-6 w-6 text-terra" />
          <p className="mt-2 text-sm font-bold uppercase tracking-wider text-gulf">Ti resta solo</p>
          <ol className="mt-3 space-y-2">
            {TODO.map((t, i) => (
              <li key={t} className="flex items-center gap-2.5 text-[15px] font-semibold text-ink">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-terra text-xs text-white">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-slate-ink">Infissi e riscaldamento ci sono già: è una tela bianca da personalizzare.</p>
        </article>
      </div>
    </section>
  );
}
