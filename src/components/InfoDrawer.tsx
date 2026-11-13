"use client";

import { Check } from "lucide-react";
import { Sheet } from "./Sheet";
import { DaControllare } from "./DaControllare";
import { PROPERTY } from "@/config/site";
import { useUi } from "./UiProvider";
import { composition } from "@/data/composition";

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

  return (
    <Sheet open={tab !== null} onClose={onClose} title="Info Utili" eyebrow="Scheda tecnica completa" side="left">
      <nav className="no-scrollbar sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-line bg-ice px-5 py-3">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              active === t.id ? "bg-primary text-white" : "border border-line bg-card text-slate-ink"
            }`}
          >
            {i + 1}. {t.label}
          </button>
        ))}
      </nav>

      <div className="space-y-4 px-5 py-5">
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
                <Row label="Tipologia">Quadrilocale: 4 locali (sala + 3 camere)</Row>
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
            <ul className="space-y-3">
              <Bullet>Soffitti alti: ampiezza, respiro e possibilità di controsoffitti con faretti LED.</Bullet>
              <Bullet>Infissi nuovi bianchi con vetrocamera.</Bullet>
              <Bullet>Riscaldamento autonomo con caldaia e termosifoni.</Bullet>
              <Bullet>Copertura Fibra fino a 200 Mega, ideale per lo smart working.</Bullet>
              <Bullet>Pavimentazione in buono stato (graniglia nera nel salone, alla veneziana nelle camere).</Bullet>
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
