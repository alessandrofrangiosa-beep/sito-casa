"use client";

import { useCallback, useState } from "react";
import { Carousel } from "./Carousel";
import { AiStudio } from "./AiStudio";
import { VirtualTour } from "./VirtualTour";
import { ENABLE_3D_TOUR } from "@/config/site";
import { galleryData, renderData, type GalleryItem } from "@/data/galleryData";
import { useUi } from "./UiProvider";

type Mode = "foto" | "render" | "ai" | "tour";

const MODES: { id: Exclude<Mode, "tour">; emoji: string; label: string; short: string }[] = [
  { id: "foto", emoji: "📷", label: "Foto Attuali", short: "Foto Attuali" },
  { id: "render", emoji: "✨", label: "Render 3D Ipotetico", short: "Render 3D" },
  { id: "ai", emoji: "🎨", label: "Arredala come vuoi tu", short: "Arredala tu" },
];

export function ExploreSection({ aiEnabled = false }: { aiEnabled?: boolean }) {
  const [mode, setMode] = useState<Mode>("foto");
  const { markPhotoSeen } = useUi();
  const onPhoto = useCallback((item: GalleryItem) => markPhotoSeen(item.id), [markPhotoSeen]);

  return (
    <section id="esplora" className="mx-auto max-w-5xl scroll-mt-4 px-4">
      {/* Un unico selettore: in alto la barra sottile "Visita virtuale 360°" larga quanto le tre schede,
          una linea di separazione, poi le tre schede divise da linee verticali. All'apertura: foto reali. */}
      <div className="rounded-2xl border border-line bg-card p-1.5 shadow-soft">
        {ENABLE_3D_TOUR && (
          <>
            <button
              type="button"
              aria-pressed={mode === "tour"}
              aria-controls="pannello-tour"
              onClick={() => setMode("tour")}
              className={`flex h-10 w-full items-center justify-center gap-2 rounded-xl px-3 text-[13px] font-bold transition sm:text-sm ${
                mode === "tour" ? "bg-primary text-white shadow-soft" : "text-slate-ink hover:bg-ice"
              }`}
            >
              <span className="text-base leading-none" aria-hidden>🧭</span>
              Visita virtuale 360°
            </button>
            <div aria-hidden className="mx-2 my-1.5 h-px bg-line" />
          </>
        )}

        <div role="tablist" aria-label="Modalità di esplorazione" className="grid grid-cols-3">
          {MODES.map((m, i) => {
            const active = mode === m.id;
            // Linea verticale tra due schede, nascosta accanto alla scheda selezionata (che ha già il suo sfondo)
            const showDivider = i > 0 && !active && mode !== MODES[i - 1].id;
            return (
              <div key={m.id} className="relative px-0.5">
                {showDivider && <span aria-hidden className="absolute top-1/2 left-0 h-8 w-px -translate-y-1/2 bg-line" />}
                <button
                  role="tab"
                  type="button"
                  aria-selected={active}
                  aria-controls={`pannello-${m.id}`}
                  onClick={() => setMode(m.id)}
                  className={`flex min-h-16 w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-2.5 text-center transition sm:flex-row sm:gap-2 sm:text-base ${
                    active ? "bg-primary text-white shadow-soft" : "text-slate-ink hover:bg-ice"
                  }`}
                >
                  <span className="text-xl sm:text-lg" aria-hidden>{m.emoji}</span>
                  <span className="text-[13px] font-bold leading-tight sm:text-sm">
                    <span className="sm:hidden">{m.short}</span>
                    <span className="hidden sm:inline">{m.label}</span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4" id={`pannello-${mode}`} role="tabpanel">
        {mode === "foto" && (
          <>
            <Carousel items={galleryData} onIndexChange={onPhoto} priorityFirst />
            <p className="mt-2 text-center text-xs text-slate-ink">Scorri per la visita guidata · 15 foto reali, senza filtri né ritocchi</p>
          </>
        )}
        {mode === "render" && (
          <>
            <Carousel items={renderData} overlayBadge="Ipotesi di arredo e rimodernamento" />
            <p className="mt-2 text-center text-xs text-slate-ink">
              Render fotorealistici a scopo illustrativo: mostrano il potenziale, non lo stato attuale.
            </p>
          </>
        )}
        {mode === "ai" && <AiStudio aiEnabled={aiEnabled} onShowRenders={() => setMode("render")} />}
        {mode === "tour" && <VirtualTour onShowPhotos={() => setMode("foto")} />}
      </div>
    </section>
  );
}
