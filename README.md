# Landing page — Via Vittorio Veneto 390, Torre Annunziata

Landing page per vendere da privato un appartamento di ~144 m² con vista mare, terrazza, 2 balconi e garage. È progettata prima di tutto per smartphone. Stack: Next.js (App Router), Tailwind CSS v4 e TypeScript.

## Avvio

```bash
npm install
cp .env.example .env.local   # poi compila i valori
npm run dev                  # http://localhost:3000
npm run build && npm start   # produzione
```

## Da completare prima della pubblicazione (riquadri rossi `[DA CONTROLLARE]`)

| Cosa | Dove |
|---|---|
| Numero WhatsApp | `NEXT_PUBLIC_WHATSAPP_NUMBER` in `.env.local` (es. `393331234567`) |
| Chiave API "Arredala tu" | `OPENAI_API_KEY` in `.env.local` o nelle variabili d'ambiente di Vercel |
| Spese condominiali mensili | `PROPERTY.condoFees` in `src/config/site.ts` |
| Classe energetica APE | `PROPERTY.energyClass` in `src/config/site.ts` |
| Planimetria | carica un `.jpg/.png/.webp` in `public/images/planimetria/` (viene collegata automaticamente al build) |
| Visita 360° | `TOUR_EMBED_URL` in `src/config/site.ts`: è la 4ª scheda della sezione foto (`ENABLE_3D_TOUR = true` la mostra; senza URL dice "in arrivo") |


## Struttura

- `public/images/attuali/01…15-*.jpg`: le 15 foto reali, nell'ordine della visita guidata
- `public/images/render/render-01…18-*.jpg`: i render 3D, ordinati per stanza; in galleria si vedono tenendo premuto "Premi: Render 3D" sulla foto reale abbinata (anche a schermo intero) (campo `render` in `galleryData.ts`)
- `public/images/stanze-base-ai/`: le foto base dello studio AI (soggiorno, cucina, camera, balcone vista mare)
- `src/data/galleryData.ts`: titoli e didascalie di foto, render, stanze AI e stili
- `src/config/site.ts`: prezzo, dati tecnici, WhatsApp, tour 360°, limiti AI
- `src/app/api/render/route.ts`: render AI di "Arredala tu" con OpenAI `gpt-image-1` (`/v1/images/edits`, qualità `medium`), a partire dalle foto reali in `public/images/attuali/`. Misure di sicurezza:
  - chiave letta solo da `process.env.OPENAI_API_KEY`, mai loggata né restituita;
  - body accettato: solo `roomId` (whitelist di stanze) e `userPrompt` (5-180 caratteri, niente caratteri di controllo, link o immagini);
  - solo `POST` con `Content-Type: application/json` da `https://sito-casa.vercel.app` (in sviluppo anche `http://localhost:3000`);
  - cache in memoria per richieste identiche, max 3 generazioni per IP, max 25 generazioni ogni 24 ore in totale;
  - chiave mancante o credito esaurito → messaggio cortese per il visitatore.

## Comportamento senza chiave API o numero WhatsApp

- **Arredala tu**: finché `OPENAI_API_KEY` manca (o il credito OpenAI è esaurito), i visitatori vedono "Simulazioni AI temporaneamente non disponibili: tieni premuto «Premi: Render 3D» sulle foto reali per vedere i render 3D già pronti." invece del pulsante di generazione. Su Vercel, dopo aver aggiunto la chiave, serve un nuovo deploy.
- **Prenota Visita**: finché `NEXT_PUBLIC_WHATSAPP_NUMBER` manca o non è valido (8-15 cifre), il pulsante di invio resta disattivato e compare un avviso discreto. Nessun link `wa.me` viene aperto.
- I due promemoria rossi `[DA CONTROLLARE]` per chiave API e numero WhatsApp si vedono solo in sviluppo (`npm run dev`), non nel sito pubblicato.
