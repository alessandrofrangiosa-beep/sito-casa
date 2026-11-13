"use client";

import { useEffect } from "react";

/**
 * Fa sempre partire la pagina dall'inizio:
 * - all'apertura ignora eventuali ancore nell'indirizzo (es. un link copiato con "#simula-mutuo")
 *   e la posizione di scorrimento ricordata dal browser;
 * - i link interni (href="#...") scorrono alla sezione senza aggiungere l'ancora all'indirizzo,
 *   così il link condiviso resta quello pulito della home.
 */
export function ScrollManager() {
  useEffect(() => {
    try {
      window.history.scrollRestoration = "manual";
    } catch {
      /* non supportato: nessun problema */
    }
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!link) return;
      const id = decodeURIComponent(link.getAttribute("href")!.slice(1));
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    document.addEventListener("click", onClick);
    let timer: number | undefined;
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      // Blocca lo scorrimento animato verso l'ancora eventualmente già avviato dal browser
      const root = document.documentElement;
      const prev = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      const toTop = () => window.scrollTo(0, 0);
      toTop();
      requestAnimationFrame(toTop);
      timer = window.setTimeout(() => {
        toTop();
        root.style.scrollBehavior = prev;
      }, 120);
    }

    return () => {
      document.removeEventListener("click", onClick);
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
