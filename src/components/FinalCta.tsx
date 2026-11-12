"use client";

import { useUi } from "./UiProvider";
import { PROPERTY } from "@/config/site";

const STEPS = [
  { t: "Guarda foto e render", d: "La visita guidata in 15 scatti reali, più le ipotesi di arredo." },
  { t: "Leggi le Info Utili", d: "Composizione, stato, condominio e documenti: tutto nero su bianco." },
  { t: "Prenota la visita dal vivo", d: "Indica come acquisti e quando preferisci: rispondo su WhatsApp." },
];

export function FinalCta() {
  const { openInfo, openBooking } = useUi();
  return (
    <section className="mx-auto max-w-5xl px-4">
      <div className="overflow-hidden rounded-2xl bg-ink p-6 text-white shadow-soft sm:p-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">Visite solo in presenza</p>
        <h2 className="mt-2 text-[1.75rem] font-semibold leading-tight text-white sm:text-4xl">
          La vista mare va vissuta dal vivo.
        </h2>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/80">
          Tratti direttamente con il proprietario: nessuna provvigione, nessun intermediario, risposte chiare. Libero subito,
          con rogito e consegna immediata.
        </p>
        <ol className="mt-6 grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.t} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <span className="text-sm font-bold text-white/50 tabular-nums">0{i + 1}</span>
              <p className="mt-1 font-bold text-white">{s.t}</p>
              <p className="mt-1 text-sm text-white/70">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={openBooking} className="rounded-xl bg-primary px-6 py-3.5 font-semibold text-white tabular-nums transition hover:bg-primary-hover">
            Prenota la visita · {PROPERTY.price}
          </button>
          <button type="button" onClick={() => openInfo()} className="rounded-xl border border-white/25 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10">
            Apri le Info Utili
          </button>
        </div>
      </div>
    </section>
  );
}
