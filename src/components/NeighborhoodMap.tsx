"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { MAP_POINTS, type MapPoint } from "@/data/mapPoints";

/** Zoom da cui compaiono i punti secondari (negozi, farmacie, scuole, bar) */
const MINOR_ICON_ZOOM = 14.5;
/** Su touch: la mappa si sblocca appena la pagina smette di scorrere, se è visibile almeno per questa quota */
const UNLOCK_VISIBLE_RATIO = 0.9;
/** Millisecondi senza eventi di scorrimento per considerare la pagina ferma (copre anche lo scorrimento a inerzia) */
const SCROLL_IDLE_MS = 120;

const formatDistance = (m?: number) =>
  m === undefined ? "" : m < 1000 ? ` · ${m} m` : ` · ${(m / 1000).toFixed(1).replace(".", ",")} km`;

function markerHtml(p: MapPoint) {
  return `<div class="poi poi-${p.tier} poi-${p.side}">
    <span class="poi-dot" aria-hidden="true">${p.emoji}</span>
    <span class="poi-label">${p.label}${formatDistance(p.meters)}</span>
  </div>`;
}

/**
 * Su touch: mentre la pagina scorre la mappa è bloccata, così il dito che ci passa sopra scorre
 * la pagina. Appena la pagina si ferma con la mappa visibile almeno al 90%, si sblocca subito e si
 * sposta con un dito. Riprendendo a scorrere (o se resta visibile solo in parte) torna bloccata.
 * A schermo intero è sempre sbloccata.
 */
function setupAutoUnlock(el: HTMLElement, map: import("leaflet").Map, isFull: () => boolean) {
  let idleTimer: number | undefined;

  const visibleRatio = () => {
    const r = el.getBoundingClientRect();
    if (r.height <= 0) return 0;
    const visible = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
    return Math.max(0, visible) / r.height;
  };
  const setLocked = (wantLocked: boolean) => {
    const locked = wantLocked && !isFull();
    if (locked && map.dragging.enabled()) map.dragging.disable();
    if (!locked && !map.dragging.enabled()) map.dragging.enable();
  };
  const evaluate = () => setLocked(visibleRatio() < UNLOCK_VISIBLE_RATIO);
  const onScroll = () => {
    setLocked(true);
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(evaluate, SCROLL_IDLE_MS);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", evaluate, { passive: true });
  evaluate();

  return {
    evaluate,
    cleanup: () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", evaluate);
      window.clearTimeout(idleTimer);
    },
  };
}

/**
 * Mappa OpenStreetMap del quartiere con i punti di interesse reali.
 * Su smartphone si sposta con un dito appena la pagina smette di scorrere con la mappa ben visibile; zoom con due dita o +/−.
 * "Schermo intero" ingrandisce la mappa dentro il sito (nessun link esterno): si chiude con Chiudi, Esc o il tasto Indietro.
 */
