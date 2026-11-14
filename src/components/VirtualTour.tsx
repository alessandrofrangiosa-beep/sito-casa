import { Camera, Rotate3d } from "lucide-react";
import { TOUR_EMBED_URL } from "@/config/site";

/**
 * Contenuto della scheda "Visita 360°" nella sezione di esplorazione.
 * Con TOUR_EMBED_URL mostra il tour navigabile; senza, il riquadro "in arrivo".
 */
export function VirtualTour({ onShowPhotos }: { onShowPhotos?: () => void }) {
  if (TOUR_EMBED_URL) {
    return (
      <>
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-ink shadow-soft sm:aspect-video">
          <iframe
            src={TOUR_EMBED_URL}
            title="Visita virtuale 360° dell'appartamento"
            className="absolute inset-0 h-full w-full"
            allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
            allowFullScreen
            loading="lazy"
          />
        </div>
        <p className="mt-2 text-center text-xs text-slate-ink">
          Trascina per guardarti intorno e tocca le frecce per passare da una stanza all&apos;altra.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-line bg-ink p-6 text-white shadow-soft sm:p-10">
        <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[28px] border-white/5" />
        <div aria-hidden className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full border border-primary/20" />
        <div className="relative flex flex-col items-start gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-white">
            <Rotate3d className="h-7 w-7" />
          </span>
          <p className="text-2xl font-semibold text-white sm:text-3xl">Visita virtuale 360° in arrivo</p>
          <p className="max-w-lg text-[15px] leading-relaxed text-white/80">
            Potrai muoverti tra le stanze come su Google Street View: guardarti intorno, passare da un ambiente
            all&apos;altro e farti un&apos;idea precisa degli spazi prima della visita dal vivo.
          </p>
          {onShowPhotos && (
            <button
              type="button"
              onClick={onShowPhotos}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-primary-soft"
            >
              <Camera className="h-4 w-4 text-primary" /> Intanto guarda le foto attuali
            </button>
          )}
        </div>
      </div>
    </>
  );
}
