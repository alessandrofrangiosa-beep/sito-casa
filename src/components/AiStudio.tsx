"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Lock, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { aiBaseRooms, aiStyles } from "@/data/galleryData";
import { AI_BONUS_RENDERS, AI_FREE_RENDERS } from "@/config/site";
import { DaControllare } from "./DaControllare";
import { useUi } from "./UiProvider";

const LS_COUNT = "ta390_ai_renders";
const LS_UNLOCK = "ta390_ai_unlocked";

function readLs(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLs(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* modalità privata: il limite resta comunque applicato dal cookie lato server */
  }
}

type Result = { image: string; roomId: string; styleLabel: string };

function BeforeAfter({ before, after, label }: { before: string; after: string; label: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-line bg-ink select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={`Render AI: ${label}`} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={before} alt="Foto reale di partenza" fill sizes="(min-width:768px) 600px, 100vw" className="object-cover" />
      </div>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-xs font-bold text-ink shadow-soft">
          ⇆
        </span>
      </div>
      <span className="absolute top-2 left-2 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white">Oggi</span>
      <span className="absolute top-2 right-2 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-semibold text-white">✨ Render AI</span>
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

export function AiStudio() {
  const { openBooking } = useUi();
  const [roomId, setRoomId] = useState(aiBaseRooms[0].id);
  const [styleId, setStyleId] = useState<string | null>(aiStyles[1].id);
  const [prompt, setPrompt] = useState("");
  const [used, setUsed] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingKey, setMissingKey] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    setUsed(Number(readLs(LS_COUNT) ?? 0) || 0);
    setUnlocked(readLs(LS_UNLOCK) === "1");
  }, []);

  const limit = AI_FREE_RENDERS + (unlocked ? AI_BONUS_RENDERS : 0);
  const remaining = Math.max(0, limit - used);
  const exhausted = unlocked && remaining === 0;
  const room = aiBaseRooms.find((r) => r.id === roomId)!;
  const style = aiStyles.find((s) => s.id === styleId);

  async function generate(withPhone = false) {
    setError(null);
    setMissingKey(false);
    if (!withPhone && remaining === 0) {
      if (!unlocked) setShowUnlock(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/generate-render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          styleId,
          prompt,
          ...(withPhone ? { phone, consent } : {}),
        }),
      });
      const data = await res.json();
      if (withPhone && data.error !== "invalid_phone") {
        setUnlocked(true);
        writeLs(LS_UNLOCK, "1");
        setShowUnlock(false);
      }
      if (!res.ok) {
        if (data.error === "needs_unlock") {
          setUsed(AI_FREE_RENDERS);
          writeLs(LS_COUNT, String(AI_FREE_RENDERS));
          setShowUnlock(true);
        } else if (data.error === "limit_reached") {
          setUsed(AI_FREE_RENDERS + AI_BONUS_RENDERS);
          writeLs(LS_COUNT, String(AI_FREE_RENDERS + AI_BONUS_RENDERS));
        } else if (data.error === "missing_api_key") {
          setMissingKey(true);
        } else {
          setError(data.message ?? "Errore imprevisto.");
        }
        return;
      }
      setResult({ image: data.image, roomId, styleLabel: style?.label ?? "Personalizzato" });
      setUsed(data.used);
      writeLs(LS_COUNT, String(data.used));
      if (data.unlocked) {
        setUnlocked(true);
        writeLs(LS_UNLOCK, "1");
      }
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
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Studio interattivo</p>
          <h3 className="text-2xl font-semibold leading-tight">Immagina la casa con il tuo stile</h3>
        </div>
        <span className="shrink-0 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary">
          {remaining}/{limit} {unlocked ? "render" : "gratis"}
        </span>
      </div>

      {/* 1. Stanza */}
      <section>
        <p className="mb-2 text-sm font-bold text-ink">1 · Scegli la stanza</p>
        <div className="grid grid-cols-4 gap-2">
          {aiBaseRooms.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRoomId(r.id)}
              aria-pressed={roomId === r.id}
              className={`group overflow-hidden rounded-xl border-2 text-left transition ${
                roomId === r.id ? "border-primary" : "border-line"
              }`}
            >
              <span className="relative block aspect-square">
                <Image src={r.src} alt={r.label} fill sizes="120px" className="object-cover" />
              </span>
              <span className="block truncate px-1.5 py-1.5 text-[11px] font-semibold text-ink sm:text-xs">{r.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 2. Stile */}
      <section>
        <p className="mb-2 text-sm font-bold text-ink">2 · Stile rapido</p>
        <div className="grid grid-cols-2 gap-2">
          {aiStyles.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyleId(styleId === s.id ? null : s.id)}
              aria-pressed={styleId === s.id}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                styleId === s.id ? "border-primary bg-primary text-white" : "border-line bg-ice text-ink"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-ink">…e/o descrivi cosa desideri (facoltativo)</span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 280))}
            rows={2}
            placeholder="Es. divano angolare blu, parquet chiaro, libreria a parete"
            className="w-full resize-none rounded-xl border border-line bg-ice px-3.5 py-3 text-[15px] outline-none focus:border-primary"
          />
        </label>
        <p className="mt-1 text-xs text-slate-ink">Pareti, finestre e vista mare restano quelle reali: cambia solo l&apos;arredo.</p>
      </section>

      {/* 3. Genera */}
      {!showUnlock && !exhausted && (
        <button
          type="button"
          onClick={() => generate()}
          disabled={loading || (!styleId && !prompt.trim())}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-primary-hover disabled:opacity-60"
        >
          {loading ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" /> Sto arredando la {room.label.toLowerCase()}… (20-40 s)
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5" /> Genera il mio render
            </>
          )}
        </button>
      )}

      {missingKey && <DaControllare block>Inserire API Key fal.ai / OpenAI in .env.local</DaControllare>}
      {error && <p className="text-sm font-semibold text-red-600" role="alert">{error}</p>}

      {showUnlock && !unlocked && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generate(true);
          }}
          className="space-y-3 rounded-2xl border border-primary/20 bg-primary-soft p-4"
        >
          <p className="flex items-center gap-2 font-semibold text-ink">
            <Lock className="h-4 w-4 text-primary" /> Hai usato i {AI_FREE_RENDERS} render gratuiti
          </p>
          <p className="text-sm text-ink">
            Lascia il tuo numero WhatsApp per sbloccare <strong>altri {AI_BONUS_RENDERS} render</strong>: ti
            ricontatterà solo il proprietario, esclusivamente per questo immobile.
          </p>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+39 333 123 4567"
            className="w-full rounded-xl border border-line bg-card px-4 py-3 text-base outline-none focus:border-primary"
          />
          <label className="flex items-start gap-2.5 text-xs leading-snug text-slate-ink">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#0E6BA8]"
            />
            Acconsento a essere contattato su WhatsApp dal proprietario per informazioni su questo immobile. Il numero
            non sarà ceduto a terzi.
          </label>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
          >
            {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            Sblocca {AI_BONUS_RENDERS} render e genera
          </button>
        </form>
      )}

      {exhausted && (
        <div className="rounded-2xl border border-line bg-ice p-4 text-center">
          <p className="font-semibold text-ink">Hai esplorato tutti i render disponibili.</p>
          <p className="mt-1 text-sm text-slate-ink">Il modo migliore per immaginarla ora è vederla dal vivo.</p>
          <button type="button" onClick={openBooking} className="mt-3 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover">
            Prenota una visita
          </button>
        </div>
      )}

      {result && resultRoom && (
        <section className="space-y-3">
          <p className="text-sm font-bold text-ink">
            Il tuo render · {resultRoom.label} · {result.styleLabel}
          </p>
          <BeforeAfter before={resultRoom.src} after={result.image} label={`${resultRoom.label} ${result.styleLabel}`} />
          <p className="text-xs text-slate-ink">
            Trascina per confrontare. Immagine generata dall&apos;intelligenza artificiale: ipotesi di arredo, non
            rappresenta lo stato attuale dell&apos;immobile.
          </p>
          <button type="button" onClick={openBooking} className="w-full rounded-xl border border-primary px-5 py-3.5 font-semibold text-primary transition hover:bg-primary-soft">
            Ti piace? Vieni a vederla dal vivo →
          </button>
        </section>
      )}
    </div>
  );
}
