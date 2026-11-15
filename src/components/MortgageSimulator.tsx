"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, ChevronDown, Hammer, Landmark, PiggyBank, ShieldCheck } from "lucide-react";
import { PROPERTY } from "@/config/site";
import {
  PROPERTY_FINANCE_CONFIG as C,
  estimatedFixedRate,
  firstYearInterest,
  formatEuro,
  formatEuroCents,
  monthlyPayment,
  notaryTaxes,
} from "@/lib/mortgage";
import { SectionTitle } from "./SectionTitle";

const pct = (n: number, digits = 2) => `${n.toFixed(digits).replace(".", ",")}%`;

/** Interruttore accessibile (role="switch") */
function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-sage" : "bg-line"}`}
    >
      <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-sand-line bg-card px-4 py-3 open:shadow-soft">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-[15px] font-semibold leading-snug text-ink [&::-webkit-details-marker]:hidden">
        {q}
        <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-slate-ink transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-ink">{children}</div>
    </details>
  );
}

export function MortgageSimulator() {
  const [down, setDown] = useState<number>(C.defaultDownPayment);
  const [years, setYears] = useState<number>(C.defaultYears);
  const [consap80, setConsap80] = useState(false);
  const [rendita, setRendita] = useState<number>(C.defaultRenditaCatastale);
  const [works, setWorks] = useState<number>(C.defaultRenovationBudget);

  const m = useMemo(() => {
    const loan = Math.max(0, C.propertyPrice - down);
    const ltv = (loan / C.propertyPrice) * 100;
    const rate = estimatedFixedRate(ltv);
    const rata = monthlyPayment(loan, rate, years);
    const interest1 = firstYearInterest(loan, rate, years);
    const irpef = Math.min(interest1, C.irpefInterestCap) * C.irpefInterestRate;
    return {
      loan,
      ltv,
      rate,
      rata,
      irpef,
      sostitutiva: loan * C.sostitutivaPrimaCasa,
      sostitutivaOrd: loan * C.sostitutivaOrdinaria,
    };
  }, [down, years]);

  const tax = useMemo(() => {
    const prima = notaryTaxes(rendita, true);
    const seconda = notaryTaxes(rendita, false);
    const sulPrezzo = C.propertyPrice * C.registroSecondaCasa;
    return { prima, seconda, sulPrezzo };
  }, [rendita]);

  const bonus = useMemo(() => {
    const spend = Math.min(works, C.renovationMaxSpend);
    const lavori = spend * C.renovationBonusRate;
    const mobili = C.furnitureMaxSpend * C.furnitureBonusRate;
    return { lavori, perYear: lavori / C.renovationYears, mobili, netto: works - lavori };
  }, [works]);

  const overStandardLtv = m.ltv > C.standardMaxLtv;
  const liquidity = Math.max(0, C.standardDownPayment - down);

  return (
    <section id="simula-mutuo" className="mx-auto max-w-5xl scroll-mt-4 px-4">
      <SectionTitle
        eyebrow="Mutuo e agevolazioni prima casa"
        title="Una rata alla portata, poche tasse al rogito"
        intro="Comprando da privato come prima casa paghi le imposte sul valore catastale, non sul prezzo, e con la garanzia statale Consap puoi finanziare fino al 100%: i tuoi risparmi restano per i lavori che vedi nei render 3D."
      />

      {/* 1. Calcolatore */}
      <div className="grid gap-4 md:grid-cols-[1.1fr_1fr] md:items-start">
        <div className="space-y-5 rounded-2xl border border-line bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3 rounded-xl bg-sand px-4 py-3">
            <span className="pt-0.5 text-sm font-semibold text-ink">Prezzo immobile</span>
            <span className="text-right">
              <span className="block text-lg font-bold text-ink tabular-nums">{formatEuro(C.propertyPrice)}</span>
              <span className="block text-xs text-slate-ink tabular-nums">
                appartamento {PROPERTY.apartmentPrice} + garage {PROPERTY.garagePrice}
              </span>
            </span>
          </div>

          {/* Requisiti Consap 80% */}
          <div className="rounded-xl border border-line p-3.5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-ink">Ho meno di 36 anni o rientro nei requisiti Consap 80%</p>
                <p className="mt-0.5 text-xs leading-snug text-slate-ink">
                  Giovani coppie, genitori soli con figli minori, famiglie numerose, persone con disabilità · ISEE fino a € 40.000
                </p>
              </div>
              <Toggle on={consap80} onChange={setConsap80} label="Requisiti Consap 80%" />
            </div>
            {consap80 && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-3 py-1.5 text-xs font-semibold text-sage">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Garanzia statale 80% attiva · mutuo fino al 100% disponibile
              </p>
            )}
          </div>

          {/* Anticipo */}
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <label htmlFor="anticipo" className="text-sm font-semibold text-ink">
                Anticipo disponibile
              </label>
              <span className="text-lg font-bold text-primary tabular-nums">{formatEuro(down)}</span>
            </div>
            <input
              id="anticipo"
              type="range"
              min={C.downPaymentMin}
              max={C.downPaymentMax}
              step={C.downPaymentStep}
              value={down}
              onChange={(e) => setDown(Number(e.target.value))}
              aria-valuetext={`${formatEuro(down)}, mutuo ${formatEuro(m.loan)}`}
              className="h-2 w-full cursor-pointer accent-[#0E6BA8]"
            />
            <div className="mt-1 flex justify-between text-xs whitespace-nowrap text-slate-ink tabular-nums">
              <span>{formatEuro(C.downPaymentMin)}</span>
              <span>{formatEuro(C.downPaymentMax)}</span>
            </div>
            <p className="mt-2 rounded-lg bg-ice px-3 py-2 text-sm text-ink tabular-nums">
              Mutuo <strong className="font-semibold">{formatEuro(m.loan)}</strong>
              <span className="text-slate-ink"> · LTV {pct(m.ltv, 0)} del prezzo</span>
            </p>
          </div>

          {/* Durata */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink">Durata</legend>
            <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-line bg-ice p-1">
              {C.years.map((y) => (
                <button
                  key={y}
                  type="button"
                  aria-pressed={y === years}
                  onClick={() => setYears(y)}
                  className={`rounded-lg py-2.5 text-sm font-semibold tabular-nums transition ${
                    y === years ? "bg-primary text-white shadow-soft" : "text-slate-ink hover:bg-card"
                  }`}
                >
                  {y} anni
                </button>
              ))}
            </div>
          </fieldset>

          {overStandardLtv && (
            <p
              className={`rounded-xl px-3.5 py-3 text-xs leading-snug ${
                consap80 ? "bg-sage-soft text-sage" : "bg-terracotta-soft text-terracotta"
              }`}
              role="status"
            >
              {consap80
                ? "Oltre l'80% del prezzo il mutuo è coperto dalla garanzia statale all'80%: le banche aderenti possono finanziare fino al 100%."
                : "Oltre l'80% del prezzo le banche chiedono di norma la garanzia Consap: per tutti gli acquirenti prima casa copre il 50% (senza limiti di età o ISEE), con i requisiti qui sopra arriva all'80%."}
            </p>
          )}
        </div>

        {/* Risultato */}
        <div className="space-y-3 md:sticky md:top-4">
          <div className="rounded-2xl bg-ink p-5 text-white shadow-soft" aria-live="polite">
            <p className="text-xs font-semibold tracking-[0.16em] text-white/60 uppercase">Rata mensile stimata</p>
            <p className="mt-1 text-[2.6rem] leading-none font-extrabold tracking-tight tabular-nums">
              {formatEuro(m.rata)}
              <span className="ml-1 text-base font-semibold text-white/70">/mese</span>
            </p>
            <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-white/15 pt-4 text-sm">
              <div>
                <dt className="text-xs text-white/60">Capitale finanziato</dt>
                <dd className="font-semibold tabular-nums">{formatEuro(m.loan)}</dd>
              </div>
              <div>
                <dt className="text-xs text-white/60">Tasso fisso stimato</dt>
                <dd className="font-semibold tabular-nums">{pct(m.rate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-white/60">Durata</dt>
                <dd className="font-semibold tabular-nums">{years} anni</dd>
              </div>
            </dl>
            <dl className="mt-4 space-y-2.5 border-t border-white/15 pt-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-white/80">
                  Imposta sostitutiva prima casa (0,25%)
                  <span className="block text-xs text-white/55">invece di {formatEuro(m.sostitutivaOrd)} al 2% ordinario</span>
                </dt>
                <dd className="font-semibold whitespace-nowrap tabular-nums">{formatEuro(m.sostitutiva)}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-white/80">
                  Detrazione IRPEF interessi (19%)
                  <span className="block text-xs text-white/55">fino a € 760 l&apos;anno nel 730</span>
                </dt>
                <dd className="font-semibold whitespace-nowrap text-[#b9d3b5] tabular-nums">−{formatEuro(m.irpef)}/anno</dd>
              </div>
            </dl>
          </div>
          <p className="px-1 text-xs leading-snug text-slate-ink">
            Tasso fisso medio di novembre 2026: {pct(C.fixedRateLtvUpTo80)} fino all&apos;80% del prezzo, circa{" "}
            {pct(C.fixedRateLtvOver80)} oltre l&apos;80% con garanzia Consap. Il variabile medio è intorno al 2,75–2,85%.
          </p>
        </div>
      </div>

      {/* 2. Perché si risparmia */}
      <h3 className="mt-10 text-xl font-bold leading-tight text-ink sm:text-2xl">
        Perché comprare questa casa ti fa risparmiare migliaia di euro
      </h3>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {/* Card 1: prezzo-valore */}
        <article className="flex flex-col rounded-2xl border border-sand-line bg-sand p-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-terracotta-soft text-terracotta">
            <Landmark className="h-5 w-5" aria-hidden />
          </span>
          <h4 className="mt-3 text-base font-bold leading-snug text-ink">Tasse al rogito abbattute col prezzo-valore</h4>
          <p className="mt-2 text-[1.7rem] leading-none font-extrabold text-sage tabular-nums">{formatEuroCents(tax.prima.totale)}</p>
          <p className="mt-1.5 text-sm leading-snug text-slate-ink">
            invece di <strong className="text-ink tabular-nums">{formatEuro(tax.seconda.totale)}</strong> come seconda casa, o{" "}
            <strong className="text-ink tabular-nums">{formatEuro(tax.sulPrezzo)}</strong> se il 9% si pagasse sul prezzo pieno.
          </p>
          <label className="mt-auto flex items-center justify-between gap-2 border-t border-sand-line pt-3 text-xs text-slate-ink">
            Rendita catastale (dalla visura)
            <span className="flex items-center gap-1 font-semibold text-ink">
              €
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step={10}
                value={rendita}
                onChange={(e) => setRendita(Math.max(0, Number(e.target.value) || 0))}
                className="w-20 rounded-lg border border-sand-line bg-card px-2 py-1 text-right text-sm tabular-nums"
              />
            </span>
          </label>
        </article>

        {/* Card 2: liquidità con Consap */}
        <article className="flex flex-col rounded-2xl border border-sand-line bg-sand p-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sage-soft text-sage">
            <PiggyBank className="h-5 w-5" aria-hidden />
          </span>
          <h4 className="mt-3 text-base font-bold leading-snug text-ink">Liquidità salvata grazie a Consap</h4>
          <p className="mt-2 text-[1.7rem] leading-none font-extrabold text-sage tabular-nums">
            {liquidity > 0 ? formatEuro(liquidity) : `fino a ${formatEuro(C.standardDownPayment)}`}
          </p>
          <p className="mt-1.5 text-sm leading-snug text-slate-ink">
            {liquidity >= C.standardDownPayment
              ? `Con il mutuo al 100% non versi il classico anticipo del 20%: tieni questi risparmi per ristrutturare e arredare come nei nostri render 3D.`
              : liquidity > 0
                ? `Rispetto al classico anticipo del 20% (${formatEuro(C.standardDownPayment)}) ti restano in tasca ${formatEuro(liquidity)}: tienili per ristrutturare e arredare come nei nostri render 3D.`
                : `Con il mutuo fino al 100% non serve versare il classico 20% di anticipo: tieni i risparmi per ristrutturare e arredare come nei nostri render 3D.`}
          </p>
        </article>

        {/* Card 3: bonus ristrutturazione */}
        <article className="flex flex-col rounded-2xl border border-sand-line bg-sand p-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-terracotta-soft text-terracotta">
            <Hammer className="h-5 w-5" aria-hidden />
          </span>
          <h4 className="mt-3 text-base font-bold leading-snug text-ink">Bonus ristrutturazione 50% prima casa</h4>
          <p className="mt-2 text-[1.7rem] leading-none font-extrabold text-sage tabular-nums">{formatEuro(bonus.lavori)}</p>
          <p className="mt-1.5 text-sm leading-snug text-slate-ink">
            recuperati in 10 anni ({formatEuro(bonus.perYear)}/anno): i lavori ti costano davvero{" "}
            <strong className="text-ink tabular-nums">{formatEuro(bonus.netto)}</strong>. Più{" "}
            <strong className="text-ink tabular-nums">{formatEuro(bonus.mobili)}</strong> di bonus mobili.
          </p>
          <div className="mt-auto border-t border-sand-line pt-3">
            <div className="flex items-baseline justify-between gap-2 text-xs text-slate-ink">
              <label htmlFor="budget-lavori">Budget lavori come nei render</label>
              <span className="font-semibold text-ink tabular-nums">{formatEuro(works)}</span>
            </div>
            <input
              id="budget-lavori"
              type="range"
              min={0}
              max={C.renovationMaxSpend}
              step={2_000}
              value={works}
              onChange={(e) => setWorks(Number(e.target.value))}
              className="mt-1.5 h-2 w-full cursor-pointer accent-[#b0553a]"
            />
          </div>
        </article>
      </div>

      {/* 3. FAQ */}
      <h3 className="mt-10 text-xl font-bold leading-tight text-ink sm:text-2xl">Domande frequenti</h3>
      <div className="mt-4 space-y-2">
        <Faq q="Posso chiedere un mutuo per l'intero importo di € 250.000?">
          <p>
            Sì. Il prezzo rientra nel tetto di € 250.000 del Fondo di Garanzia Prima Casa (Consap). Se hai meno di 36 anni o
            sei in una delle categorie prioritarie (giovani coppie, genitori soli con figli minori, famiglie numerose, persone
            con disabilità) con ISEE fino a € 40.000, lo Stato garantisce l&apos;80% della quota capitale e le banche aderenti
            possono finanziare fino al 100%.
          </p>
          <p>
            Per tutti gli altri acquirenti prima casa la garanzia è al 50%, senza limiti di età o reddito. In ogni caso la
            concessione del mutuo resta una valutazione della banca.
          </p>
        </Faq>
        <Faq q="Perché pago solo ~€ 1.500 di imposta di registro su una casa da € 250.000?">
          <p>
            Comprando da un privato si applica il &laquo;prezzo-valore&raquo;: le imposte si calcolano sul valore catastale
            (rendita × 115,5 per la prima casa), non sul prezzo pagato.
          </p>
          <p>
            Con una rendita di {formatEuro(rendita)} il valore catastale è {formatEuroCents(tax.prima.valoreCatastale)}: il 2%
            fa {formatEuroCents(tax.prima.registro)}, più € 50 di imposta ipotecaria e € 50 di catastale. Totale{" "}
            {formatEuroCents(tax.prima.totale)}. Basta chiederlo al notaio nell&apos;atto.
          </p>
        </Faq>
        <Faq q="Come funzionano i bonus per rifare cucina, bagno e camere come nelle foto 3D?">
          <p>
            Per i lavori sull&apos;abitazione principale la detrazione IRPEF è del 50% fino a € 96.000 di spesa, recuperata in
            10 rate annuali nella dichiarazione dei redditi. Sui lavori l&apos;IVA è agevolata al 10%.
          </p>
          <p>
            Se ristrutturi puoi aggiungere il Bonus Mobili: 50% su massimo € 5.000 di mobili ed elettrodomestici. Servono
            pagamenti con bonifico &laquo;parlante&raquo; e, per alcuni interventi, la pratica edilizia. Le aliquote indicate
            valgono per le spese sostenute nel 2026 e nel 2027, grazie alla proroga.
          </p>
        </Faq>
      </div>

      <div className="mt-6 space-y-2 px-1">
        <a
          href="https://www.mutuionline.it"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover hover:underline"
        >
          <BadgeCheck className="h-4 w-4" aria-hidden /> Confronta i tassi aggiornati delle banche su MutuiOnline →
        </a>
        <p className="text-xs leading-snug text-slate-ink">
          Simulazione a scopo puramente illustrativo basata sulla normativa fiscale vigente 2026/2027 e su tassi medi di
          mercato: non costituisce offerta contrattuale né consulenza creditizia o fiscale. La concessione del mutuo e della
          garanzia Consap è soggetta a valutazione dell&apos;istituto bancario; detrazioni e bonus dipendono dalla tua
          situazione personale.
        </p>
      </div>
    </section>
  );
}
