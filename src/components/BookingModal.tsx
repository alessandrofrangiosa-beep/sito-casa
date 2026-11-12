"use client";

import { useMemo, useState } from "react";
import { CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import { Sheet } from "./Sheet";
import { DaControllare } from "./DaControllare";
import { PROPERTY, WHATSAPP_NUMBER } from "@/config/site";
import { galleryData } from "@/data/galleryData";
import { useUi } from "./UiProvider";

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const SLOTS = ["Mattina", "Pomeriggio", "Sera"];
const TIMING = ["Entro 3 mesi", "Entro 6 mesi", "Sto ancora valutando"];

type Payment = "Mutuo" | "Liquidità" | "";
type MortgageStatus = "già pre-approvato" | "da richiedere" | "";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition ${
        active ? "border-gulf bg-gulf text-white" : "border-line bg-card text-slate-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="flex items-center gap-2 text-sm font-bold text-gulf">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-terra text-xs text-white">{n}</span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function CheckLine({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-card p-3.5 text-[15px] leading-snug">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[#15803D]"
      />
      <span>{children}</span>
    </label>
  );
}

export function BookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { photosSeen, infoOpened, openInfo } = useUi();
  const [name, setName] = useState("");
  const [sawPhotos, setSawPhotos] = useState(false);
  const [readInfo, setReadInfo] = useState(false);
  const [payment, setPayment] = useState<Payment>("");
  const [mortgage, setMortgage] = useState<MortgageStatus>("");
  const [days, setDays] = useState<string[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [timing, setTiming] = useState("");
  const [touched, setTouched] = useState(false);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!name.trim()) m.push("nome");
    if (!sawPhotos || !readInfo) m.push("conferme");
    if (!payment) m.push("modalità di acquisto");
    if (payment === "Mutuo" && !mortgage) m.push("stato del mutuo");
    if (days.length === 0) m.push("giorni preferiti");
    return m;
  }, [name, sawPhotos, readInfo, payment, mortgage, days]);

  const message = useMemo(() => {
    const pay = payment === "Mutuo" ? `Mutuo (${mortgage || "—"})` : payment || "—";
    return [
      `Buongiorno, sono ${name.trim() || "—"}.`,
      `Vorrei prenotare una VISITA DAL VIVO dell'appartamento in ${PROPERTY.address}, Torre Annunziata (${PROPERTY.price} ${PROPERTY.priceNote}).`,
      "",
      "✅ Ho visionato le foto e le Info Utili del sito",
      `💶 Modalità di acquisto: ${pay}`,
      timing ? `⏱️ Tempistica: ${timing}` : null,
      `📅 Giorni preferiti: ${days.join(", ") || "—"}`,
      slots.length ? `🕒 Fascia oraria: ${slots.join(", ")}` : null,
      "",
      "Attendo conferma di data e orario. Grazie!",
    ]
      .filter((l) => l !== null)
      .join("\n");
  }, [name, payment, mortgage, timing, days, slots]);

  const waHref = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
    : null;

  const submit = () => {
    setTouched(true);
    if (missing.length || !waHref) return;
    window.open(waHref, "_blank", "noopener,noreferrer");
  };

  return (
    <Sheet open={open} onClose={onClose} title="Prenota una visita dal vivo" eyebrow="Pre-qualificazione • 1 minuto" side="right">
      <div className="space-y-6 px-5 py-5 pb-safe">
        <div className="flex gap-3 rounded-2xl border border-emerald-brand/30 bg-emerald-soft p-4 text-sm leading-relaxed text-ink">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-brand" />
          <p>
            Le visite si svolgono <strong>solo in presenza</strong>, su appuntamento, direttamente con il proprietario
            (nessuna videochiamata). Per rispetto del tempo di tutti, ti chiediamo poche informazioni prima di fissare.
          </p>
        </div>

        <Step n={1} title="Come ti chiami?">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Nome e cognome"
            className="w-full rounded-xl border border-line bg-card px-4 py-3 text-base outline-none focus:border-gulf"
          />
        </Step>

        <Step n={2} title="Hai già visto tutto?">
          <CheckLine checked={sawPhotos} onChange={setSawPhotos}>
            Ho visionato le foto dell&apos;appartamento{" "}
            <span className="text-slate-ink">
              ({Math.min(photosSeen, galleryData.length)}/{galleryData.length} viste)
            </span>
          </CheckLine>
          <CheckLine checked={readInfo} onChange={setReadInfo}>
            Ho letto le Info Utili (composizione, stato, condominio, documenti){" "}
            {!infoOpened && (
              <button type="button" onClick={() => openInfo()} className="font-semibold text-terra underline">
                Aprile ora
              </button>
            )}
          </CheckLine>
        </Step>

        <Step n={3} title="Come pensi di acquistare?">
          <div className="grid grid-cols-2 gap-2">
            {(["Mutuo", "Liquidità"] as const).map((p) => (
              <Chip key={p} active={payment === p} onClick={() => setPayment(p)}>
                {p === "Mutuo" ? "🏦 Mutuo" : "💶 Liquidità"}
              </Chip>
            ))}
          </div>
          {payment === "Mutuo" && (
            <div className="grid grid-cols-2 gap-2">
              {(["già pre-approvato", "da richiedere"] as const).map((m) => (
                <Chip key={m} active={mortgage === m} onClick={() => setMortgage(m)}>
                  {m === "già pre-approvato" ? "Già pre-approvato" : "Da richiedere"}
                </Chip>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {TIMING.map((t) => (
              <Chip key={t} active={timing === t} onClick={() => setTiming(timing === t ? "" : t)}>
                {t}
              </Chip>
            ))}
          </div>
        </Step>

        <Step n={4} title="Quando preferisci venire?">
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={days.includes(d)}
                onClick={() => toggle(days, setDays, d)}
                className={`rounded-xl border py-2.5 text-xs font-bold transition ${
                  days.includes(d) ? "border-gulf bg-gulf text-white" : "border-line bg-card text-slate-ink"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {SLOTS.map((s) => (
              <Chip key={s} active={slots.includes(s)} onClick={() => toggle(slots, setSlots, s)}>
                {s}
              </Chip>
            ))}
          </div>
        </Step>

        <div className="rounded-2xl border border-line bg-card p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-ink">
            <CalendarDays className="h-4 w-4 text-terra" /> Anteprima messaggio WhatsApp
          </p>
          <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-ink">{message}</pre>
        </div>

        {touched && missing.length > 0 && (
          <p className="text-sm font-semibold text-red-600" role="alert">
            Completa: {missing.join(", ")}.
          </p>
        )}

        {!WHATSAPP_NUMBER && <DaControllare block>Inserire numero WhatsApp</DaControllare>}

        <button
          type="button"
          onClick={submit}
          disabled={!waHref}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-brand px-5 py-4 text-base font-bold text-white shadow-soft disabled:opacity-50"
        >
          <WhatsAppIcon /> Invia richiesta su WhatsApp
        </button>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-ink">
          <MapPin className="h-3.5 w-3.5" /> {PROPERTY.address}, {PROPERTY.city}
        </p>
      </div>
    </Sheet>
  );
}

export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.01c0-5.2 4.23-9.43 9.44-9.43a9.38 9.38 0 0 1 9.42 9.44c0 5.2-4.23 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.05.72C5.8.72.7 5.8.7 12.05c0 2 .52 3.95 1.52 5.67L.6 23.4l5.81-1.52a11.33 11.33 0 0 0 5.63 1.43h.01c6.25 0 11.34-5.08 11.34-11.33 0-3.03-1.18-5.87-3.32-8.01" />
    </svg>
  );
}
