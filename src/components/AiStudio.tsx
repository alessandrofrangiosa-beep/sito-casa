"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Clock3, RefreshCw, Wand2 } from "lucide-react";
import { aiBaseRooms, aiStyles } from "@/data/galleryData";
import { DaControllare } from "./DaControllare";
import { useUi } from "./UiProvider";

const MAX_TRIES = 3;
const PROMPT_MIN = 5;
const PROMPT_MAX = 180;
const LS_USED = "ta390_ai_render_used_v2";
const IS_DEV = process.env.NODE_ENV !== "production";
const MSG_UNAVAILABLE =
  "Simulazioni AI temporaneamente non disponibili: tieni premuto «Premi: Render 3D» sulle foto reali per vedere i render 3D già pronti.";

function readUsed(): number {
  try {
    return Math.min(MAX_TRIES, Math.max(0, Number(window.localStorage.getItem(LS_USED) ?? 0) || 0));
  } catch {
    return 0;
  }
}
function writeUsed(n: number) {
  try {
    window.localStorage.setItem(LS_USED, String(n));
  } catch {
    /* modalità privata: il limite resta comunque applicato dal server */
  }
}

type Result = { image: string; roomId: string; prompt: string };

function BeforeAfter({ before, after, label }: { before: string; after: string; label: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative aspect-[2/3] w-full select-none overflow-hidden rounded-2xl border border-line bg-ink">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={`Il tuo progetto: ${label}`} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={before} alt="Foto reale di partenza" fill sizes="(min-width:768px) 600px, 100vw" className="object-cover" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }}>
        <span className="absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-xs font-bold text-ink shadow-soft">
          ⇆
        </span>
      </div>
      <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2.5 py-1 text-[12px] font-semibold text-white">Oggi</span>
      <span className="absolute right-2 top-2 rounded-full bg-ink/70 px-2.5 py-1 text-[12px] font-semibold text-white">
        ✨ Il tuo progetto
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Confronta foto reale e render"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

/** Riquadro mostrato quando il servizio non è attivo (chiave mancante o credito esaurito) */
function AiUnavailable({ onShowRenders }: { onShowRenders?: () => void }) {
  return (
    <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary-soft p-4" role="status">
      <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0">
        <p className="text-[15px] leading-snug text-ink">{MSG_UNAVAILABLE}</p>
        {onShowRenders && (
          <button
            type="button"
            onClick={onShowRenders}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            ✨ Vedi i Render 3D sulle foto
          </button>
        )}
      </div>
    </div>
  );
}

export function AiStudio({ aiEnabled = false, onShowRenders }: { aiEnabled?: boolean; onShowRenders?: () => void }) {
  const { openBooking } = useUi();
  const [available, setAvailable] = useState(aiEnabled);
  const [roomId, setRoomId] = useState(aiBaseRooms[0].id);
  const [prompt, setPrompt] = useState(aiStyles[1].prompt);
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => setUsed(readUsed()), []);

  const remaining = Math.max(0, MAX_TRIES - used);
  const trimmed = prompt.trim();
  const promptValid = trimmed.length >= PROMPT_MIN && trimmed.length <= PROMPT_MAX;
  const room = aiBaseRooms.find((r) => r.id === roomId)!;

  const syncRemaining = (r: unknown) => {
    if (typeof r === "number") {
      const u = Math.min(MAX_TRIES, Math.max(0, MAX_TRIES - r));
      setUsed(u);
      writeUsed(u);
    }
  };

  async function generate() {
    setError(null);
    if (!promptValid || remaining === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, userPrompt: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        image?: string;
        remaining?: number;
        error?: string;
        message?: string;
      };
      if (!res.ok || !data.image) {
        if (data.error === "unavailable") setAvailable(false);
        else if (data.error === "visitor_limit") syncRemaining(0);
        else setError(data.message ?? "La generazione non è riuscita. Riprova tra qualche istante.");
        return;
      }
      setResult({ image: data.image, roomId, prompt: trimmed });
      syncRemaining(data.remaining);
    } catch {
      setError("Connessione non riuscita. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  const resultRoom = result ? aiBaseRooms.find((r) => r.id === result.roomId)! : null;

  return (
    <div className="space-y-6 rounded-2xl border border-line bg-card p-4 shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Arredala tu · su misura per te</p>
          <h3 className="text-2xl font-semibold leading-tight">Progetta la casa come la vuoi tu</h3>
          <p className="mt-1 text-sm leading-snug text-slate-ink">
            Scegli la stanza e lo stile, poi descrivi i tuoi desideri: colori, materiali, mobili. Ottieni un&apos;anteprima
            pensata solo per te.
          </p>
        </div>
      </div>

      {/* 1. Stanza */}
      <section>
        <p className="mb-2 text-sm font-bold text-ink">1 · Scegli la stanza</p>
        <div className="grid grid-cols-3 gap-2">
          {aiBaseRooms.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRoomId(r.id)}
              aria-pressed={roomId === r.id}
              className={`overflow-hidden rounded-xl border-2 text-left transition ${
                roomId === r.id ? "border-primary" : "border-line"
              }`}
            >
              <span className="relative block aspect-square">
                <Image src={r.src} alt={r.label} fill sizes="140px" className="object-cover" />
              </span>
              <span className="block truncate px-1.5 py-1.5 text-[12px] font-semibold text-ink sm:text-xs">{r.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 2. Stile e descrizione */}
      <section>
        <p className="mb-2 text-sm font-bold text-ink">2 · Stile rapido e descrizione</p>
        <div className="grid grid-cols-2 gap-2">
          {aiStyles.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setPrompt(s.prompt)}
              aria-pressed={prompt === s.prompt}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                aiStyles.length % 2 === 1 && s.id === aiStyles[aiStyles.length - 1].id ? "col-span-2" : ""
              } ${
                prompt === s.prompt ? "border-primary bg-primary text-white" : "border-line bg-ice text-ink"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <label className="mt-3 block" htmlFor="arredala-prompt">
          <span className="mb-1.5 flex items-baseline justify-between text-xs font-semibold text-slate-ink">
            <span>Descrivi cosa desideri (puoi modificare il testo)</span>
            <span className={`tabular-nums ${trimmed.length > PROMPT_MAX ? "text-red-600" : ""}`}>
              {trimmed.length}/{PROMPT_MAX}
            </span>
          </span>
          <textarea
            id="arredala-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.replace(/[\r\n\t]+/g, " "))}
            maxLength={PROMPT_MAX}
            rows={4}
            placeholder="Es. divano angolare blu, parquet chiaro, libreria a parete"
            className="w-full resize-none rounded-xl border border-line bg-ice px-3.5 py-3 text-[15px] outline-none focus:border-primary"
          />
        </label>
        {trimmed.length > 0 && trimmed.length < PROMPT_MIN && (
          <p className="mt-1 text-xs text-slate-ink">Scrivi almeno {PROMPT_MIN} caratteri.</p>
        )}
      </section>

      {/* 3. Genera */}
      {!available ? (
        <>
          <AiUnavailable onShowRenders={onShowRenders} />
          {IS_DEV && !aiEnabled && <DaControllare block>Inserire OPENAI_API_KEY in .env.local</DaControllare>}
        </>
      ) : remaining === 0 ? (
        <div className="rounded-2xl border border-line bg-ice p-4 text-center">
          <p className="font-semibold text-ink">Hai usato le {MAX_TRIES} prove disponibili.</p>
          <p className="mt-1 text-sm text-slate-ink">Il modo migliore per immaginarla ora è vederla dal vivo.</p>
          <button
            type="button"
            onClick={openBooking}
            className="mt-3 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover"
          >
            Prenota una visita
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-center">
            <span className="inline-block rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary tabular-nums">
              {remaining} di {MAX_TRIES} prove rimaste
            </span>
          </p>
          <button
            type="button"
            onClick={generate}
            disabled={loading || !promptValid}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-primary-hover disabled:opacity-60"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" /> Sto arredando: {room.label.toLowerCase()}… (30-60 s)
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5" /> Genera il mio render
              </>
            )}
          </button>
          <p className="text-center text-xs leading-snug text-slate-ink">
            Ipotesi illustrativa generata dall&apos;AI: struttura, infissi, pavimenti e vista mare reali restano invariati.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm font-semibold text-red-600" role="alert">
          {error}
        </p>
      )}

      {result && resultRoom && (
        <section className="space-y-3">
          <p className="text-sm font-bold text-ink">Il tuo progetto · {resultRoom.label}</p>
          <BeforeAfter before={resultRoom.src} after={result.image} label={`${resultRoom.label}: ${result.prompt}`} />
          <p className="text-xs text-slate-ink">
            Trascina per confrontare. Immagine generata dall&apos;intelligenza artificiale: ipotesi di arredo, non
            rappresenta lo stato attuale dell&apos;immobile.
          </p>
          <button
            type="button"
            onClick={openBooking}
            className="w-full rounded-xl border border-primary px-5 py-3.5 font-semibold text-primary transition hover:bg-primary-soft"
          >
            Ti piace? Vieni a vederla dal vivo →
          </button>
        </section>
      )}
    </div>
  );
}
