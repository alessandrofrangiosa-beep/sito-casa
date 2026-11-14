"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import type { GalleryItem } from "@/data/galleryData";

type Props = {
  items: GalleryItem[];
  /** Badge discreto mostrato su ogni immagine (es. per i render) */
  overlayBadge?: string;
  onIndexChange?: (item: GalleryItem, index: number) => void;
  priorityFirst?: boolean;
};

function useCarousel(count: number, initial = 0) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(initial);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setIndex((prev) => (prev === i ? prev : Math.max(0, Math.min(count - 1, i))));
  }, [count]);

  const goTo = useCallback((i: number, smooth = true) => {
    const el = trackRef.current;
    if (!el) return;
    const target = Math.max(0, Math.min(count - 1, i));
    el.scrollTo({ left: target * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
  }, [count]);

  return { trackRef, index, onScroll, goTo };
}

function CaptionPill({ item, index, total }: { item: GalleryItem; index: number; total: number }) {
  return (
    <div
      key={item.id}
      className="animate-caption pointer-events-none flex w-full items-center gap-2.5 rounded-xl bg-white/92 px-3 py-2 shadow-soft backdrop-blur-md"
      aria-live="polite"
    >
      <span className="grid h-7 min-w-7 shrink-0 place-items-center rounded-lg bg-primary px-1 text-[12px] font-bold text-white">
        {String(index + 1).padStart(2, "0")}
      </span>
      <p className="line-clamp-2 text-[13.5px] leading-snug text-ink sm:text-sm">
        <strong className="font-bold text-ink">{item.title}</strong>
        <span className="text-slate-ink"> · {item.caption}</span>
      </p>
      <span className="sr-only">
        Foto {index + 1} di {total}
      </span>
    </div>
  );
}

/**
 * "Tieni premuto: Render 3D ✨": finché il dito (o il mouse) resta sul pulsante si vede il render,
 * al rilascio torna subito la foto reale. Niente menu "Salva immagine" né selezione di testo su iOS/Android.
 */
function HoldToCompare({ active, onHold }: { active: boolean; onHold: (on: boolean) => void }) {
  const start = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    onHold(true);
  };
  const stop = () => onHold(false);
  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onKeyDown={(e) => (e.key === " " || e.key === "Enter") && (e.preventDefault(), onHold(true))}
      onKeyUp={stop}
      onBlur={stop}
      onContextMenu={(e) => e.preventDefault()}
      style={{ WebkitTouchCallout: "none" }}
      aria-pressed={active}
      className={`pointer-events-auto inline-flex touch-none items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold text-white shadow-float backdrop-blur transition select-none ${
        active ? "scale-95 border-primary bg-primary" : "border-white/70 bg-ink/80"
      }`}
    >
      Tieni premuto: Render 3D ✨
    </button>
  );
}

function Arrows({ index, total, goTo, dark = false }: { index: number; total: number; goTo: (i: number) => void; dark?: boolean }) {
  const base = `absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full shadow-soft transition disabled:opacity-0 ${
    dark ? "bg-white/15 text-white" : "bg-white/85 text-ink backdrop-blur"
  }`;
  return (
    <>
      <button type="button" aria-label="Foto precedente" onClick={() => goTo(index - 1)} disabled={index === 0} className={`${base} left-2`}>
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button type="button" aria-label="Foto successiva" onClick={() => goTo(index + 1)} disabled={index === total - 1} className={`${base} right-2`}>
        <ChevronRight className="h-5 w-5" />
      </button>
    </>
  );
}

