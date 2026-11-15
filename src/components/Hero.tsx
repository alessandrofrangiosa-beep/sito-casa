import Image from "next/image";
import { MapPin } from "lucide-react";
import { PROPERTY } from "@/config/site";
import { quickFacts } from "@/data/composition";
import { PROPERTY_FINANCE_CONFIG as C, defaultMonthlyPayment, formatEuro, formatEuroCents, heroSavings } from "@/lib/mortgage";


const S = heroSavings();
const floorTo = (n: number, step: number) => Math.floor(n / step) * step;
const SAVINGS = [
  {
    value: formatEuro(S.immediate),
    short: "risparmiati subito",
    detail: `${formatEuro(C.condoWorksPaid)} di lavori condominiali (facciate e balconi) già saldati dal proprietario + ${formatEuro(C.agencyFeeMin)}–${formatEuro(C.agencyFeeMax).replace("€\u00a0", "")} di provvigioni d'agenzia azzerate.`,
  },
  {
    value: `~${formatEuro(Math.round(S.rogito / 100) * 100)}`,
    short: "tagliati al rogito",
    detail: `Solo ${formatEuroCents(S.notaryPrima.totale)} di imposte d'atto col prezzo-valore prima casa (−${formatEuro(S.notarySaving)}) e imposta sul mutuo allo 0,25% (−${formatEuro(S.mortgageTaxSaving)}).`,
  },
  {
    value: formatEuro(S.bonus),
    short: "bonus lavori + arredi",
    detail: `Recuperi il 50% di lavori e arredi visti nei render 3D (abitazione principale) e con la garanzia Consap eviti fino a ${formatEuro(C.standardDownPayment)} di anticipo.`,
  },
];

const LIFT = " con ascensore";
const hasLift = PROPERTY.floor.endsWith(LIFT);
const floorWithoutLift = hasLift ? PROPERTY.floor.slice(0, -LIFT.length) : PROPERTY.floor;

