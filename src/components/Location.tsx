import { Anchor, Coffee, Landmark, Pill, Route, School, ShoppingBag, Train, Waves } from "lucide-react";
import { PROPERTY } from "@/config/site";
import { SectionTitle } from "./SectionTitle";

const MAP_QUERY = encodeURIComponent(`${PROPERTY.address}, 80058 Torre Annunziata NA`);

const POINTS = [
  { icon: Waves, title: "Vista mare panoramica", text: "Dal 6° piano lo sguardo spazia sul Golfo e sulla costiera." },
  { icon: ShoppingBag, title: "Supermercati sotto casa", text: "Spesa quotidiana a pochi passi, senza prendere l'auto." },
  { icon: Pill, title: "Farmacie", text: "Servizi sanitari di base raggiungibili a piedi." },
  { icon: Coffee, title: "Bar e negozi", text: "Una via viva e servita, nel cuore della città." },
  { icon: School, title: "Scuole", text: "Istituti scolastici nelle vicinanze per tutte le età." },
  { icon: Train, title: "~300 m dalla Circumvesuviana", text: "Stazione Torre Annunziata-Oplonti: Napoli, Pompei e Sorrento senza auto." },
  { icon: Landmark, title: "Scavi di Oplonti", text: "La Villa di Poppea, patrimonio UNESCO, a breve distanza." },
  { icon: Anchor, title: "Lungomare e porto", text: "Passeggiate sul mare e porto vicini." },
  { icon: Route, title: "Svincolo A3", text: "Accesso rapido all'autostrada Napoli–Salerno." },
];

export function Location() {
  return (
    <section id="posizione" className="mx-auto max-w-5xl scroll-mt-4 px-4">
      <SectionTitle
        eyebrow="Posizione strategica"
        title={<>Via Vittorio Veneto 390: centro, mare e collegamenti</>}
        intro="Uno dei contesti residenziali più apprezzati di Torre Annunziata: tutto ciò che serve è sotto casa, e il mare lo vedi dalla finestra."
      />
      <div className="grid gap-3 md:grid-cols-[1fr_1.1fr]">
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1">
          {POINTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3 rounded-2xl border border-line bg-card p-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[15px] font-bold text-ink">{title}</span>
                <span className="block text-sm leading-snug text-slate-ink">{text}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft md:sticky md:top-4 md:self-start">
          <iframe
            title="Mappa: Via Vittorio Veneto 390, Torre Annunziata"
            src={`https://www.google.com/maps?q=${MAP_QUERY}&z=16&output=embed`}
            className="aspect-square w-full md:aspect-[4/5]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block border-t border-line px-4 py-3 text-center text-sm font-bold text-ink"
          >
            Apri in Google Maps →
          </a>
        </div>
      </div>
    </section>
  );
}
