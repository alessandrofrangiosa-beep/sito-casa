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
      {/* Visita 360°: pulsante a tutta larghezza sopra le tre schede; all'apertura si vedono sempre le foto reali */}
      {ENABLE_3D_TOUR && (
        <button
          type="button"
          aria-pressed={mode === "tour"}
          aria-controls="pannello-tour"
          onClick={() => setMode("tour")}
          className={`mb-2 flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-soft transition ${
            mode === "tour" ? "border-primary bg-primary text-white" : "border-line bg-card text-ink hover:border-primary/40"
          }`}
        >
          <span className="text-2xl" aria-hidden>🧭</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold leading-tight sm:text-base">Visita virtuale 360°</span>
            <span className={`block text-xs leading-snug sm:text-sm ${mode === "tour" ? "text-white/80" : "text-slate-ink"}`}>
              Muoviti tra le stanze come su Street View
            </span>
          </span>
          <span className={`shrink-0 text-sm font-semibold ${mode === "tour" ? "text-white" : "text-primary"}`} aria-hidden>
            {mode === "tour" ? "Aperta" : "Apri →"}
          </span>
        </button>
      )}

      <div role="tablist" aria-label="Modalità di esplorazione" className="grid grid-cols-3 gap-1.5 rounded-2xl border border-line bg-card p-1.5 shadow-soft">
        {MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls={`pannello-${m.id}`}
              onClick={() => setMode(m.id)}
              className={`flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-xl px-1.5 py-2.5 text-center transition sm:flex-row sm:gap-2 sm:text-base ${
                active ? "bg-primary text-white shadow-soft" : "text-slate-ink hover:bg-ice"
              }`}
            >
              <span className="text-xl sm:text-lg" aria-hidden>{m.emoji}</span>
              <span className="text-[13px] font-bold leading-tight sm:text-sm">
                <span className="sm:hidden">{m.short}</span>
                <span className="hidden sm:inline">{m.label}</span>
              </span>
            </button>
          );
        })}
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
