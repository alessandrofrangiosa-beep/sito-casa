"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/** Pannello a scomparsa: bottom-sheet su smartphone, finestra laterale/centrata su desktop. */
export function Sheet({
  open,
  onClose,
  title,
  eyebrow,
  side = "left",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  side?: "left" | "right";
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Chiudi"
        onClick={onClose}
        className="animate-fade absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`animate-sheet absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-3xl bg-ice shadow-float outline-none md:inset-y-0 md:bottom-auto md:h-dvh md:max-h-none md:w-[460px] md:rounded-none ${
          side === "left" ? "md:left-0 md:right-auto" : "md:right-0 md:left-auto"
        }`}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-line md:hidden" />
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 pb-4 pt-3 md:pt-6">
          <div>
            {eyebrow && (
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
            )}
            <h2 className="text-2xl font-semibold leading-tight">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi pannello"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-card text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
