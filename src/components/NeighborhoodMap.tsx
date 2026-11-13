"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { HOME, MAP_POINTS, type MapPoint } from "@/data/mapPoints";

/** Zoom da cui compaiono i punti secondari (negozi, farmacie, scuole, bar) */
const MINOR_ICON_ZOOM = 14.5;
/** Punti entro questa distanza dalla casa rientrano nella vista iniziale */
const NEAR_RADIUS_M = 1100;
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
            /**
       * Apre il nome dal lato opposto alla casa, così non copre mai né l'icona né l'etichetta della casa.
       * Se da quel lato uscirebbe dalla mappa prova i lati laterali (sempre lontano dalla casa) e per ultimo quello verso la casa.
       */
      type Side = "left" | "right" | "below" | "above";
      const placeLabel = (poi: Element, point: MapPoint) => {
        if (!map) return;
        const label = poi.querySelector<HTMLElement>(".poi-label");
        if (!label) return;
        const pos = map.latLngToContainerPoint([point.lat, point.lng]);
        const home = map.latLngToContainerPoint([HOME.lat, HOME.lng]);
        const width = map.getSize().x;
        const dx = pos.x - home.x;
        const dy = pos.y - home.y;
        const h: Side = dx >= 0 ? "right" : "left";
        const v: Side = dy >= 0 ? "below" : "above";
        const opposite = { left: "right", right: "left", below: "above", above: "below" } as const;
        // Lato lontano dalla casa sull'asse principale, poi quello sull'altro asse, poi i due verso la casa
        const order: Side[] = Math.abs(dx) >= Math.abs(dy) ? [h, v, opposite[v], opposite[h]] : [v, h, opposite[h], opposite[v]];
        const mapBox = ref.current!.getBoundingClientRect();
        // Ingombro della casa (icona + nome) con un piccolo margine
        const homeBoxes = [...(ref.current?.querySelectorAll(".poi-home .poi-dot, .poi-home .poi-label") ?? [])].map((e) => e.getBoundingClientRect());
        const pad = 4;
        const hitsHome = (b: DOMRect) =>
          homeBoxes.some((hb) => b.left < hb.right + pad && hb.left - pad < b.right && b.top < hb.bottom + pad && hb.top - pad < b.bottom);
        const tryOn = (side: Side) => {
          poi.classList.remove("poi-open-left", "poi-open-right", "poi-open-below", "poi-open-above");
          poi.classList.add(`poi-open-${side}`);
          const room = side === "left" ? pos.x - 44 : side === "right" ? width - pos.x - 44 : Math.min(pos.x, width - pos.x) * 2 - 16;
          label.style.maxWidth = `${Math.max(90, Math.min(170, room))}px`;
          label.style.marginLeft = label.style.marginTop = "0px";
          // Vicino ai bordi il nome scorre lungo il proprio lato per restare tutto dentro la mappa
          let box = label.getBoundingClientRect();
          const fit = (lo: number, hi: number, min: number, max: number) => (lo < min ? min - lo : hi > max ? Math.max(max - hi, min - lo) : 0);
          if (side === "above" || side === "below") {
            const shift = fit(box.left, box.right, mapBox.left + 4, mapBox.right - 4);
            if (shift) label.style.marginLeft = `${shift}px`;
          } else {
            const shift = fit(box.top, box.bottom, mapBox.top + 4, mapBox.bottom - 4);
            if (shift) label.style.marginTop = `${shift}px`;
          }
          box = label.getBoundingClientRect();
          return {
            inside: box.left >= mapBox.left && box.right <= mapBox.right && box.top >= mapBox.top && box.bottom <= mapBox.bottom,
            clear: !hitsHome(box),
          };
        };
        // 1° scelta: senza toccare la casa e dentro la mappa; 2°: almeno senza toccare la casa
        const results = order.map((side) => ({ side, ...tryOn(side) }));
        const pick = results.find((r) => r.inside && r.clear) ?? results.find((r) => r.clear) ?? results[0];
        tryOn(pick.side);
      };

      /** Se il nome appena aperto tocca il bordo, sposta un poco la mappa per mostrarlo intero */
      const revealLabel = (poi: Element) => {
        const label = poi.querySelector(".poi-label");
        if (!map || !label || !ref.current) return;
        const m = ref.current.getBoundingClientRect();
        const a = label.getBoundingClientRect();
        const edge = 8;
        const dx = a.right > m.right - edge ? a.right - (m.right - edge) : a.left < m.left + edge ? a.left - (m.left + edge) : 0;
        const dy = a.bottom > m.bottom - edge ? a.bottom - (m.bottom - edge) : a.top < m.top + edge ? a.top - (m.top + edge) : 0;
        if (dx || dy) map.panBy([dx, dy], { animate: true, duration: 0.25 });
      };

      const setOpen = (id: string | null, fromTap = false) => {
        openId = id;
        for (const { point, marker } of markers) {
          const poi = marker.getElement()?.querySelector(".poi");
          const isOpen = point.id === id;
          poi?.classList.toggle("poi-open", isOpen);
          if (poi && isOpen && map) {
            placeLabel(poi, point);
            if (fromTap) revealLabel(poi);
          }
          marker.setZIndexOffset(isOpen ? 4000 : point.tier === "home" ? 3000 : point.tier === "major" ? 500 : 0);
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
            setOpen(openId === p.id ? null : p.id, true);
          });
        }
        markers.push({ point: p, marker });
      }
      map.on("click", () => setOpen(null));

      // Vista iniziale ravvicinata sul quartiere (negozi, farmacie, scuole già visibili);
      // svincoli A3 e stazione FS si vedono allontanando lo zoom
      const near = MAP_POINTS.filter((p) => p.tier === "home" || (p.meters ?? 0) <= NEAR_RADIUS_M);
      const nearBounds = L.latLngBounds(near.map((p) => [p.lat, p.lng] as [number, number]));
      const fitAll = () => {
        if (!map) return;
        const z = map.getBoundsZoom(nearBounds, false, L.point(60, 50));
        const zoom = Math.min(16, Math.max(MINOR_ICON_ZOOM, Math.floor(z * 4) / 4));
        // Centro un po' spostato verso la casa, così resta ben visibile anche quando non entra tutto
        const c = nearBounds.getCenter();
        map.setView([(c.lat + HOME.lat) / 2, (c.lng + HOME.lng) / 2], zoom, { animate: false });
      };
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
        className={
          full
            ? "map-fullscreen fixed inset-0 z-[60] bg-card"
            : "h-[260px] overflow-hidden rounded-2xl border border-line bg-card shadow-soft md:h-[340px]"
        }
        role={full ? "dialog" : undefined}
        aria-modal={full ? true : undefined}
        aria-label={full ? "Mappa del quartiere a schermo intero" : undefined}
      >
        <div
          ref={ref}
          role="region"
          aria-label="Mappa del quartiere con stazione, scavi, porto, lungomare, svincoli A3, ospedale, negozi, farmacie e scuole"
          // Classi fisse: Leaflet aggiunge le sue a questo elemento e React non deve sovrascriverle
          className="neighborhood-map h-full w-full bg-ice"
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
