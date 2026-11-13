# Landing page — Via Vittorio Veneto 390, Torre Annunziata

Landing page per vendere da privato un appartamento di ~144 m² con vista mare, 3 terrazze e garage. È progettata prima di tutto per smartphone. Stack: Next.js (App Router), Tailwind CSS v4 e TypeScript.

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
| Chiave API Render AI | `FAL_KEY` **oppure** `OPENAI_API_KEY` in `.env.local` |
| Spese condominiali mensili | `PROPERTY.condoFees` in `src/config/site.ts` |
| Classe energetica APE | `PROPERTY.energyClass` in `src/config/site.ts` |
| Planimetria | carica un `.jpg/.png/.webp` in `public/images/planimetria/` (viene collegata automaticamente al build) |
| Tour 360° | `ENABLE_3D_TOUR = true` e `TOUR_EMBED_URL` in `src/config/site.ts` |

Facoltativo: `LEAD_WEBHOOK_URL` riceve in POST i numeri lasciati per sbloccare altri render (Make, Zapier, Google Sheets…). In ogni caso i numeri vengono scritti nei log del server.

## Struttura

- `public/images/attuali/01…15-*.jpg`: le 15 foto reali, nell'ordine della visita guidata
- `public/images/render/render-01…13-*.jpg`: i render 3D, ordinati per stanza
- `public/images/stanze-base-ai/`: le foto base dello studio AI (soggiorno, cucina, camera, terrazza)
- `src/data/galleryData.ts`: titoli e didascalie di foto, render, stanze AI e stili
- `src/config/site.ts`: prezzo, dati tecnici, WhatsApp, tour 360°, limiti AI
- `src/app/api/generate-render/route.ts`: generazione dei render (fal.ai Flux Kontext oppure OpenAI Image Edit). Limita a 2 render gratis, poi altri 3 dopo che il visitatore lascia il numero WhatsApp. Il limite è salvato in un cookie httpOnly e in localStorage.

## Comportamento senza chiave API o numero WhatsApp

- **Render AI**: finché `FAL_KEY` / `OPENAI_API_KEY` mancano, i visitatori vedono il riquadro "Configuratore Render AI in fase di attivazione" invece del pulsante di generazione. La pagina lo verifica con `GET /api/generate-render`, quindi si attiva da sola appena aggiungi la chiave sul server.
- **Prenota Visita**: finché `NEXT_PUBLIC_WHATSAPP_NUMBER` manca o non è valido (8-15 cifre), il pulsante di invio resta disattivato e compare un avviso discreto. Nessun link `wa.me` viene aperto.
- I due promemoria rossi `[DA CONTROLLARE]` per chiave API e numero WhatsApp si vedono solo in sviluppo (`npm run dev`), non nel sito pubblicato.
