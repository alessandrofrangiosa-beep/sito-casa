"use client";

import { useCallback, useState } from "react";
import { Carousel } from "./Carousel";
import { AiStudio } from "./AiStudio";
import { galleryData, renderData, type GalleryItem } from "@/data/galleryData";
import { useUi } from "./UiProvider";

type Mode = "foto" | "render" | "ai";

const MODES: { id: Mode; emoji: string; label: string; short: string }[] = [
  { id: "foto", emoji: "📷", label: "Foto Attuali", short: "Foto Attuali" },
  { id: "render", emoji: "✨", label: "Render 3D Ipotetico", short: "Render 3D" },
  { id: "ai", emoji: "🎨", label: "Crea il tuo Render AI", short: "Render AI" },
];

export function ExploreSection() {
  const [mode, setMode] = useState<Mode>("foto");
  const { markPhotoSeen } = useUi();
  const onPhoto = useCallback((item: GalleryItem) => markPhotoSeen(item.id), [markPhotoSeen]);

  return (
    <section id="esplora" className="mx-auto max-w-5xl scroll-mt-4 px-4">
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
              <span className="text-[12px] font-bold leading-tight sm:text-sm">
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
        {mode === "ai" && <AiStudio />}
      </div>
    </section>
  );
}
