"use client";

import { useCallback, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Carousel } from "./Carousel";
import { AiStudio } from "./AiStudio";
import { VirtualTour } from "./VirtualTour";
import { ENABLE_3D_TOUR } from "@/config/site";
import { galleryData, type GalleryItem } from "@/data/galleryData";
import { useUi } from "./UiProvider";

type Mode = "foto" | "ai" | "tour";

const MODES: { id: Exclude<Mode, "tour">; emoji: string; label: string; short: string }[] = [
  { id: "foto", emoji: "📷", label: "Foto Attuali", short: "Foto Attuali" },
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
              // Aspetto da pulsante: fondo azzurro, bordo, ombra e freccia a destra (blu pieno quando è aperta)
              className={`group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-10 text-[14px] font-bold shadow-soft transition active:scale-[0.99] sm:text-[15px] ${
                mode === "tour"
                  ? "border-primary bg-primary text-white"
                  : "border-primary/30 bg-primary-soft text-primary hover:border-primary/60 hover:bg-[#e0efff]"
              }`}
            >
              <span className="text-base leading-none" aria-hidden>🧭</span>
              Visita virtuale 360°
              <ChevronRight
                aria-hidden
                className={`absolute right-3 h-5 w-5 transition group-hover:translate-x-0.5 ${mode === "tour" ? "text-white" : "text-primary"}`}
              />
            </button>
            <div aria-hidden className="mx-2 my-1.5 h-px bg-line" />
          </>
        )}

        <div role="tablist" aria-label="Modalità di esplorazione" className="grid grid-cols-2">
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
            <p className="mt-2 text-center text-xs text-slate-ink">
              Scorri per la visita guidata · 15 foto reali, senza filtri né ritocchi · tieni premuto ✨ per il render 3D
            </p>
          </>
        )}
        {mode === "ai" && <AiStudio aiEnabled={aiEnabled} onShowRenders={() => setMode("foto")} />}
        {mode === "tour" && <VirtualTour onShowPhotos={() => setMode("foto")} />}
      </div>
    </section>
  );
}
