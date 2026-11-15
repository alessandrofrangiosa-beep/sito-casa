"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Box, Expand, FileText, X, ZoomIn, ZoomOut } from "lucide-react";
import { FloorPlan3D } from "./FloorPlan3D";
import { PROPERTY, WHATSAPP_NUMBER } from "@/config/site";
import { useUi } from "./UiProvider";

const FLOORPLAN_MESSAGE = `Ciao, ho visto l'appartamento in ${PROPERTY.address} sul sito. Potrei ricevere la planimetria catastale?`;

type Plan = { src: string; label: string };

/** Planimetrie: schede Appartamento / Garage (immagine ingrandibile) e Vista 3D esplorabile */
export function FloorPlan({ plans }: { plans: Plan[] }) {
  const [tab, setTab] = useState(0);
  const [show3d, setShow3d] = useState(false);
  const tabs = [...plans.map((p) => p.label), "Vista 3D"];
  const src = plans.length ? plans[Math.min(tab, plans.length - 1)].src : null;
  const label = src ? plans[Math.min(tab, plans.length - 1)].label : "";

  return (
    <div>
      {plans.length > 0 && (
        <div role="tablist" aria-label="Planimetrie" className="mb-2 grid grid-cols-3 gap-1 rounded-xl border border-line bg-card p-1 shadow-soft">
          {tabs.map((t, i) => (
            <button
              key={t}
              role="tab"
              type="button"
              aria-selected={i < plans.length ? tab === i : show3d}
              // "Vista 3D" apre subito il modello a schermo intero; le altre schede cambiano l'immagine
              onClick={() => (i < plans.length ? setTab(i) : setShow3d(true))}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-semibold transition sm:text-sm ${
                (i < plans.length ? tab === i : show3d)
                  ? "bg-primary text-white shadow-soft"
                  : i === plans.length
                    ? "text-primary hover:bg-primary-soft"
                    : "text-slate-ink hover:bg-ice"
              }`}
            >
              {i === plans.length && <Box className="h-4 w-4" aria-hidden />}
              {t}
            </button>
          ))}
        </div>
      )}
      <PlanImage key={src ?? "none"} src={src} label={label} />
      {show3d && <FloorPlan3D onClose={() => setShow3d(false)} />}
    </div>
  );
}

function PlanImage({ src, label }: { src: string | null; label: string }) {
  const [open, setOpen] = useState(false);
  const { openBooking } = useUi();
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
    // Finché l'immagine non è caricata: planimetria disponibile su richiesta (WhatsApp) o in visita
    const button =
      "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-primary-hover";
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-card p-6 text-center shadow-soft">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <FileText className="h-7 w-7" aria-hidden />
        </span>
        <p className="max-w-xs text-[15px] leading-snug font-semibold text-ink">
          Planimetria catastale verificata disponibile in sede di visita o su richiesta WhatsApp
        </p>
        {WHATSAPP_NUMBER ? (
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(FLOORPLAN_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={button}
          >
            Richiedi planimetria su WhatsApp
          </a>
        ) : (
          <button type="button" onClick={openBooking} className={button}>
            Richiedi planimetria su WhatsApp
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setZoom(1); setOpen(true); }}
        className={`group relative block w-full overflow-hidden rounded-2xl border border-line bg-white shadow-soft ${label === "Garage" ? "aspect-[4/3]" : "aspect-[3/4] md:aspect-[4/5]"}`}
        aria-label="Apri la planimetria a schermo intero"
      >
        <Image src={src} alt={`Planimetria: ${label}`} fill sizes="(min-width:1024px) 900px, 100vw" className="object-contain p-3" />
        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-bold text-white shadow-soft">
          <Expand className="h-3.5 w-3.5" /> Tocca per ingrandire
        </span>
      </button>

      {open && (
        <div className="animate-fade fixed inset-0 z-[60] flex flex-col bg-ice" role="dialog" aria-modal="true" aria-label="Planimetria">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-lg font-semibold text-ink">Planimetria · {label}</p>
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
              <Image src={src} alt={`Planimetria: ${label}`} fill sizes="400vw" className="object-contain p-4" />
            </div>
          </div>
          <p className="pb-safe pt-2 text-center text-xs text-slate-ink">Usa + / − oppure pizzica per ingrandire e trascina per spostarti</p>
        </div>
      )}
    </>
  );
}
