import Image from "next/image";
import { Check, MapPin } from "lucide-react";
import { PROPERTY } from "@/config/site";
import { quickFacts } from "@/data/composition";
import { defaultMonthlyPayment, formatEuro } from "@/lib/mortgage";


export function Hero() {
  return (
    <header className="relative pb-24 sm:pb-16">
      <div className="relative h-[19dvh] max-h-80 min-h-24 [@media(max-height:700px)]:h-[13dvh] [@media(max-height:700px)]:min-h-16 w-full overflow-hidden sm:h-[42dvh]">
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
            Quadrilocale 144 m² Vista Mare con Terrazza, 2&nbsp;Balconi e Garage Privato
          </h1>
          <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-ink max-[340px]:text-[12.5px] sm:text-base">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              {PROPERTY.address}, {PROPERTY.city} • {PROPERTY.floor}
            </span>
          </p>

          <div className="mt-3 border-t border-line pt-3 sm:mt-4 sm:pt-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <p className="text-[2rem] max-[340px]:text-[1.7rem] font-extrabold leading-none tracking-tight text-ink tabular-nums sm:text-5xl">
                {PROPERTY.apartmentPrice}
              </p>
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary sm:text-sm">
                Trattabile
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-snug text-slate-ink max-[340px]:text-[12px] sm:text-sm">
              <strong className="font-semibold text-ink tabular-nums">+ {PROPERTY.garagePrice}</strong> garage privato{" "}
              <span className="whitespace-nowrap">
                (vendita in blocco: <span className="tabular-nums">{PROPERTY.price}</span> {PROPERTY.priceNote})
              </span>
            </p>
            <a
              href="#simula-mutuo"
              className="mt-2 inline-block rounded-2xl border border-primary/20 bg-card px-3 py-1.5 text-xs font-medium leading-snug text-slate-ink transition hover:border-primary/50 max-[340px]:text-[11px]"
            >
              Oppure con mutuo: rata stimata da{" "}
              <strong className="whitespace-nowrap font-semibold text-ink tabular-nums">~ {formatEuro(defaultMonthlyPayment())}/mese</strong>{" "}
              <span className="whitespace-nowrap font-semibold text-primary">→ Simula</span>
            </a>
            <ul className="mt-2 space-y-0.5 rounded-xl border border-primary/20 bg-primary-soft px-3 py-2 text-[13px] leading-snug text-primary max-[340px]:px-2.5 max-[340px]:text-[11.5px] sm:text-sm">
              <li className="flex gap-1.5">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={3} aria-hidden />
                <span>
                  Risparmi <strong className="font-semibold tabular-nums">{PROPERTY.agencySavings}</strong> di provvigioni d&apos;agenzia
                </span>
              </li>
              <li className="flex gap-1.5">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={3} aria-hidden />
                <span>
                  <strong className="font-semibold tabular-nums">{PROPERTY.condoWorksPaid}</strong> di lavori su facciate, balconi e migliorie già pagati dal proprietario
                </span>
              </li>
            </ul>
          </div>

          <dl className="mt-3 grid grid-cols-[0.95fr_1.15fr_0.9fr_1.4fr_0.9fr] max-[340px]:grid-cols-[0.95fr_1.2fr_0.85fr_1.5fr_0.85fr] divide-x divide-line rounded-xl border border-line bg-ice">
            {quickFacts.map((f, i) => (
              <div key={f.label} className="flex min-w-0 flex-col-reverse items-center justify-center px-1 py-2 text-center">
                <dt className={`mt-0.5 text-[10.5px] font-medium leading-tight text-slate-ink max-[340px]:text-[9px] sm:text-xs ${f.label.includes("+") ? "" : "truncate"}`}>{f.label}</dt>
                <dd className="whitespace-nowrap text-[15px] max-[340px]:text-[13px] font-bold leading-none text-ink tabular-nums sm:text-xl">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </header>
  );
}
