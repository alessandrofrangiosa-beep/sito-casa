import Image from "next/image";
import { MapPin } from "lucide-react";
import { PROPERTY } from "@/config/site";

const FACTS = [
  { k: "~120 m²", v: "superficie" },
  { k: "3", v: "terrazze" },
  { k: "2", v: "bagni" },
  { k: "Box", v: "auto privato" },
];

export function Hero() {
  return (
    <header className="relative">
      <div className="relative h-[40dvh] min-h-60 w-full overflow-hidden sm:h-[46dvh]">
        <Image
          src="/images/attuali/01-vista-mare-golfo.jpg"
          alt="Vista sul Golfo di Napoli dal 6° piano di Via Vittorio Veneto 390"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_45%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gulf/35 via-transparent to-sand" />
        <p className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-gulf backdrop-blur sm:left-6">
          Torre Annunziata · Vista Golfo
        </p>
      </div>

      <div className="relative mx-auto -mt-16 max-w-5xl px-4">
        <div className="rounded-3xl border border-line bg-card p-5 shadow-soft sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-brand px-3 py-1.5 text-xs font-bold text-white">
            ✓ Vendita da Privato • 0% Commissioni d&apos;Agenzia
          </span>
          <h1 className="mt-4 text-[1.7rem] font-semibold leading-[1.15] sm:text-5xl sm:leading-[1.1]">
            120 m² Panoramici Vista Mare con 3 Terrazze e Garage Privato{" "}
            <span className="italic text-terra">— La tua tela bianca in centro</span>
          </h1>
          <p className="mt-3 flex items-start gap-1.5 text-[15px] text-slate-ink sm:text-base">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-terra" />
            <span>
              {PROPERTY.address}, {PROPERTY.city} • {PROPERTY.floor}
            </span>
          </p>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-ink">Prezzo</p>
              <p className="font-serif text-4xl font-bold text-gulf sm:text-5xl">
                {PROPERTY.price} <span className="font-sans text-base font-semibold text-terra">{PROPERTY.priceNote}</span>
              </p>
            </div>
            <p className="rounded-xl bg-emerald-soft px-3 py-2 text-sm font-semibold text-emerald-brand">
              Risparmi {PROPERTY.agencySavings} di provvigioni
            </p>
          </div>

          <dl className="mt-5 grid grid-cols-4 gap-2">
            {FACTS.map((f) => (
              <div key={f.v} className="rounded-xl bg-sand px-2 py-2.5 text-center">
                <dt className="sr-only">{f.v}</dt>
                <dd className="whitespace-nowrap font-serif text-base font-bold leading-none text-gulf min-[400px]:text-lg sm:text-2xl">{f.k}</dd>
                <dd className="mt-1 text-[10.5px] font-medium leading-tight text-slate-ink sm:text-xs">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </header>
  );
}
