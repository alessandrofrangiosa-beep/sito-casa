"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Expand, X, ZoomIn, ZoomOut } from "lucide-react";
import { DaControllare } from "./DaControllare";

export function FloorPlan({ src }: { src: string | null }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!src) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-2xl border-2 border-dashed border-red-400 bg-red-50 p-6 text-center">
        <DaControllare>Caricare immagine planimetria</DaControllare>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setZoom(1); setOpen(true); }}
        className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line bg-card shadow-soft"
        aria-label="Apri la planimetria a schermo intero"
      >
        <Image src={src} alt="Planimetria dell'appartamento" fill sizes="(min-width:1024px) 900px, 100vw" className="object-contain p-3" />
        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-bold text-white shadow-soft">
          <Expand className="h-3.5 w-3.5" /> Tocca per ingrandire
        </span>
      </button>

      {open && (
        <div className="animate-fade fixed inset-0 z-[60] flex flex-col bg-ice" role="dialog" aria-modal="true" aria-label="Planimetria">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-lg font-semibold text-ink">Planimetria</p>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Riduci" onClick={() => setZoom((z) => Math.max(1, z - 0.5))} className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card text-ink">
                <ZoomOut className="h-5 w-5" />
              </button>
              <span className="w-10 text-center text-sm font-semibold text-slate-ink">{zoom.toFixed(1)}×</span>
              <button type="button" aria-label="Ingrandisci" onClick={() => setZoom((z) => Math.min(4, z + 0.5))} className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card text-ink">
                <ZoomIn className="h-5 w-5" />
              </button>
              <button type="button" aria-label="Chiudi" onClick={() => setOpen(false)} className="ml-1 grid h-10 w-10 place-items-center rounded-full bg-primary text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto overscroll-contain" style={{ touchAction: "pan-x pan-y pinch-zoom" }}>
            <div className="relative mx-auto h-full transition-[width] duration-200" style={{ width: `${zoom * 100}%`, minHeight: `${zoom * 100}%` }}>
              <Image src={src} alt="Planimetria dell'appartamento" fill sizes="400vw" className="object-contain p-4" />
            </div>
          </div>
          <p className="pb-safe pt-2 text-center text-xs text-slate-ink">Usa + / − oppure pizzica per ingrandire e trascina per spostarti</p>
        </div>
      )}
    </>
  );
}