export function NeighborhoodMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  const fullRef = useRef(false);
  /** Chiamata dopo ogni cambio di dimensione: ricalcola la mappa, la reinquadra e aggiorna il blocco touch */
  const refitRef = useRef<() => void>(() => {});

  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | undefined;
    let cleanupTouch: (() => void) | undefined;
    let resizeObserver: ResizeObserver | undefined;

    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !ref.current) return;
      const coarse = window.matchMedia("(pointer: coarse)").matches;

      map = L.map(ref.current, {
        // Su smartphone è bloccata mentre si scorre e si sblocca appena la pagina si ferma (vedi sotto)
        dragging: !coarse,
        touchZoom: true,
        scrollWheelZoom: false, // la rotellina continua a scorrere la pagina
        doubleClickZoom: false, // tocchi rapidi su icone diverse non devono ingrandire la mappa
        zoomControl: true,
        attributionControl: true,
        zoomSnap: 0.25,
      });
      map.attributionControl.setPrefix(false);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
        className: "map-tiles-muted",
      }).addTo(map);

      // Un solo nome aperto alla volta (oltre a quello della casa, sempre visibile)
      const markers: { point: MapPoint; marker: import("leaflet").Marker }[] = [];
      let openId: string | null = null;
      const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      /** Mette il nome dal lato con più spazio, senza uscire dalla mappa né coprire l'etichetta della casa */
      const placeLabel = (poi: Element, point: MapPoint) => {
        if (!map) return;
        const label = poi.querySelector<HTMLElement>(".poi-label");
        const homeLabel = ref.current?.querySelector(".poi-home .poi-label");
        if (!label) return;
        const x = map.latLngToContainerPoint([point.lat, point.lng]).x;
        const width = map.getSize().x;
        const preferred: Array<"left" | "right" | "below" | "above"> = x > width / 2 ? ["left", "right", "below", "above"] : ["right", "left", "below", "above"];
        const mapBox = ref.current!.getBoundingClientRect();
        const tryOn = (side: (typeof preferred)[number]) => {
          poi.classList.remove("poi-open-left", "poi-open-right", "poi-open-below", "poi-open-above");
          poi.classList.add(`poi-open-${side}`);
          const room = side === "left" ? x - 44 : side === "right" ? width - x - 44 : Math.min(x, width - x) * 2 - 16;
          label.style.maxWidth = `${Math.max(90, Math.min(170, room))}px`;
          const box = label.getBoundingClientRect();
          return {
            inside: box.left >= mapBox.left && box.right <= mapBox.right && box.top >= mapBox.top && box.bottom <= mapBox.bottom,
            clear: !homeLabel || !overlaps(box, homeLabel.getBoundingClientRect()),
          };
        };
        // 1° scelta: dentro la mappa e senza coprire la casa; 2°: almeno senza coprire la casa
        const results = preferred.map((side) => ({ side, ...tryOn(side) }));
        const pick = results.find((r) => r.inside && r.clear) ?? results.find((r) => r.clear) ?? results[0];
        tryOn(pick.side);
      };

      const setOpen = (id: string | null) => {
        openId = id;
        for (const { point, marker } of markers) {
          const poi = marker.getElement()?.querySelector(".poi");
          const isOpen = point.id === id;
          poi?.classList.toggle("poi-open", isOpen);
          if (poi && isOpen && map) placeLabel(poi, point);
          marker.setZIndexOffset(point.tier === "home" ? 3000 : isOpen ? 2000 : point.tier === "major" ? 500 : 0);
        }
      };

      for (const p of MAP_POINTS) {
        const marker = L.marker([p.lat, p.lng], {
          icon: L.divIcon({ className: "poi-icon", html: markerHtml(p), iconSize: [30, 30], iconAnchor: [15, 15] }),
          keyboard: false,
          interactive: p.tier !== "home",
          title: p.tier === "home" ? undefined : p.label,
          zIndexOffset: p.tier === "home" ? 3000 : p.tier === "major" ? 500 : 0,
        }).addTo(map);
        if (p.tier !== "home") {
          marker.on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            setOpen(openId === p.id ? null : p.id);
          });
        }
        markers.push({ point: p, marker });
      }
      map.on("click", () => setOpen(null));

      const bounds = L.latLngBounds(MAP_POINTS.map((p) => [p.lat, p.lng] as [number, number]));
      const fitAll = () => map?.fitBounds(bounds, { paddingTopLeft: [62, 22], paddingBottomRight: [26, 34], maxZoom: 16 });
      fitAll();

      const el = ref.current;
      const syncZoom = () => el.classList.toggle("poi-zoom-mid", (map?.getZoom() ?? 0) >= MINOR_ICON_ZOOM);

      map.on("zoomend", syncZoom);
      // Il nome si apre solo toccando l'icona; dopo uno spostamento viene solo riposizionato
      map.on("moveend", () => setOpen(openId));
      syncZoom();

      const touch = coarse ? setupAutoUnlock(el, map, () => fullRef.current) : undefined;
      cleanupTouch = touch?.cleanup;
      // La mappa segue le dimensioni del riquadro (anche entrando e uscendo dallo schermo intero)
      resizeObserver = new ResizeObserver(() => map?.invalidateSize());
      resizeObserver.observe(el);
      refitRef.current = () => {
        map?.invalidateSize();
        fitAll();
        touch?.evaluate();
      };
    })();

    return () => {
      disposed = true;
      cleanupTouch?.();
      resizeObserver?.disconnect();
      map?.remove();
    };
  }, []);

  const open = useCallback(() => {
    window.history.pushState({ ta390MapFull: true }, "");
    setFull(true);
  }, []);
  const close = useCallback(() => {
    // Se l'apertura ha aggiunto un passo alla cronologia lo consuma, così "Indietro" non resta sporco
    if (window.history.state?.ta390MapFull) window.history.back();
    else setFull(false);
  }, []);

  useEffect(() => {
    fullRef.current = full;
    const raf = requestAnimationFrame(() => refitRef.current());
    if (!full) return () => cancelAnimationFrame(raf);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    // Il tasto Indietro del telefono chiude lo schermo intero invece di lasciare il sito
    const onPop = () => setFull(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
    };
  }, [full, close]);

  return (
    <div>
      {/* Segnaposto: a schermo intero la pagina sotto non cambia altezza */}
      {full && <div className="h-[260px] md:h-[340px]" aria-hidden />}
      <div
        className={full ? "map-fullscreen fixed inset-0 z-[60] bg-card" : "overflow-hidden rounded-2xl border border-line bg-card shadow-soft"}
        role={full ? "dialog" : undefined}
        aria-modal={full ? true : undefined}
        aria-label={full ? "Mappa del quartiere a schermo intero" : undefined}
      >
        <div
          ref={ref}
          role="region"
          aria-label="Mappa del quartiere con stazione, scavi, porto, lungomare, svincoli A3, ospedale, negozi, farmacie e scuole"
          className={`neighborhood-map w-full bg-ice ${full ? "h-full" : "h-[260px] md:h-[340px]"}`}
        />
        {full && (
          <button
            type="button"
            onClick={close}
            className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-soft"
          >
            <X className="h-4 w-4" aria-hidden />
            Chiudi
          </button>
        )}
      </div>
      {!full && (
        <button
          type="button"
          onClick={open}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover hover:underline"
        >
          <Maximize2 className="h-4 w-4" aria-hidden />
          Apri mappa a schermo intero
        </button>
      )}
    </div>
  );
}
