import Image from "next/image";
import { MapPin } from "lucide-react";
import { PROPERTY } from "@/config/site";

const FACTS = [
  { k: `${PROPERTY.sqm} m²`, v: "superficie" },
  { k: "3", v: "terrazze" },
  { k: "2", v: "bagni" },
  { k: "1", v: "garage" },
];

function SoftBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
      {children}
    </span>
  );
}

export function Hero() {
  return (
    <header className="relative pb-24 sm:pb-16">
      <div className="relative h-[24dvh] max-h-80 min-h-28 w-full overflow-hidden sm:h-[42dvh]">
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
          <SoftBadge>Vendita da Privato • 0% Commissioni d&apos;Agenzia</SoftBadge>
          <h1 className="mt-3 text-[1.55rem] max-[340px]:text-[1.3rem] font-bold leading-[1.2] tracking-tight sm:text-[2.6rem] sm:leading-[1.15]">
            120 m² Vista Mare con 3 Terrazze e Garage Privato
          </h1>
          <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-ink sm:text-base">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              {PROPERTY.address}, {PROPERTY.city} • {PROPERTY.floor}
            </span>
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-4">
            <p className="flex items-baseline gap-2">
              <span className="text-[2rem] font-extrabold leading-none tracking-tight text-ink tabular-nums sm:text-5xl">
                {PROPERTY.price}
              </span>
              <span className="text-sm font-medium text-slate-ink">{PROPERTY.priceNote}</span>
            </p>
            <SoftBadge>
              Risparmi <span className="mx-1 tabular-nums">{PROPERTY.agencySavings}</span> di provvigioni
            </SoftBadge>
          </div>

          <dl className="mt-4 grid grid-cols-4 divide-x divide-line rounded-xl border border-line bg-ice">
            {FACTS.map((f) => (
              <div key={f.v} className="flex flex-col-reverse items-center px-1 py-2.5 text-center">
                <dt className="mt-0.5 text-[11px] font-medium text-slate-ink sm:text-xs">{f.v}</dt>
                <dd className="whitespace-nowrap text-base font-bold leading-none text-ink tabular-nums sm:text-xl">{f.k}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </header>
  );
}
