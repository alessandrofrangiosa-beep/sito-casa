import { Car, Anchor, Coffee, Hospital, Landmark, Pill, Route, School, ShoppingBag, Train, Waves } from "lucide-react";
import { SectionTitle } from "./SectionTitle";
import { NeighborhoodMap } from "./NeighborhoodMap";
import { MAP_POINTS } from "@/data/mapPoints";

/** Distanza (in linea d'aria) del punto più vicino tra quelli indicati, presa dai dati della mappa */
const meters = (ids: string[]) => ids.map((id) => MAP_POINTS.find((p) => p.id === id)?.meters ?? Infinity);
const km = (m: number) => `${(m / 1000).toFixed(1).replace(".", ",")}\u00a0km`;
const nearest = (...ids: string[]) => km(Math.min(...meters(ids)));
const range = (...ids: string[]) => {
  const all = meters(ids);
  return `${km(Math.min(...all)).replace("\u00a0km", "")}–${km(Math.max(...all))}`;
};

// \u00ad = trattino che compare solo se la parola non entra nella riga (schermi molto stretti)
// "wide" = tessera su tutta la riga: le due voci con il testo più lungo, così le altre 8 restano a coppie
const POINTS = [
  { icon: Waves, title: "Vista mare panoramica", detail: "6° piano", wide: true },
  { icon: ShoppingBag, title: "Super\u00admercati", detail: nearest("deco", "sisa") },
  { icon: Pill, title: "Farmacie", detail: nearest("farmacia") },
  { icon: Coffee, title: "Bar e negozi", detail: nearest("bar") },
  { icon: Hospital, title: "Ospedale", detail: nearest("ospedale") },
  { icon: School, title: "Scuola elementare, media e superiore", detail: range("elementare", "media", "superiore"), wide: true },
  { icon: Train, title: "Circum\u00advesuviana", detail: nearest("circum") },
  { icon: Landmark, title: "Scavi di Oplonti", detail: nearest("scavi") },
  { icon: Anchor, title: "Lungomare e porto", detail: nearest("molo", "lungomare") },
  { icon: Route, title: "Svincolo A3", detail: nearest("a3-nord", "a3-sud") },
];

export function Location() {
  return (
    <section id="posizione" className="mx-auto max-w-5xl scroll-mt-4 px-4">
      <SectionTitle
        eyebrow="Posizione strategica"
        title={<>Via Vittorio Veneto 390: centro, mare e collegamenti</>}
        intro="Uno dei contesti residenziali più apprezzati di Torre Annunziata: tutto ciò che serve è sotto casa, e il mare lo vedi dalla finestra."
      />
      <div className="mb-3 flex gap-3 rounded-2xl border border-primary/20 bg-primary-soft p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white">
          <Car className="h-5 w-5" aria-hidden />
        </span>
        <p className="min-w-0 text-[15px] leading-snug text-ink">
          <strong className="font-semibold">Zero stress parcheggio in Via Vittorio Veneto</strong> grazie all&apos;ampio garage
          privato in cui entra tranquillamente anche un SUV.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1.1fr]">
        {/* Griglia a tessere tutte uguali: stessa altezza, icona e nome in alto, distanza allineata in basso */}
        <ul className="grid auto-rows-fr grid-cols-2 gap-2 self-start">
          {POINTS.map(({ icon: Icon, title, detail, wide }) => (
            <li
              key={title}
              className={`flex min-w-0 items-start gap-2.5 rounded-xl border border-line bg-card p-2.5 max-[360px]:gap-2 max-[360px]:p-2 ${
                wide ? "col-span-2" : ""
              }`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary max-[360px]:h-7 max-[360px]:w-7">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col justify-between gap-1 self-stretch leading-tight">
                <span className="text-[13px] font-bold text-ink sm:text-sm">{title}</span>
                <span className="text-xs font-semibold text-primary tabular-nums">{detail}</span>
              </span>
            </li>
          ))}
        </ul>
        {/* "sticky" crea un livello a parte: con la mappa a schermo intero va portato sopra i pulsanti fissi */}
        <div className="md:sticky md:top-4 md:self-start has-[.map-fullscreen]:z-[60]">
          <NeighborhoodMap />
        </div>
      </div>
    </section>
  );
}
