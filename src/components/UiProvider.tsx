"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { InfoDrawer, type InfoTab } from "./InfoDrawer";
import { BookingModal } from "./BookingModal";
import { FloatingButtons } from "./FloatingButtons";

type UiState = {
  openInfo: (tab?: InfoTab) => void;
  openBooking: () => void;
  /** Foto della visita guidata effettivamente viste (per la pre-qualificazione) */
  markPhotoSeen: (id: number) => void;
  photosSeen: number;
  infoOpened: boolean;
};

const UiContext = createContext<UiState | null>(null);

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi deve essere usato dentro <UiProvider>");
  return ctx;
}

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [infoTab, setInfoTab] = useState<InfoTab | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([1]));
  const [infoOpened, setInfoOpened] = useState(false);

  const openInfo = useCallback((tab: InfoTab = "prezzo") => {
    setBookingOpen(false);
    setInfoTab(tab);
    setInfoOpened(true);
  }, []);
  const openBooking = useCallback(() => {
    setInfoTab(null);
    setBookingOpen(true);
  }, []);
  const markPhotoSeen = useCallback((id: number) => {
    setSeen((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const value = useMemo(
    () => ({ openInfo, openBooking, markPhotoSeen, photosSeen: seen.size, infoOpened }),
    [openInfo, openBooking, markPhotoSeen, seen.size, infoOpened],
  );

  return (
    <UiContext.Provider value={value}>
      {children}
      <FloatingButtons />
      <InfoDrawer tab={infoTab} onTabChange={setInfoTab} onClose={() => setInfoTab(null)} />
      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </UiContext.Provider>
  );
}
