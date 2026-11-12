"use client";

import { useUi } from "./UiProvider";

export function FloatingButtons() {
  const { openInfo, openBooking } = useUi();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-end justify-between gap-3 px-3 pb-safe sm:px-5">
      <button
        type="button"
        onClick={() => openInfo()}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/20 bg-gulf px-4 py-3.5 text-sm font-bold text-white shadow-float sm:px-5 sm:text-base"
      >
        <span aria-hidden>ℹ️</span> Info Utili
      </button>
      <button
        type="button"
        onClick={openBooking}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-emerald-brand px-4 py-3.5 text-sm font-bold text-white shadow-float sm:px-5 sm:text-base"
      >
        <span aria-hidden>💬</span> Prenota Visita
      </button>
    </div>
  );
}
