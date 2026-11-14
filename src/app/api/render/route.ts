export const maxDuration = 60;

/**
 * POST /api/render — "Arredala tu": render AI di una stanza reale con OpenAI gpt-image-1.
 *
 * Sicurezza:
 *  1. La chiave è letta SOLO qui, da process.env.OPENAI_API_KEY, e non viene mai loggata né restituita.
 *  2. Body accettato: solo { roomId, userPrompt }. roomId è mappato su una whitelist di file locali;
 *     userPrompt è sanitizzato (5-180 caratteri, niente caratteri di controllo, URL o base64).
 *     Nessuna immagine o URL arriva dal browser: la foto sorgente è letta dal filesystem del server.
 *  3. Solo POST con Content-Type application/json, da un'origine autorizzata (Origin + Referer).
 *  4. Cache in memoria per combinazioni identiche, max 3 generazioni per IP, max 25 al giorno in totale.
 *  5. Chiave mancante o credito esaurito → messaggio cortese, senza dettagli tecnici.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Configurazione ──────────────────────────────────────────────────────────

const OPENAI_ENDPOINT = "https://api.openai.com/v1/images/edits";
const OPENAI_MODEL = "gpt-image-1";

/** Whitelist chiusa: roomId → foto reale in /public/images/attuali/ */
const ROOM_FILES: Readonly<Record<string, string>> = Object.freeze({
  soggiorno: "03-soggiorno.jpg",
  cucina: "04-cucina.jpg",
  camera: "09-camera-matrimoniale.jpg",
  "stanza-balcone": "10-stanza-accessoria-1.jpg",
  "stanza-soleggiata": "11-stanza-accessoria-2.jpg",
});
const PHOTOS_DIR = path.join(process.cwd(), "public", "images", "attuali");

const PROMPT_MIN = 5;
const PROMPT_MAX = 180;
const MAX_BODY_BYTES = 2_000;
const PER_VISITOR_LIMIT = 3;
const GLOBAL_LIMIT_24H = 25;
const DAY_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 40;

const PRODUCTION_ORIGIN = "https://sito-casa.vercel.app";
const DEV_ORIGIN = "http://localhost:3000";

const MSG_UNAVAILABLE =
  "Simulazioni AI temporaneamente non disponibili: tieni premuto ✨ sulle foto reali per vedere i render 3D già pronti.";

// ─── Stato in memoria (per istanza del server) ──────────────────────────────

type CacheEntry = { image: string };
const cache = new Map<string, CacheEntry>();
const visitors = new Map<string, number>(); // ip → generazioni consumate
let globalLog: number[] = []; // timestamp delle generazioni nelle ultime 24 ore

// ─── Utilità ─────────────────────────────────────────────────────────────────

function allowedOrigins(): string[] {
  const list = [PRODUCTION_ORIGIN];
  if (process.env.NODE_ENV !== "production") list.push(DEV_ORIGIN);
  return list;
}

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

function fail(status: number, error: string, message: string, extra: Record<string, unknown> = {}) {
  return json({ error, message, ...extra }, status);
}

/** Origin obbligatorio e autorizzato; Referer, se presente, deve appartenere alla stessa origine. */
function isAllowedRequest(req: NextRequest): boolean {
  const allowed = allowedOrigins();
  const origin = req.headers.get("origin");
  if (!origin || !allowed.includes(origin)) return false;
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      if (new URL(referer).origin !== origin) return false;
    } catch {
      return false;
    }
  }
  return true;
}

function clientIp(req: NextRequest): string {
  // Su Vercel x-forwarded-for è impostato dalla piattaforma con l'IP reale del visitatore.
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim();
  return ip || "unknown";
}

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\uFEFF]/;
const URL_OR_DATA = /(https?:\/\/|www\.|data:|base64|\.(png|jpe?g|webp|gif)\b)/i;
const BASE64_RUN = /[A-Za-z0-9+\/=]{40,}/;
const ALLOWED_CHARS = /^[\p{L}\p{N} .,;:!?'"\u2019()\-\u2013\u2014\/&%+\u00B0\u20AC]+$/u;

type PromptCheck = { ok: true; sanitized: string; normalized: string } | { ok: false; message: string };

function sanitizePrompt(raw: string): PromptCheck {
  if (CONTROL_CHARS.test(raw)) return { ok: false, message: "La descrizione contiene caratteri non ammessi." };
  const text = raw.normalize("NFC").replace(/ {2,}/g, " ").trim();
  if (text.length < PROMPT_MIN) return { ok: false, message: `Descrivi cosa desideri con almeno ${PROMPT_MIN} caratteri.` };
  if (text.length > PROMPT_MAX) return { ok: false, message: `La descrizione può avere al massimo ${PROMPT_MAX} caratteri.` };
  if (URL_OR_DATA.test(text) || BASE64_RUN.test(text)) {
    return { ok: false, message: "Non sono ammessi link, immagini o codici: descrivi l'arredo a parole." };
  }
  if (!ALLOWED_CHARS.test(text)) return { ok: false, message: "La descrizione contiene caratteri non ammessi." };
  const sanitized = text.replace(/'/g, "\u2019"); // evita di chiudere l'apice nel prompt server
  const normalized = sanitized.toLowerCase().replace(/[.!?,;:]+$/, "").replace(/\s+/g, " ").trim();
  return { ok: true, sanitized, normalized };
}

function buildPrompt(sanitizedPrompt: string): string {
  return `Photorealistic interior design staging of this exact room. Apply ONLY the furniture, wall paint color, lighting, and decor changes described here: '${sanitizedPrompt}'. MANDATORY CONSTRAINTS: Preserve the exact room geometry, walls, ceiling height, white window frames, doors, original floor tiles, and the exact sea and city view outside the windows 100% unchanged.`;
}

function pruneGlobal(now: number) {
  globalLog = globalLog.filter((t) => now - t < DAY_MS);
}

function cacheSet(key: string, entry: CacheEntry) {
  cache.set(key, entry);
  while (cache.size > CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
}

type OpenAIResult = { ok: true; image: string } | { ok: false; kind: "quota" | "error"; status: number };

async function callOpenAI(apiKey: string, prompt: string, image: Buffer): Promise<OpenAIResult> {
  const form = new FormData();
  form.append("model", OPENAI_MODEL);
  form.append("prompt", prompt);
  form.append("quality", "medium");
  form.append("size", "1024x1536");
  form.append("n", "1");
  form.append("output_format", "jpeg");
  form.append("output_compression", "85");
  form.append("image", new Blob([new Uint8Array(image)], { type: "image/jpeg" }), "room.jpg");

  let res: Response;
  try {
    res = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(55_000),
    });
  } catch (err) {
    // Solo il nome dell'errore: mai header, chiave o corpo della richiesta.
    console.error("[render] connessione a OpenAI non riuscita:", (err as Error)?.name ?? "Error");
    return { ok: false, kind: "error", status: 0 };
  }

  if (!res.ok) {
    let code = "";
    try {
      const body = (await res.json()) as { error?: { code?: string; type?: string } };
      code = body.error?.code || body.error?.type || "";
    } catch {
      /* corpo non JSON */
    }
    // Il messaggio di OpenAI non viene mai loggato: con chiave errata può contenerne una parte.
    console.error(`[render] OpenAI ha risposto ${res.status}${code ? ` (${code})` : ""}`);
    const quota = res.status === 429 || code === "insufficient_quota" || code === "billing_hard_limit_reached";
    return { ok: false, kind: quota ? "quota" : "error", status: res.status };
  }

  const data = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) return { ok: false, kind: "error", status: 502 };
  return { ok: true, image: `data:image/jpeg;base64,${b64}` };
}

