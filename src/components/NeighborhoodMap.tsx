"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { MAP_POINTS, type MapPoint } from "@/data/mapPoints";

/** Zoom da cui compaiono i punti secondari (negozi, farmacie, scuole, bar) */
const MINOR_ICON_ZOOM = 14.5;
/** Su touch: la mappa si sblocca appena la pagina smette di scorrere, se è visibile almeno per questa quota */
const UNLOCK_VISIBLE_RATIO = 0.9;
/** Millisecondi senza eventi di scorrimento per considerare la pagina ferma (copre anche lo scorrimento a inerzia) */
const SCROLL_IDLE_MS = 120;

/** Distanza in pixel dal centro entro cui il nome di un punto si apre da solo */
const CENTER_RADIUS_PX = 46;

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
 */
function setupAutoUnlock(el: HTMLElement, map: import("leaflet").Map) {
  let idleTimer: number | undefined;

  const visibleRatio = () => {
    const r = el.getBoundingClientRect();
    if (r.height <= 0) return 0;
    const visible = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
    return Math.max(0, visible) / r.height;
  };
  const setLocked = (locked: boolean) => {
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

  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", evaluate);
    window.clearTimeout(idleTimer);
  };
}

/**
 * Mappa OpenStreetMap del quartiere con i punti di interesse reali.
 * Su smartphone si sposta con un dito appena la pagina smette di scorrere con la mappa ben visibile; zoom con due dita o +/−.
 */
export function NeighborhoodMap() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | undefined;
    let cleanupTouch: (() => void) | undefined;

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
      map.fitBounds(bounds, { paddingTopLeft: [62, 22], paddingBottomRight: [26, 34], maxZoom: 16 });

      const el = ref.current;
      const syncZoom = () => el.classList.toggle("poi-zoom-mid", (map?.getZoom() ?? 0) >= MINOR_ICON_ZOOM);

      // Apre in automatico il nome del punto più vicino al centro della mappa
      const openNearestToCenter = () => {
        if (!map) return;
        const center = map.getSize().divideBy(2);
        const showMinor = map.getZoom() >= MINOR_ICON_ZOOM;
        let best: { id: string; d: number } | null = null;
        for (const { point } of markers) {
          if (point.tier === "home" || (point.tier === "minor" && !showMinor)) continue;
          const d = map.latLngToContainerPoint([point.lat, point.lng]).distanceTo(center);
          if (d <= CENTER_RADIUS_PX && (!best || d < best.d)) best = { id: point.id, d };
        }
        setOpen(best?.id ?? null);
      };

      map.on("zoomend", syncZoom);
      map.on("moveend", openNearestToCenter);
      syncZoom();
      openNearestToCenter();

      if (coarse) cleanupTouch = setupAutoUnlock(el, map);
    })();

    return () => {
      disposed = true;
      cleanupTouch?.();
      map?.remove();
    };
  }, []);

  return (
    <div
      ref={ref}
      role="region"
      aria-label="Mappa del quartiere con stazione, scavi, porto, lungomare, svincoli A3, ospedale, negozi, farmacie e scuole"
      className="neighborhood-map h-[260px] w-full bg-ice md:h-[340px]"
    />
  );
}
