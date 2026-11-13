"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, HardHat, Wifi } from "lucide-react";
import { Sheet } from "./Sheet";
import { DaControllare } from "./DaControllare";
import { PROPERTY } from "@/config/site";
import { useUi } from "./UiProvider";
import { composition } from "@/data/composition";
import { FIBER } from "@/data/highlights";

export type InfoTab = "prezzo" | "composizione" | "impianti" | "condominio" | "documenti";

const TABS: { id: InfoTab; label: string }[] = [
  { id: "prezzo", label: "Prezzo" },
  { id: "composizione", label: "Composizione" },
  { id: "impianti", label: "Caratteristiche e impianti" },
  { id: "condominio", label: "Condominio e lavori" },
  { id: "documenti", label: "Stato documentale" },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-0">
      <dt className="text-sm text-slate-ink">{label}</dt>
      <dd className="text-right text-sm font-semibold text-ink tabular-nums">{children}</dd>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-[15px] leading-relaxed text-ink">
      <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <span>{children}</span>
    </li>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <p className="pt-1 text-xs font-bold uppercase tracking-wider text-primary">{children}</p>;
}

/** Punti di forza sempre visibili in cima al pannello */
function Highlights() {
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/25 bg-primary-soft">
      <p className="px-4 pt-3 text-xs font-bold uppercase tracking-[0.16em] text-primary">In evidenza</p>
      <ul className="divide-y divide-primary/15">
        <li className="flex gap-3 px-4 py-3">
          <Wifi className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 text-sm leading-snug text-ink">
            <strong className="font-semibold">{FIBER.title}</strong>, ideale per lo smart working, le videochiamate e lo
            streaming 4K.
          </span>
        </li>
        <li className="flex gap-3 px-4 py-3">
          <HardHat className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 text-sm leading-snug text-ink">
            <strong className="font-semibold">Ditta già attiva nello stabile:</strong> su richiesta e senza vincoli ricevi
            il contatto della squadra delle facciate per tinteggiare gli interni subito dopo il rogito, senza attese e
            con costi di uscita ridotti.
          </span>
        </li>
      </ul>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-line bg-card p-4 shadow-soft">{children}</div>;
}

