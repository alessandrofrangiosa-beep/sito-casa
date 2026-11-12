import { Compass, Rotate3d } from "lucide-react";
import { ENABLE_3D_TOUR, TOUR_EMBED_URL } from "@/config/site";
import { SectionTitle } from "./SectionTitle";

export function VirtualTour() {
  return (
    <section id="tour" className="mx-auto max-w-5xl scroll-mt-4 px-4">
      <SectionTitle
        eyebrow="Esplora da casa"
        title="Tour Virtuale 360° dell'Appartamento"
        intro="Muoviti tra le stanze come su Google Street View: orientati, misura gli spazi a colpo d'occhio e arriva alla visita dal vivo con le idee già chiare."
      />
      {ENABLE_3D_TOUR && TOUR_EMBED_URL ? (
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-line bg-gulf shadow-soft sm:aspect-video">
          <iframe
            src={TOUR_EMBED_URL}
            title="Tour virtuale 360° dell'appartamento"
            className="absolute inset-0 h-full w-full"
            allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-3xl border border-line bg-gulf p-6 text-white shadow-soft sm:p-10">
          <div
            aria-hidden
            className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[28px] border-white/5"
          />
          <div aria-hidden className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full border border-terra/30" />
          <div className="relative flex flex-col items-start gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-terra">
              <Rotate3d className="h-7 w-7" />
            </span>
            <p className="font-serif text-2xl font-semibold text-white sm:text-3xl">Tour Virtuale 360° in arrivo</p>
            <p className="max-w-lg text-[15px] leading-relaxed text-white/80">
              Stiamo preparando la ripresa immersiva di tutti gli ambienti. Nel frattempo la galleria guidata qui sopra
              ti accompagna stanza per stanza, nello stesso ordine della visita reale.
            </p>
            <a
              href="#esplora"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-gulf"
            >
              <Compass className="h-4 w-4 text-terra" /> Riparti dalla visita guidata
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
