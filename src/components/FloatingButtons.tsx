"use client";

import { Info } from "lucide-react";
import { useUi } from "./UiProvider";
import { WhatsAppIcon } from "./BookingModal";

export function FloatingButtons() {
  const { openInfo, openBooking } = useUi();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-end justify-between gap-3 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
      <button
        type="button"
        onClick={() => openInfo()}
        className="pointer-events-auto flex h-11 items-center gap-2 rounded-full bg-ink pl-1.5 pr-4 text-sm font-semibold text-white shadow-float ring-1 ring-white/20 transition hover:bg-[#1e293b]"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white">
          <Info className="h-[18px] w-[18px] text-primary" strokeWidth={2.5} aria-hidden />
        </span>
        Info Utili
      </button>
      <button
        type="button"
        onClick={openBooking}
        className="pointer-events-auto flex h-11 items-center gap-2 rounded-full bg-primary pl-1.5 pr-4 text-sm font-semibold text-white shadow-float transition hover:bg-primary-hover"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white">
          <WhatsAppIcon className="h-[18px] w-[18px] text-whatsapp" />
        </span>
        Prenota Visita
      </button>
    </div>
  );
}