export function InfoDrawer({
  tab,
  onTabChange,
  onClose,
}: {
  tab: InfoTab | null;
  onTabChange: (t: InfoTab) => void;
  onClose: () => void;
}) {
  const { openBooking } = useUi();
  const active = tab ?? "prezzo";
  const index = TABS.findIndex((t) => t.id === active);
  const navRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);

  const goTo = (i: number) => {
    if (i < 0 || i >= TABS.length || i === index) return;
    setDirection(i > index ? "next" : "prev");
    onTabChange(TABS[i].id);
  };

  // Scheda attiva al centro della barra (scorrimento solo orizzontale) e contenuto dall'inizio
  useEffect(() => {
    if (tab === null) return;
    const nav = navRef.current;
    const chip = nav?.children[index] as HTMLElement | undefined;
    if (nav && chip) nav.scrollTo({ left: chip.offsetLeft - nav.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
    const scroller = bodyRef.current?.closest(".overflow-y-auto");
    if (scroller && scroller.scrollTop > 0) scroller.scrollTo({ top: 0 });
  }, [index, tab]);

  // Scorrimento con il dito: verso sinistra → scheda successiva, verso destra → precedente
  const onTouchStart = (e: React.TouchEvent) => {
    const p = e.touches[0];
    touch.current = { x: p.clientX, y: p.clientY, t: Date.now() };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - start.x;
    const dy = p.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5 || Date.now() - start.t > 800) return;
    goTo(dx < 0 ? index + 1 : index - 1);
  };

  return (
    <Sheet open={tab !== null} onClose={onClose} title="Info Utili" eyebrow="Scheda tecnica completa" side="left">
      <nav ref={navRef} className="no-scrollbar sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-line bg-ice px-5 py-3">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => goTo(i)}
            aria-current={active === t.id ? "true" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              active === t.id ? "bg-primary text-white" : "border border-line bg-card text-slate-ink"
            }`}
          >
            {i + 1}. {t.label}
          </button>
        ))}
      </nav>

      <div
        ref={bodyRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: "pan-y" }}
        className="space-y-4 px-5 py-5"
      >
        <div className="flex items-center justify-between gap-3 text-xs text-slate-ink">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Scheda precedente"
            className="grid h-8 w-8 place-items-center rounded-full border border-line bg-card text-ink transition disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-col items-center gap-1">
            <span className="flex gap-1.5" aria-hidden>
              {TABS.map((t, i) => (
                <span key={t.id} className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-primary" : "w-1.5 bg-line"}`} />
              ))}
            </span>
            <span>Scorri con il dito per cambiare scheda</span>
          </div>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === TABS.length - 1}
            aria-label="Scheda successiva"
            className="grid h-8 w-8 place-items-center rounded-full border border-line bg-card text-ink transition disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div key={active} className={`space-y-4 ${direction === "next" ? "animate-slide-next" : direction === "prev" ? "animate-slide-prev" : ""}`}>
        {active === "prezzo" && (
          <>
            <Card>
              <dl>
                <Row label="Appartamento (quadrilocale 144 m² + terrazza e 2 balconi)">{PROPERTY.apartmentPrice}</Row>
                <Row label="Garage privato">{PROPERTY.garagePrice}</Row>
                <Row label="Vendita congiunta">
                  {PROPERTY.price} {PROPERTY.priceNote}
                </Row>
                <Row label="Commissioni d&apos;agenzia">
                  <span className="text-primary">0%</span>
                </Row>
              </dl>
            </Card>
            <ul className="space-y-3">
              <Bullet>
                Vendita congiunta di appartamento e garage: <strong>{PROPERTY.price} {PROPERTY.priceNote}</strong>.
              </Bullet>
              <Bullet>Trattativa diretta con il proprietario, senza intermediari: 0% commissioni d&apos;agenzia.</Bullet>
              <Bullet>
                {PROPERTY.condoWorksPaid} di lavori straordinari su facciate e balconi già saldati dal proprietario.
              </Bullet>
            </ul>
          </>
        )}

        {active === "composizione" && (
          <>
            <Card>
              <dl>
                <Row label="Superficie">~{PROPERTY.sqm} m²</Row>
                <Row label="Tipologia">Quadrilocale: 4 stanze</Row>
                <Row label="Cucina">Abitabile, separata</Row>
                <Row label="Bagni">2</Row>
                <Row label="Pertinenze">1 terrazza + 2 balconi + garage privato ampio, adatto anche a SUV</Row>
                <Row label="Ripostiglio">Nessuno</Row>
              </dl>
            </Card>
            <ul className="space-y-3">
              {composition.map((c) => (
                <Bullet key={c.area}>
                  <span className="font-semibold">{c.area}:</span> {c.text}.
                </Bullet>
              ))}
            </ul>
            <SubTitle>Esposizione</SubTitle>
            <Card>
              <dl>
                <Row label="Piano">{PROPERTY.floor}</Row>
                <Row label="Vista">Mare panoramica, non ostruibile</Row>
                <Row label="Luce">Naturale tutto il giorno</Row>
              </dl>
            </Card>
          </>
        )}

        {active === "impianti" && (
          <>
            <Highlights />
            <ul className="space-y-3">
              <Bullet>Soffitti alti: ampiezza, respiro e possibilità di controsoffitti con faretti LED.</Bullet>
              <Bullet>Infissi nuovi bianchi con vetrocamera.</Bullet>
              <Bullet>Riscaldamento autonomo con caldaia e termosifoni.</Bullet>
              <Bullet>Pavimentazione in buono stato (graniglia nera nel salone, alla veneziana nelle altre stanze).</Bullet>
              <Bullet>Bagno interno completo di vasca e sanitari.</Bullet>
            </ul>
            <div className="rounded-2xl border border-primary/20 bg-primary-soft p-4 text-[15px] leading-relaxed text-ink">
              <p className="font-semibold text-ink">Trasparenza totale</p>
              <p className="mt-1">
                L&apos;immobile è venduto <strong>vuoto / non arredato</strong>. Richiede principalmente{" "}
                <strong>una semplice rinfrescata delle pareti secondo il proprio gusto e l&apos;arredo personalizzato</strong>.{" "}
                <strong>Zero opere murarie</strong>: pronta da personalizzare con i tuoi colori e arredi.
              </p>
            </div>
          </>
        )}

        {active === "condominio" && (
          <>
            <ul className="space-y-3">
              <Bullet>Stabile con ascensore.</Bullet>
              <Bullet>
                {PROPERTY.condoWorksPaid} di lavori straordinari su facciate e balconi{" "}
                <strong>già deliberati e saldati dal proprietario</strong>.
              </Bullet>
              <Bullet>Il ponteggio visibile in foto è in fase di ultimazione.</Bullet>
              <Bullet>
                Facoltativo: puoi contattare direttamente l&apos;impresa già sul posto per eventuali tinteggiature
                interne dopo il rogito.
              </Bullet>
            </ul>
            <Card>
              <dl>
                <Row label="Spese condominiali mensili">
                  {PROPERTY.condoFees ?? <DaControllare>Inserire importo spese condominiali</DaControllare>}
                </Row>
                <Row label="Lavori straordinari">
                  <span className="text-primary">Già pagati</span>
                </Row>
              </dl>
            </Card>
          </>
        )}

        {active === "documenti" && (
          <>
            <ul className="space-y-3">
              <Bullet>Libero subito.</Bullet>
              <Bullet>Documentazione controllata e pronta per mutuo e rogito immediato.</Bullet>
              <Bullet>Immobile mutuabile, catastali in regola.</Bullet>
              <Bullet>Trattativa diretta con il proprietario, senza intermediari.</Bullet>
            </ul>
            <Card>
              <dl>
                <Row label="Classe energetica (APE)">
                  {PROPERTY.energyClass ?? <DaControllare>Inserire classe APE</DaControllare>}
                </Row>
                <Row label="Disponibilità">Libero subito</Row>
                <Row label="Prezzo">
                  {PROPERTY.apartmentPrice} + {PROPERTY.garagePrice} garage
                </Row>
              </dl>
            </Card>
          </>
        )}

        </div>

        <button
          type="button"
          onClick={openBooking}
          className="mt-2 w-full rounded-xl bg-primary px-5 py-3.5 text-base font-semibold text-white shadow-soft transition hover:bg-primary-hover"
        >
          Ho letto tutto: prenota la visita
        </button>
      </div>
    </Sheet>
  );
}
