"use client";

import { FileCheck2 } from "lucide-react";
import { useUi } from "./UiProvider";
import { PROPERTY, WHATSAPP_NUMBER } from "@/config/site";
import { galleryData } from "@/data/galleryData";
import { WhatsAppIcon } from "./BookingModal";

/** Messaggio precompilato per chi vuole prima parlarne in famiglia */
const FAMILY_MESSAGE = `Ciao, ho visto il sito dell'appartamento in ${PROPERTY.address}. Potrei ricevere su WhatsApp le planimetrie e il riepilogo dell'immobile per valutarlo in famiglia prima di fissare una visita?`;

const STEPS = [
  { t: "Guarda foto e render", d: `La visita guidata in ${galleryData.length} scatti reali, più le ipotesi di arredo.` },
  { t: "Leggi le Info Utili", d: "Composizione, stato, condominio e documenti: tutto nero su bianco." },
  { t: "Prenota la visita dal vivo", d: "Indica come acquisti e quando preferisci: rispondo su WhatsApp." },
];

export function FinalCta() {
  const { openInfo, openBooking } = useUi();
  return (
    <section className="mx-auto max-w-5xl px-4">
      <div className="overflow-hidden rounded-2xl bg-ink p-6 text-white shadow-soft sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Visite solo in presenza</p>
        <h2 className="mt-2 text-[1.75rem] font-semibold leading-tight text-white sm:text-4xl">
          La vista mare va vissuta dal vivo.
        </h2>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/80">
          Tratti direttamente con i proprietari: nessuna provvigione, nessun intermediario, risposte chiare. Libero subito,
          con rogito e consegna immediata.
        </p>
        <div className="mt-5 flex gap-3 rounded-xl border border-white/15 bg-white/5 p-4">
          <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-white" aria-hidden />
          <p className="min-w-0 text-sm leading-snug text-white/85">
            <strong className="font-semibold text-white">Documentazione già pronta e verificata per il mutuo:</strong>{" "}
            conformità urbanistica e catastale controllata e consegna immediata al
            rogito.
          </p>
        </div>
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
            Prenota la visita · {PROPERTY.apartmentPrice} + garage
          </button>
          <button type="button" onClick={() => openInfo()} className="rounded-xl border border-white/25 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10">
            Apri le Info Utili
          </button>
        </div>
        {/* CTA secondaria a basso attrito: scheda e planimetrie su WhatsApp, senza fissare subito una visita */}
        {(() => {
          const inner = (
            <>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white">
                <WhatsAppIcon className="h-[18px] w-[18px] text-whatsapp" />
              </span>
              <span className="min-w-0 text-left text-sm leading-snug">
                <strong className="font-semibold text-white">Vuoi parlarne in famiglia?</strong>{" "}
                <span className="text-white/80">Ricevi scheda riepilogativa e planimetrie su WhatsApp</span>
              </span>
              <span aria-hidden className="ml-auto shrink-0 text-lg text-white/70">→</span>
            </>
          );
          const cls =
            "mt-3 flex w-full items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 transition hover:bg-white/10";
          return WHATSAPP_NUMBER ? (
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(FAMILY_MESSAGE)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cls}
            >
              {inner}
            </a>
          ) : (
            <button type="button" onClick={openBooking} className={cls}>
              {inner}
            </button>
          );
        })()}
      </div>
    </section>
  );
}
