"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { MAP_POINTS, type MapPoint } from "@/data/mapPoints";

/** Zoom da cui compaiono i punti secondari (negozi, farmacie, scuole, bar) e poi le loro etichette */
const MINOR_ICON_ZOOM = 14.5;
const MINOR_LABEL_ZOOM = 15.5;

function markerHtml(p: MapPoint) {
  return `<div class="poi poi-${p.tier} poi-${p.side}">
    <span class="poi-dot" aria-hidden="true">${p.emoji}</span>
    <span class="poi-label">${p.label}</span>
  </div>`;
}

/**
 * Mappa OpenStreetMap del quartiere con i punti di interesse reali.
 * Si sposta con un dito (dragging) e si ingrandisce con due dita o con i pulsanti +/−.
 */
export function NeighborhoodMap() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let map: import("leaflet").Map | undefined;

    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !ref.current) return;

      map = L.map(ref.current, {
        dragging: true, // un dito per spostare la mappa
        touchZoom: true,
        scrollWheelZoom: false, // la rotellina continua a scorrere la pagina
        doubleClickZoom: true,
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

      for (const p of MAP_POINTS) {
        L.marker([p.lat, p.lng], {
          icon: L.divIcon({ className: "poi-icon", html: markerHtml(p), iconSize: [30, 30], iconAnchor: [15, 15] }),
          keyboard: false,
          interactive: false,
          zIndexOffset: p.tier === "home" ? 1000 : p.tier === "major" ? 500 : 0,
        }).addTo(map);
      }

      const bounds = L.latLngBounds(MAP_POINTS.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { paddingTopLeft: [62, 22], paddingBottomRight: [26, 34], maxZoom: 16 });

      const el = ref.current;
      const syncZoom = () => {
        const z = map?.getZoom() ?? 0;
        el.classList.toggle("poi-zoom-mid", z >= MINOR_ICON_ZOOM);
        el.classList.toggle("poi-zoom-near", z >= MINOR_LABEL_ZOOM);
      };
      map.on("zoomend", syncZoom);
      syncZoom();
    })();

    return () => {
      disposed = true;
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
