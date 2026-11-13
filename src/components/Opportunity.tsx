import { Calculator, Check, Hammer, HardHat, Paintbrush, PiggyBank } from "lucide-react";
import { PRICE_BREAKDOWN, PROPERTY } from "@/config/site";
import { SectionTitle } from "./SectionTitle";

const ALREADY_DONE = [
  "Infissi bianchi con vetrocamera già sostituiti",
  "Pavimenti in buono stato: graniglia nera nel salone, alla veneziana nelle camere",
  "Bagno completo con vasca e sanitari",
  "Riscaldamento con termosifoni e caldaia già installati",
  "Ingresso e corridoio già tinteggiati di bianco",
  "Soffitti alti che donano ampiezza, respiro e possibilità di controsoffitti con faretti LED",
  "Vista mare aperta e non ostruibile dal 6° piano: soleggiamento naturale tutto il giorno con risparmio energetico reale e brezza marina sulle 3 terrazze",
  "Copertura Fibra fino a 200 Mega: connessione veloce e stabile ideale per lavorare in smart working vista Golfo, videochiamate e streaming 4K.",
];

const TODO = [
  "Rinfrescare le pareti con i tuoi colori preferiti",
  "Scegliere e portare i tuoi arredi",
  "Goderti subito la vista mare e le 3 terrazze",
];

const euro = (n: number) => `€\u00a0${new Intl.NumberFormat("it-IT", { useGrouping: "always" }).format(n)}`;

/** Scomposizione del prezzo: netto e €/m² calcolati dai valori in PRICE_BREAKDOWN */
function PriceBreakdown() {
  const { askingPrice, deductions } = PRICE_BREAKDOWN;
  const net = askingPrice - deductions.reduce((sum, d) => sum + d.amount, 0);
  const perSqm = Math.round(net / PROPERTY.sqm);

  return (
    <article className="mt-3 rounded-2xl border border-line bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <Calculator className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Calcolo trasparente</p>
          <h3 className="text-lg font-bold leading-tight sm:text-xl">Quanto paghi davvero l&apos;appartamento</h3>
        </div>
      </div>

      <dl className="mt-4 divide-y divide-line text-[15px]">
        <div className="flex items-start justify-between gap-4 pb-3">
          <dt className="min-w-0">
            <span className="font-semibold text-ink">Prezzo appartamento</span>
            <span className="block text-[13px] leading-snug text-slate-ink">Quadrilocale 144 m² + 3 terrazze</span>
          </dt>
          <dd className="whitespace-nowrap font-bold text-ink tabular-nums">{euro(askingPrice)}</dd>
        </div>
        {deductions.map((d) => (
          <div key={d.label} className="flex items-start justify-between gap-4 py-3">
            <dt className="min-w-0 leading-snug text-slate-ink">{d.label}</dt>
            <dd className="whitespace-nowrap font-semibold text-primary tabular-nums">−&nbsp;{euro(d.amount)}</dd>
          </div>
        ))}
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-t-2 border-ink/80 pt-3">
          <dt className="min-w-0 font-semibold leading-snug text-ink">= Costo netto reale dei 144 m² vista mare</dt>
          <dd className="text-right">
            <span className="block whitespace-nowrap text-2xl font-extrabold tracking-tight text-ink tabular-nums">~&nbsp;{euro(net)}</span>
            <span className="mt-1 inline-block rounded-full border border-primary/20 bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary tabular-nums">
              appena {new Intl.NumberFormat("it-IT", { useGrouping: "always" }).format(perSqm)}&nbsp;€/m²
            </span>
          </dd>
        </div>
      </dl>

      <p className="mt-4 rounded-xl bg-ink px-4 py-3 text-[15px] font-semibold leading-snug text-white">
        Stai bloccando oggi a prezzo pre-restauro un immobile in uno stabile con facciate appena rifatte e nessuna
        spesa straordinaria prevista per facciate e balconi.
      </p>
      <p className="mt-2 text-xs leading-snug text-slate-ink">
        Il garage privato da {PROPERTY.garagePrice} completa l&apos;operazione a {PROPERTY.price} {PROPERTY.priceNote}{" "}
        (vendita in blocco). Valori indicativi a scopo di confronto.
      </p>
    </article>
  );
}

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

      <PriceBreakdown />

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
          <div className="mt-4 rounded-xl border border-primary/25 bg-card p-3.5">
            <p className="flex items-center gap-2 text-sm font-bold text-primary">
              <HardHat className="h-4 w-4 shrink-0" aria-hidden /> Bonus tempi e costi: ditta già attiva nello stabile
            </p>
            <p className="mt-1.5 text-[13.5px] leading-snug text-ink">
              L&apos;impresa incaricata dal condominio per le facciate è già sul posto: su richiesta e senza alcun vincolo
              ricevi il contatto diretto della squadra, per tinteggiare e personalizzare gli interni subito dopo il rogito.
              Zero tempi di attesa e costi di uscita cantiere ridotti al minimo.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