export function Carousel({ items, overlayBadge, onIndexChange, priorityFirst }: Props) {
  const { trackRef, index, onScroll, goTo } = useCarousel(items.length);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const current = items[index];
  const [holding, setHolding] = useState(false);
  const showingRender = holding && Boolean(current.render);

  // Cambiando foto, o se la pagina perde il focus mentre il dito è giù, si torna sempre alla foto reale
  useEffect(() => setHolding(false), [index]);
  useEffect(() => {
    const release = () => setHolding(false);
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", release);
    return () => {
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", release);
    };
  }, []);

  useEffect(() => {
    onIndexChange?.(items[index], index);
    // Centra la miniatura attiva scorrendo solo la striscia (mai la pagina)
    const strip = thumbsRef.current;
    const thumb = strip?.children[index] as HTMLElement | undefined;
    if (strip && thumb) {
      strip.scrollTo({ left: thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2, behavior: "smooth" });
    }
  }, [index, items, onIndexChange]);

  return (
    <div>
      <div
        className="relative touch-manipulation overflow-hidden rounded-2xl border border-line bg-ink shadow-soft select-none"
        onContextMenu={(e) => e.preventDefault()}
        style={{ WebkitTouchCallout: "none" }}
      >
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        >
          {items.map((item, i) => (
            <button
              type="button"
              key={item.src}
              onClick={() => setLightbox(i)}
              className="relative aspect-[4/5] w-full shrink-0 snap-center sm:aspect-[4/3]"
              aria-label={`Apri a schermo intero: ${item.title}`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(min-width: 1024px) 900px, 100vw"
                className="object-cover sm:object-contain"
                priority={priorityFirst && i === 0}
                loading={priorityFirst && i === 0 ? undefined : i < 2 ? "eager" : "lazy"}
                draggable={false}
              />
              {item.render && (
                // Sovrapposto esattamente alla foto e già caricato (foto corrente e vicine): il cambio è istantaneo
                <Image
                  src={item.render}
                  alt={`Render 3D: ${item.title}`}
                  fill
                  sizes="(min-width: 1024px) 900px, 100vw"
                  className={`object-cover transition-opacity duration-150 sm:object-contain ${
                    showingRender && i === index ? "opacity-100" : "opacity-0"
                  }`}
                  loading={Math.abs(i - index) <= 1 ? "eager" : "lazy"}
                  draggable={false}
                  aria-hidden={!(showingRender && i === index)}
                />
              )}
            </button>
          ))}
        </div>

        <Arrows index={index} total={items.length} goTo={goTo} />

        <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2 sm:inset-x-3 sm:top-3">
          <div className="flex flex-col items-start gap-1.5">
            {overlayBadge && (
              <span className="rounded-full bg-ink/70 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur">
                ✨ {overlayBadge}
              </span>
            )}
            {showingRender && (
              <span className="rounded-full bg-ink/75 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur">
                ✨ Ipotesi di arredo 3D
              </span>
            )}
            {current.badge && !showingRender && (
              <span key={current.id} className="animate-caption rounded-full border border-primary/20 bg-primary-soft px-2.5 py-1 text-[12px] font-semibold text-primary shadow-soft">
                ✓ {current.badge}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur">
            {index + 1} / {items.length}
            <Maximize2 className="h-3 w-3" />
          </span>
        </div>

        <div className="pointer-events-none absolute inset-x-2 bottom-2 flex flex-col items-center gap-2 sm:inset-x-3 sm:bottom-3">
          {current.render && <HoldToCompare key={current.id} active={showingRender} onHold={setHolding} />}
          <CaptionPill item={current} index={index} total={items.length} />
        </div>
      </div>

      {/* Miniature */}
      <div ref={thumbsRef} className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        {items.map((item, i) => (
          <button
            type="button"
            key={item.src}
            onClick={() => goTo(i)}
            aria-label={`Vai a: ${item.title}`}
            aria-current={i === index}
            className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition ${
              i === index ? "border-primary" : "border-transparent opacity-60"
            }`}
          >
            <Image src={item.src} alt="" fill sizes="56px" className="object-cover" />
          </button>
        ))}
      </div>

      {lightbox !== null && (
        <Lightbox items={items} start={lightbox} overlayBadge={overlayBadge} onClose={(i) => { setLightbox(null); goTo(i, false); }} />
      )}
    </div>
  );
}

function Lightbox({
  items,
  start,
  overlayBadge,
  onClose,
}: {
  items: GalleryItem[];
  start: number;
  overlayBadge?: string;
  onClose: (lastIndex: number) => void;
}) {
  const { trackRef, index, onScroll, goTo } = useCarousel(items.length, start);
  const item = items[index];

  useLayoutEffect(() => {
    const el = trackRef.current;
    if (el) el.scrollLeft = start * el.clientWidth;
  }, [start, trackRef]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(index);
      if (e.key === "ArrowRight") goTo(index + 1);
      if (e.key === "ArrowLeft") goTo(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, goTo, onClose]);

  return (
    <div className="animate-fade fixed inset-0 z-[60] flex flex-col bg-[#0b1726]" role="dialog" aria-modal="true" aria-label="Galleria a schermo intero">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-semibold">
          {index + 1} / {items.length}
          {overlayBadge && <span className="ml-2 text-xs font-normal text-white/70">· {overlayBadge}</span>}
        </span>
        <button type="button" onClick={() => onClose(index)} aria-label="Chiudi" className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <div ref={trackRef} onScroll={onScroll} className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto">
          {items.map((it) => (
            <div key={it.src} className="relative h-full w-full shrink-0 snap-center">
              <Image src={it.src} alt={it.alt} fill sizes="100vw" className="object-contain" />
            </div>
          ))}
        </div>
        <Arrows index={index} total={items.length} goTo={goTo} dark />
      </div>
      <div key={item.id} className="animate-caption px-5 pb-safe pt-3 text-white">
        <p className="text-lg font-semibold text-white">{item.title}</p>
        <p className="text-sm text-white/75">{item.caption}</p>
      </div>
    </div>
  );
}