// ─── Handler ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 3. Origine e formato
  if (!isAllowedRequest(req)) return fail(403, "forbidden", "Richiesta non autorizzata.");
  const contentType = req.headers.get("content-type") ?? "";
  if (!/^application\/json(\s*;|$)/i.test(contentType)) {
    return fail(415, "unsupported_media_type", "Formato della richiesta non valido.");
  }

  // 2. Body: solo { roomId, userPrompt }
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return fail(413, "too_large", "Richiesta troppo grande.");
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, "bad_json", "Richiesta non valida.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail(400, "bad_body", "Richiesta non valida.");
  const keys = Object.keys(body);
  if (keys.some((k) => k !== "roomId" && k !== "userPrompt")) {
    return fail(400, "unexpected_fields", "Sono ammessi solo la stanza e la descrizione.");
  }
  const { roomId, userPrompt } = body as { roomId?: unknown; userPrompt?: unknown };
  if (typeof roomId !== "string" || !Object.prototype.hasOwnProperty.call(ROOM_FILES, roomId)) {
    return fail(400, "invalid_room", "Stanza non valida.");
  }
  if (typeof userPrompt !== "string") return fail(400, "invalid_prompt", "Descrivi cosa desideri.");
  const check = sanitizePrompt(userPrompt);
  if (!check.ok) return fail(400, "invalid_prompt", check.message);

  // 4a. Cache: combinazione già generata → nessun credito consumato
  const ip = clientIp(req);
  const used = visitors.get(ip) ?? 0;
  const cacheKey = `${roomId}_${check.normalized}`;
  const hit = cache.get(cacheKey);
  if (hit) {
    return json({ image: hit.image, cached: true, remaining: Math.max(0, PER_VISITOR_LIMIT - used) }, 200);
  }

  // 5. Chiave non configurata
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fail(503, "unavailable", MSG_UNAVAILABLE);

  // 4b. Limiti: 3 per visitatore, 25 al giorno in totale (slot prenotati prima della chiamata)
  if (used >= PER_VISITOR_LIMIT) {
    return fail(429, "visitor_limit", "Hai usato le 3 prove disponibili. Il modo migliore per immaginarla ora è vederla dal vivo.", { remaining: 0 });
  }
  const now = Date.now();
  pruneGlobal(now);
  if (globalLog.length >= GLOBAL_LIMIT_24H) return fail(503, "unavailable", MSG_UNAVAILABLE);

  visitors.set(ip, used + 1);
  globalLog.push(now);
  if (visitors.size > 10_000) visitors.delete(visitors.keys().next().value as string);
  const refund = () => {
    visitors.set(ip, Math.max(0, (visitors.get(ip) ?? 1) - 1));
    const i = globalLog.indexOf(now);
    if (i >= 0) globalLog.splice(i, 1);
  };

  let photo: Buffer;
  try {
    photo = await readFile(path.join(PHOTOS_DIR, ROOM_FILES[roomId]));
  } catch {
    refund();
    console.error("[render] foto sorgente non trovata per la stanza", roomId);
    return fail(500, "server_error", "La generazione non è riuscita. Riprova tra qualche istante.");
  }

  const result = await callOpenAI(apiKey, buildPrompt(check.sanitized), photo);
  if (!result.ok) {
    refund();
    if (result.kind === "quota") return fail(503, "unavailable", MSG_UNAVAILABLE);
    return fail(502, "generation_failed", "La generazione non è riuscita. Riprova tra qualche istante.");
  }

  cacheSet(cacheKey, { image: result.image });
  return json({ image: result.image, cached: false, remaining: Math.max(0, PER_VISITOR_LIMIT - (used + 1)) }, 200);
}
