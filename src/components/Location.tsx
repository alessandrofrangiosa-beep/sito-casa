import { Car, Anchor, Coffee, Landmark, Pill, Route, School, ShoppingBag, Train, Waves } from "lucide-react";
import { PROPERTY } from "@/config/site";
import { SectionTitle } from "./SectionTitle";

const MAP_QUERY = encodeURIComponent(`${PROPERTY.address}, 80058 Torre Annunziata NA`);
/** Mappa incorporata (URL embed pubblico di Google Maps, senza chiave API) */
const MAP_EMBED_URL =
  "https://maps.google.com/maps?q=Via%20Vittorio%20Veneto%20390,%20Torre%20Annunziata&t=&z=16&ie=UTF8&iwloc=&output=embed";

const POINTS = [
  { icon: Waves, title: "Vista mare panoramica" },
  { icon: ShoppingBag, title: "Supermercati sotto casa" },
  { icon: Pill, title: "Farmacie" },
  { icon: Coffee, title: "Bar e negozi" },
  { icon: School, title: "Scuole" },
  { icon: Train, title: "~300 m dalla Circumvesuviana" },
  { icon: Landmark, title: "Scavi di Oplonti" },
  { icon: Anchor, title: "Lungomare e porto" },
  { icon: Route, title: "Svincolo A3" },
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
          privato in cui entra tranquillamente anche un SUV, e <strong className="font-semibold">terrazza e 2 balconi vivibili da marzo a
          novembre</strong>, con la terrazza che diventa una quinta stanza vista Golfo.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1.1fr]">
        <ul className="grid grid-cols-2 gap-2 self-start sm:grid-cols-3 md:grid-cols-2">
          {POINTS.map(({ icon: Icon, title }) => (
            <li
              key={title}
              className="flex min-w-0 items-center gap-2 rounded-xl border border-line bg-card px-2.5 py-2.5"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 text-[13px] font-bold leading-tight text-ink sm:text-sm">{title}</span>
            </li>
          ))}
        </ul>
        <div className="md:sticky md:top-4 md:self-start">
          <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
            <iframe
              title="Mappa: Via Vittorio Veneto 390, 80058 Torre Annunziata NA"
              src={MAP_EMBED_URL}
              className="block h-[260px] w-full border-0 md:h-[340px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-semibold text-primary hover:text-primary-hover hover:underline"
          >
            Apri mappa a schermo intero →
          </a>
        </div>
      </div>
    </section>
  );
}
