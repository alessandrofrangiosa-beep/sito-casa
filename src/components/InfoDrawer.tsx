"use client";

import { Check } from "lucide-react";
import { Sheet } from "./Sheet";
import { DaControllare } from "./DaControllare";
import { PROPERTY } from "@/config/site";
import { useUi } from "./UiProvider";
import { composition } from "@/data/composition";

export type InfoTab = "composizione" | "stato" | "condominio" | "documenti";

const TABS: { id: InfoTab; label: string }[] = [
  { id: "composizione", label: "Composizione" },
  { id: "stato", label: "Stato e dotazioni" },
  { id: "condominio", label: "Condominio" },
  { id: "documenti", label: "Documenti" },
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
  const active = tab ?? "composizione";

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
        {active === "composizione" && (
          <>
            <Card>
              <dl>
                <Row label="Superficie">~{PROPERTY.sqm} m²</Row>
                <Row label="Piano">{PROPERTY.floor}</Row>
                <Row label="Tipologia">Quadrilocale: 4 locali (sala + 3 camere)</Row>
                <Row label="Cucina">Abitabile, separata</Row>
                <Row label="Bagni">2</Row>
                <Row label="Terrazze">3</Row>
                <Row label="Ripostiglio">Nessuno</Row>
                <Row label="Box auto">Garage privato incluso</Row>
              </dl>
            </Card>
            <ul className="space-y-3">
              {composition.map((c) => (
                <Bullet key={c.area}>
                  <span className="font-semibold">{c.area}:</span> {c.text}.
                </Bullet>
              ))}
            </ul>
          </>
        )}

        {active === "stato" && (
          <>
            <ul className="space-y-3">
              <Bullet>Infissi bianchi con vetrocamera già installati.</Bullet>
              <Bullet>Impianto di riscaldamento con termosifoni e caldaia presenti.</Bullet>
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
                Lavori straordinari su facciate e balconi ({PROPERTY.condoWorksPaid}){" "}
                <strong>già deliberati e saldati dal proprietario</strong>.
              </Bullet>
              <Bullet>Il ponteggio visibile in foto è in fase di ultimazione.</Bullet>
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
              <Bullet>Immobile mutuabile.</Bullet>
              <Bullet>Catastali in regola.</Bullet>
              <Bullet>Libero subito: rogito e consegna immediata.</Bullet>
              <Bullet>Trattativa diretta con il proprietario, senza intermediari.</Bullet>
            </ul>
            <Card>
              <dl>
                <Row label="Classe energetica (APE)">
                  {PROPERTY.energyClass ?? <DaControllare>Inserire classe APE</DaControllare>}
                </Row>
                <Row label="Disponibilità">Libero subito</Row>
                <Row label="Prezzo">
                  {PROPERTY.price} {PROPERTY.priceNote}
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
