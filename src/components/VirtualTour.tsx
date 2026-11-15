"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Maximize2, Minimize2, MousePointerClick, Rotate3d } from "lucide-react";
import { TOUR_EMBED_URL } from "@/config/site";
import { SectionTitle } from "./SectionTitle";

type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void };

/**
 * Sezione "Tour Virtuale 3D" (subito dopo la galleria foto).
 * - Anti-scroll trap: finché non si tocca "Esplora in 3D" l'iframe non riceve tocchi, così chi scorre la pagina
 *   sullo smartphone non finisce per sbaglio a muovere la camera 3D.
 * - "Schermo intero": a tutto schermo nativo dove il browser lo consente (Android, desktop), altrimenti
 *   (iPhone) il riquadro si allarga a tutta la finestra; si chiude con il pulsante, Esc o il tasto Indietro.
 * - Scheletro di caricamento finché l'iframe non ha finito di caricare.
 */
export function VirtualTour() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [full, setFull] = useState(false);

  // Se il tour non segnala il caricamento (rete lenta o bloccata) lo scheletro sparisce comunque dopo un po'
  useEffect(() => {
    if (loaded) return;
    const t = window.setTimeout(() => setLoaded(true), 20_000);
    return () => window.clearTimeout(t);
  }, [loaded]);

  const exitNative = () => {
    const d = document as FsDocument;
    if (d.fullscreenElement) void d.exitFullscreen?.().catch(() => {});
    else if (d.webkitFullscreenElement) void d.webkitExitFullscreen?.();
  };

  const openFull = useCallback(() => {
    setActive(true);
    setFull(true);
    window.history.pushState({ ta390Tour: true }, "");
    const el = boxRef.current as FsElement | null;
    try {
      const req = el?.requestFullscreen?.bind(el) ?? el?.webkitRequestFullscreen?.bind(el);
      const p = req?.();
      if (p && typeof (p as Promise<void>).catch === "function") (p as Promise<void>).catch(() => {});
    } catch {
      /* schermo intero nativo non disponibile (es. iPhone): resta quello a tutta finestra */
    }
  }, []);

  const closeFull = useCallback(() => {
    if (window.history.state?.ta390Tour) window.history.back();
    else setFull(false);
  }, []);

  useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onPop = () => {
      exitNative();
      setFull(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeFull();
    // Uscita dal tutto schermo nativo (gesto di sistema o Esc): chiude anche la vista allargata
    const onFs = () => {
      const d = document as FsDocument;
      if (!d.fullscreenElement && !d.webkitFullscreenElement) closeFull();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs);
    };
  }, [full, closeFull]);

  if (!TOUR_EMBED_URL) return null;

  return (
    <section id="tour-3d" className="mx-auto max-w-5xl scroll-mt-4 px-4">
      <SectionTitle
        eyebrow="Muoviti dentro casa"
        title="Tour Virtuale 3D"
        intro="Entra nell'appartamento come se fossi lì: guardati intorno, avvicinati e passa da una stanza all'altra."
      />

      <div
        ref={boxRef}
        className={
          full
            ? "fixed inset-0 z-[70] bg-ink"
            : "relative aspect-[4/3] min-h-[400px] w-full overflow-hidden rounded-2xl border border-line bg-ink shadow-soft sm:aspect-video sm:min-h-0"
        }
      >
        <iframe
          src={TOUR_EMBED_URL}
          title="Tour virtuale 3D dell'appartamento in Via Vittorio Veneto 390"
          allow="accelerometer; gyroscope; xr-spatial-tracking; fullscreen"
          allowFullScreen
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"} ${
            active ? "" : "pointer-events-none"
          }`}
        />

        {/* Caricamento: scheletro con riflesso */}
        {!loaded && (
          <div aria-hidden className="absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-800 via-ink to-slate-900">
            <div className="absolute inset-0 -translate-x-full animate-[tour-shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        )}

        {/* Al centro: spinner finché carica e, prima del primo tocco, il pulsante "Esplora in 3D".
            Overlay semitrasparente: la pagina continua a scorrere finché non si sceglie di esplorare. */}
        {(!active || !loaded) && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 ${active ? "pointer-events-none" : "bg-ink/35"}`}>
            {!loaded && (
              <div className="flex flex-col items-center gap-2.5 text-white/85" role="status">
                <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-white/20 border-t-white" aria-hidden />
                <span className="text-sm font-medium">Caricamento del tour 3D…</span>
              </div>
            )}
            {!active && (
              <button
                type="button"
                onClick={() => setActive(true)}
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-6 py-3.5 text-base font-bold text-ink shadow-soft transition hover:bg-primary-soft active:scale-[0.98]"
              >
                <Rotate3d className="h-5 w-5 text-primary" aria-hidden /> Esplora in 3D
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={full ? closeFull : openFull}
          aria-label={full ? "Esci dallo schermo intero" : "Schermo intero"}
          className={`absolute right-3 inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-3.5 py-2 text-sm font-semibold text-white shadow-soft backdrop-blur-sm transition hover:bg-ink ${
            full ? "top-[max(0.75rem,env(safe-area-inset-top))]" : "top-3"
          }`}
        >
          {full ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
          {full ? "Esci" : "Schermo intero"}
        </button>
      </div>

      <div className="mt-2.5 flex flex-col items-center gap-1.5 text-center">
        <p className="flex items-center gap-1.5 text-xs text-slate-ink">
          <MousePointerClick className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Trascina per guardarti intorno · pizzica o usa la rotellina per avvicinarti
        </p>
        <a
          href={TOUR_EMBED_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-balance text-primary hover:text-primary-hover hover:underline"
        >
          Apri tour a schermo intero in una nuova scheda
          <ExternalLink className="ml-1 inline h-3.5 w-3.5 align-[-2px]" aria-hidden />
        </a>
      </div>
    </section>
  );
}
