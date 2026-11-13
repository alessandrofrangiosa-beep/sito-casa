import { Car, Anchor, Coffee, Hospital, Landmark, Pill, Route, School, ShoppingBag, Train, Waves } from "lucide-react";
import { SectionTitle } from "./SectionTitle";
import { NeighborhoodMap } from "./NeighborhoodMap";
import { MAP_POINTS } from "@/data/mapPoints";

/** Distanza (in linea d'aria) del punto più vicino tra quelli indicati, presa dai dati della mappa */
const meters = (ids: string[]) => ids.map((id) => MAP_POINTS.find((p) => p.id === id)?.meters ?? Infinity);
const km = (m: number) => `${(m / 1000).toFixed(1).replace(".", ",")}\u00a0km`;
const nearest = (...ids: string[]) => km(Math.min(...meters(ids)));
/** Media delle distanze, per le voci che raggruppano più punti diversi (es. le tre scuole) */
const average = (...ids: string[]) => {
  const all = meters(ids);
  return km(all.reduce((a, b) => a + b, 0) / all.length);
};

// 10 tessere tutte uguali su 2 colonne (5 righe piene)
const POINTS = [
  { icon: Waves, title: "Vista mare panoramica", detail: "6° piano" },
  { icon: ShoppingBag, title: "Supermercati", detail: nearest("deco", "sisa") },
  { icon: Pill, title: "Farmacie", detail: nearest("farmacia") },
  { icon: Coffee, title: "Bar e negozi", detail: nearest("bar") },
  { icon: School, title: "Scuola elementare, media e superiore", detail: average("elementare", "media", "superiore") },
  { icon: Hospital, title: "Ospedale", detail: nearest("ospedale") },
  { icon: Train, title: "Circumvesuviana", detail: nearest("circum") },
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
        {/* Tessere tutte uguali: icona in alto, nome sotto, distanza in fondo allineata in tutte le tessere */}
        <ul className="grid auto-rows-fr grid-cols-2 gap-2 self-start">
          {POINTS.map(({ icon: Icon, title, detail }) => (
            <li key={title} className="flex min-w-0 flex-col rounded-xl border border-line bg-card px-3 py-2.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="mt-1.5 text-[13px] leading-tight font-bold text-ink max-[360px]:text-[12px] sm:text-sm">{title}</span>
              <span className="mt-auto pt-1 text-xs leading-tight font-semibold text-primary tabular-nums">{detail}</span>
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
