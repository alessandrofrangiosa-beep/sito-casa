import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { aiBaseRooms, aiStyles } from "@/data/galleryData";
import { AI_BONUS_RENDERS, AI_FREE_RENDERS } from "@/config/site";

export const runtime = "nodejs";
export const maxDuration = 60;

const COUNT_COOKIE = "ai_renders";
const UNLOCK_COOKIE = "ai_unlocked";
const ONE_YEAR = 60 * 60 * 24 * 365;

type Body = {
  roomId?: string;
  styleId?: string;
  prompt?: string;
  phone?: string;
  consent?: boolean;
};

function buildPrompt(roomLabel: string, isOutdoor: boolean, stylePrompt: string, userPrompt: string) {
  const what = isOutdoor ? "this terrace" : `this empty ${roomLabel.toLowerCase()}`;
  return [
    `Furnish and redecorate ${what} as a photorealistic interior design photograph.`,
    stylePrompt && `Style: ${stylePrompt}.`,
    userPrompt && `Client request: ${userPrompt}.`,
    "Remove old wallpaper and repaint the walls cleanly where needed.",
    "STRICTLY KEEP UNCHANGED: room geometry, walls, ceiling height, floor plan, position and size of every window, French door and door, radiators, and the real sea / city view visible outside the windows.",
    "Same camera angle and perspective, natural daylight, realistic materials, no text, no people.",
  ]
    .filter(Boolean)
    .join(" ");
}

async function loadBaseImage(src: string, origin: string): Promise<Buffer> {
  try {
    return await readFile(path.join(process.cwd(), "public", src));
  } catch {
    // In ambienti serverless /public potrebbe non essere nel bundle: la scarichiamo dal sito stesso
    const res = await fetch(new URL(src, origin));
    if (!res.ok) throw new Error(`Immagine base non trovata: ${src}`);
    return Buffer.from(await res.arrayBuffer());
  }
}

async function generateWithFal(key: string, prompt: string, image: Buffer): Promise<string> {
  const model = process.env.FAL_MODEL || "fal-ai/flux-pro/kontext";
  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      image_url: `data:image/jpeg;base64,${image.toString("base64")}`,
      num_images: 1,
      guidance_scale: 3.5,
      output_format: "jpeg",
      safety_tolerance: "2",
    }),
  });
  if (!res.ok) throw new Error(`fal.ai ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { images?: { url: string }[] };
  const url = data.images?.[0]?.url;
  if (!url) throw new Error("fal.ai non ha restituito immagini");
  return url;
}

async function generateWithOpenAI(key: string, prompt: string, image: Buffer): Promise<string> {
  const form = new FormData();
  form.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-1");
  form.append("prompt", prompt);
  form.append("size", "1024x1536");
  form.append("n", "1");
  form.append("image", new Blob([new Uint8Array(image)], { type: "image/jpeg" }), "base.jpg");
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
  const first = data.data?.[0];
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  if (first?.url) return first.url;
  throw new Error("OpenAI non ha restituito immagini");
}

async function forwardLead(phone: string, req: NextRequest) {
  const lead = { phone, source: "render-ai-unlock", at: new Date().toISOString(), ua: req.headers.get("user-agent") };
  console.info("[lead] Nuovo contatto da sblocco Render AI:", lead);
  const hook = process.env.LEAD_WEBHOOK_URL;
  if (!hook) return;
  try {
    await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) });
  } catch (err) {
    console.error("[lead] Invio al webhook fallito", err);
  }
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "bad_request", message: "Richiesta non valida." }, { status: 400 });
  }

  const room = aiBaseRooms.find((r) => r.id === body.roomId);
  if (!room) return NextResponse.json({ error: "bad_request", message: "Stanza non valida." }, { status: 400 });
  const style = aiStyles.find((s) => s.id === body.styleId);
  const userPrompt = (body.prompt ?? "").replace(/\s+/g, " ").trim().slice(0, 280);
  if (!style && !userPrompt) {
    return NextResponse.json({ error: "bad_request", message: "Scegli uno stile o scrivi una richiesta." }, { status: 400 });
  }

  // ── Limite generazioni (cookie lato server, in aggiunta al localStorage lato client) ──
  const used = Number.parseInt(req.cookies.get(COUNT_COOKIE)?.value ?? "0", 10) || 0;
  let unlocked = req.cookies.get(UNLOCK_COOKIE)?.value === "1";
  let newlyUnlocked = false;

  if (!unlocked && body.phone) {
    const digits = body.phone.replace(/[^\d+]/g, "");
    if (!/^\+?\d{8,15}$/.test(digits) || !body.consent) {
      return NextResponse.json(
        { error: "invalid_phone", message: "Inserisci un numero WhatsApp valido e accetta il consenso." },
        { status: 400 },
      );
    }
    unlocked = true;
    newlyUnlocked = true;
    await forwardLead(digits, req);
  }

  const withUnlock = (res: NextResponse) => {
    if (newlyUnlocked) res.cookies.set(UNLOCK_COOKIE, "1", { httpOnly: true, sameSite: "lax", maxAge: ONE_YEAR, path: "/" });
    return res;
  };

  const limit = AI_FREE_RENDERS + (unlocked ? AI_BONUS_RENDERS : 0);
  if (used >= limit) {
    return withUnlock(NextResponse.json(
      unlocked
        ? { error: "limit_reached", message: "Hai usato tutti i render disponibili. Vieni a vederla dal vivo!" }
        : { error: "needs_unlock", message: "Hai usato i 2 render gratuiti." },
      { status: unlocked ? 429 : 402 },
    ));
  }

  const falKey = process.env.FAL_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!falKey && !openaiKey) {
    return withUnlock(NextResponse.json(
      { error: "missing_api_key", message: "Servizio non ancora configurato: manca la chiave API (fal.ai / OpenAI) in .env.local." },
      { status: 503 },
    ));
  }

  try {
    const image = await loadBaseImage(room.src, req.nextUrl.origin);
    const prompt = buildPrompt(room.label, room.id === "terrazza", style?.prompt ?? "", userPrompt);
    const output = falKey ? await generateWithFal(falKey, prompt, image) : await generateWithOpenAI(openaiKey!, prompt, image);

    const nextUsed = used + 1;
    const res = NextResponse.json({ image: output, used: nextUsed, limit, remaining: Math.max(0, limit - nextUsed), unlocked });
    res.cookies.set(COUNT_COOKIE, String(nextUsed), { httpOnly: true, sameSite: "lax", maxAge: ONE_YEAR, path: "/" });
    return withUnlock(res);
  } catch (err) {
    console.error("[generate-render]", err);
    return withUnlock(NextResponse.json(
      { error: "generation_failed", message: "La generazione non è riuscita. Riprova tra qualche istante." },
      { status: 502 },
    ));
  }
}
