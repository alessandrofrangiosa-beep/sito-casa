"use client";

import { useMemo, useState } from "react";
import { PROPERTY } from "@/config/site";
import { MORTGAGE_DEFAULTS as D, formatEuro, monthlyPayment } from "@/lib/mortgage";
import { SectionTitle } from "./SectionTitle";

const pctFmt = (n: number) => `${n.toFixed(2).replace(".", ",")}%`;

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
      {children}
    </label>
  );
}

export function MortgageSimulator() {
  const [downId, setDownId] = useState(D.defaultDownPaymentId);
  const [years, setYears] = useState(D.defaultYears);
  const [rate, setRate] = useState(D.defaultRate);

  const down = D.downPayments.find((d) => d.id === downId)!;
  const downAmount = (D.propertyValue * down.pct) / 100;
  const loan = D.propertyValue - downAmount;
  const payment = useMemo(() => monthlyPayment(loan, rate, years), [loan, rate, years]);

  return (
    <section id="simula-mutuo" className="mx-auto max-w-5xl scroll-mt-4 px-4">
      <SectionTitle
        eyebrow="Mutuo"
        title="Simula la tua rata mutuo"
        intro="Scegli anticipo, durata e tasso: la rata si aggiorna subito."
      />

      <div className="grid gap-4 md:grid-cols-[1.15fr_1fr] md:items-start">
        <div className="space-y-5 rounded-2xl border border-line bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3 rounded-xl bg-ice px-4 py-3">
            <span className="pt-1 text-sm font-semibold text-ink">Prezzo immobile</span>
            <span className="text-right">
              <span className="block text-lg font-bold text-ink tabular-nums">{formatEuro(D.propertyValue)}</span>
              <span className="block text-xs text-slate-ink tabular-nums">
                appartamento {PROPERTY.apartmentPrice} + garage {PROPERTY.garagePrice}
              </span>
            </span>
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold text-ink">Anticipo</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {D.downPayments.map((d) => {
                const amount = (D.propertyValue * d.pct) / 100;
                const active = d.id === downId;
                return (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setDownId(d.id)}
                    className={`rounded-xl border px-3.5 py-2.5 text-left transition ${
                      active ? "border-primary bg-primary text-white" : "border-line bg-card text-ink hover:border-primary/40"
                    }`}
                  >
                    <span className="block text-sm font-semibold leading-snug">{d.label}</span>
                    <span className={`block text-xs leading-snug tabular-nums ${active ? "text-white/80" : "text-slate-ink"}`}>
                      {d.pct === 0
                        ? `mutuo ${formatEuro(D.propertyValue)}`
                        : `${formatEuro(amount)} anticipo → mutuo ${formatEuro(D.propertyValue - amount)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink">Durata</legend>
            <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-line bg-ice p-1">
              {D.years.map((y) => (
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

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <Label htmlFor="tasso-mutuo">Tasso fisso indicativo</Label>
              <span className="text-lg font-bold text-primary tabular-nums">{pctFmt(rate)}</span>
            </div>
            <input
              id="tasso-mutuo"
              type="range"
              min={D.rateMin}
              max={D.rateMax}
              step={D.rateStep}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              aria-valuetext={pctFmt(rate)}
              className="h-2 w-full cursor-pointer accent-[#0E6BA8]"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-ink tabular-nums">
              <span>{pctFmt(D.rateMin)}</span>
              <span>media di mercato {pctFmt(D.defaultRate)}</span>
              <span>{pctFmt(D.rateMax)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 md:sticky md:top-4">
          <div className="rounded-2xl bg-ink p-5 text-white shadow-soft" aria-live="polite">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Rata mensile stimata</p>
            <p className="mt-1 text-[2.6rem] font-extrabold leading-none tracking-tight tabular-nums">
              {formatEuro(payment)}
              <span className="ml-1 text-base font-semibold text-white/70">/mese</span>
            </p>
            <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-white/15 pt-4 text-sm">
              <div>
                <dt className="text-xs text-white/60">Mutuo richiesto</dt>
                <dd className="font-semibold tabular-nums">{formatEuro(loan)}</dd>
              </div>
              <div>
                <dt className="text-xs text-white/60">Durata</dt>
                <dd className="font-semibold tabular-nums">{years} anni</dd>
              </div>
              <div>
                <dt className="text-xs text-white/60">Tasso fisso</dt>
                <dd className="font-semibold tabular-nums">{pctFmt(rate)}</dd>
              </div>
            </dl>
          </div>

          <p className="rounded-xl border border-primary/20 bg-primary-soft px-4 py-3 text-[15px] leading-snug text-ink">
            Con una rata paragonabile a un affitto in zona, acquisti un quadrilocale vista mare di 120 m² con 3 terrazze e
            garage privato — con 0% di commissioni d&apos;agenzia da anticipare e documentazione già verificata per la
            banca.
          </p>

          <a
            href="https://www.mutuionline.it"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover hover:underline"
          >
            Confronta i tassi aggiornati delle banche su MutuiOnline →
          </a>

          <p className="text-xs leading-snug text-slate-ink">
            Simulazione puramente indicativa basata su tasso fisso medio di mercato: non costituisce offerta contrattuale né
            consulenza creditizia. Verifica le condizioni aggiornate presso il tuo istituto bancario.
          </p>
        </div>
      </div>
    </section>
  );
}