export function Hero() {
  return (
    <header className="relative pb-24 sm:pb-16">
      <div className="relative h-[19dvh] max-h-80 min-h-24 [@media(max-height:700px)]:h-[10.5dvh] [@media(max-height:700px)]:min-h-16 w-full overflow-hidden sm:h-[42dvh]">
        <Image
          src="/images/attuali/01-vista-mare-golfo.jpg"
          alt="Vista sul Golfo di Napoli dal 6° piano di Via Vittorio Veneto 390"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_45%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-transparent to-white/70" />
      </div>

      <div className="relative mx-auto -mt-10 max-w-5xl px-4">
        <div className="rounded-2xl border border-line bg-card p-5 shadow-soft max-[340px]:p-4 sm:p-8">
          <h1 className="text-[1.45rem] max-[340px]:text-[1.25rem] font-bold leading-[1.2] tracking-tight sm:text-[2.6rem] sm:leading-[1.15]">
            Quadrilocale 144 m² Vista Mare con 2&nbsp;Balconi e Garage Privato
          </h1>
          <p className="mt-2 flex items-start gap-1.5 text-[15px] text-slate-ink max-[340px]:text-[13px] sm:text-base">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              {PROPERTY.address}, {PROPERTY.city} • {floorWithoutLift}
              {hasLift && (
                <>
                  {" "}
                  {/* "con ascensore" messo in risalto: è un plus importante per un 6° piano */}
                  <strong className="whitespace-nowrap font-semibold text-primary">con ascensore</strong>
                </>
              )}
            </span>
          </p>

          <div className="mt-3 border-t border-line pt-3 sm:mt-4 sm:pt-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <p className="text-[2rem] max-[340px]:text-[1.7rem] font-extrabold leading-none tracking-tight text-ink tabular-nums sm:text-5xl">
                {PROPERTY.apartmentPrice}
              </p>
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary-soft px-2.5 py-0.5 text-[13px] font-semibold text-primary sm:text-sm">
                Trattabile
              </span>
            </div>
            <p className="mt-1.5 text-[14.5px] leading-snug text-slate-ink max-[340px]:text-[12.5px] sm:text-base">
              <strong className="font-semibold text-ink tabular-nums">+ {PROPERTY.garagePrice}</strong> garage privato{" "}
              <span className="whitespace-nowrap">
                (vendita in blocco: <span className="tabular-nums">{PROPERTY.price}</span> {PROPERTY.priceNote})
              </span>
            </p>
            <a
              href="#simula-mutuo"
              className="mt-2 inline-block rounded-2xl border border-primary/20 bg-card px-3 py-1.5 text-[13.5px] font-medium leading-snug text-slate-ink transition hover:border-primary/50 max-[340px]:text-[12px] sm:text-sm"
            >
              Oppure con mutuo: rata stimata da{" "}
              <strong className="whitespace-nowrap font-semibold text-ink tabular-nums">~ {formatEuro(defaultMonthlyPayment())}/mese</strong>{" "}
              <span className="whitespace-nowrap font-semibold text-primary">→ Simula</span>
            </a>
            {/* Vantaggio economico reale: 3 metriche (cifre calcolate dagli stessi parametri del calcolatore mutuo) */}
            <div className="mt-2 rounded-xl border border-sage/30 bg-sage-soft px-3 py-2.5 max-[340px]:px-2.5 sm:p-4 [@media(max-height:700px)]:py-2">
              <p className="flex items-baseline justify-between gap-2 text-[13.5px] leading-snug font-bold text-ink max-[340px]:text-[12.5px] sm:block sm:text-base">
                <span className="sm:hidden">
                  Vantaggio reale: <span className="text-sage">oltre {formatEuro(floorTo(S.total, 5_000))}</span> di risparmi
                </span>
                {/* Schermi bassi (es. iPhone SE): il link sta accanto al titolo per lasciare visibile la barra delle caratteristiche */}
                <a
                  href="#simula-mutuo"
                  className="hidden shrink-0 text-xs font-semibold whitespace-nowrap text-primary [@media(max-height:700px)]:max-sm:inline"
                >
                  Dettaglio ↓
                </a>
                <span className="hidden sm:inline">
                  Vantaggio economico reale per chi acquista:{" "}
                  <span className="text-sage">oltre {formatEuro(floorTo(S.total, 5_000))}</span> di risparmi tra atto, lavori già
                  pagati e bonus
                </span>
              </p>
              <ul className="mt-2 grid grid-cols-3 gap-2 sm:mt-3 sm:gap-4">
                {SAVINGS.map((it) => (
                  <li key={it.short} className="min-w-0">
                    <strong className="block text-[15px] leading-tight font-extrabold whitespace-nowrap text-sage tabular-nums max-[340px]:text-[13.5px] sm:text-xl">
                      {it.value}
                    </strong>
                    <span className="mt-0.5 block text-[11.5px] leading-snug font-semibold text-ink max-[340px]:text-[10.5px] sm:text-sm">
                      {it.short}
                    </span>
                    <span className="mt-1 hidden text-xs leading-snug text-slate-ink sm:block">{it.detail}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-1.5 text-right sm:mt-2 [@media(max-height:700px)]:max-sm:hidden">
                <a href="#simula-mutuo" className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline sm:text-sm">
                  Vedi il dettaglio di tutti i risparmi ↓
                </a>
              </div>
            </div>
          </div>

          <dl className="mt-3 grid grid-cols-5 divide-x divide-line rounded-xl border border-line bg-ice">
            {quickFacts.map((f, i) => (
              <div key={f.label} className="flex min-w-0 flex-col-reverse items-center justify-center px-1 py-2 text-center">
                <dt className={`mt-0.5 text-[11.5px] font-medium leading-tight text-slate-ink max-[340px]:text-[9.5px] sm:text-sm ${f.label.includes("+") ? "" : "truncate"}`}>{f.label}</dt>
                <dd className="whitespace-nowrap text-[16px] max-[340px]:text-[13.5px] font-bold leading-none text-ink tabular-nums sm:text-xl">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </header>
  );
}
