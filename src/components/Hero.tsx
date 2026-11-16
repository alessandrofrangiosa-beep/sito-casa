import Image from "next/image";
import { MapPin } from "lucide-react";
import { PROPERTY } from "@/config/site";
import { quickFacts } from "@/data/composition";
import { defaultMonthlyPayment, defaultNetMonthlyPayment, formatEuro } from "@/lib/mortgage";

const LIFT = " con ascensore";
const hasLift = PROPERTY.floor.endsWith(LIFT);
const floorWithoutLift = hasLift ? PROPERTY.floor.slice(0, -LIFT.length) : PROPERTY.floor;

export function Hero() {
  return (
    <header className="relative pb-24 sm:pb-16">
      <div className="relative h-[19dvh] max-h-80 min-h-24 w-full overflow-hidden sm:h-[42dvh]">
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
            Quadrilocale 140 m² Vista Mare con 2&nbsp;Balconi e Garage Privato
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
              {/* Badge esposizione: sui telefoni molto bassi (es. iPhone SE) lo spazio serve alla barra delle caratteristiche */}
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/70 bg-amber-50 px-2.5 py-0.5 text-[13px] font-semibold text-amber-800 sm:text-sm [@media(max-height:600px)]:max-sm:hidden">
                <span aria-hidden>☀️</span> Doppia esposizione Nord-Est
              </span>
            </div>
            <p className="mt-1.5 text-[14.5px] leading-snug text-slate-ink max-[340px]:text-[12.5px] sm:text-base">
              <strong className="font-semibold text-ink tabular-nums">+ {PROPERTY.garagePrice}</strong> garage privato{" "}
              <span className="whitespace-nowrap">
                (vendita in blocco: <span className="tabular-nums">{PROPERTY.price}</span> {PROPERTY.priceNote})
              </span>
            </p>
            {/* Card della rata media del mutuo (stessi parametri del calcolatore) con il link al dettaglio dei risparmi */}
            <div className="mt-2 rounded-xl border border-sage/30 bg-sage-soft px-3 py-2.5 max-[340px]:px-2.5 sm:p-4 [@media(max-height:700px)]:py-2">
              {/* Rata del mutuo: lorda e netta (dopo la detrazione IRPEF 19% sugli interessi) */}
              <a
                href="#simula-mutuo"
                className="mb-1.5 block text-[13.5px] leading-snug text-slate-ink max-[340px]:text-[12px] sm:mb-2 sm:text-base"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span>
                    {/* Schermi bassi (es. iPhone SE): rata lorda e netta sulla stessa riga */}
                    <span className="[@media(max-height:700px)]:max-sm:hidden">Rata mutuo prima casa:</span>
                    <span className="hidden [@media(max-height:700px)]:max-sm:inline">Rata mutuo:</span>{" "}
                    <strong className="font-bold whitespace-nowrap text-ink tabular-nums">~ {formatEuro(defaultMonthlyPayment())}/mese</strong>
                    <span className="hidden [@media(max-height:700px)]:max-sm:inline">
                      {" "}
                      · <strong className="font-bold whitespace-nowrap text-sage tabular-nums">~ {formatEuro(defaultNetMonthlyPayment())} netti</strong>
                    </span>
                  </span>
                </span>
                <span className="block [@media(max-height:700px)]:max-sm:hidden">
                  <strong className="font-bold whitespace-nowrap text-sage tabular-nums">~ {formatEuro(defaultNetMonthlyPayment())}/mese</strong>{" "}
                  netti con la detrazione IRPEF
                </span>
              </a>
              <div className="text-right">
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
