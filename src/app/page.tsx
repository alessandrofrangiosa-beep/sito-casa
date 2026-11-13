import { readdirSync } from "node:fs";
import path from "node:path";
import { UiProvider } from "@/components/UiProvider";
import { Hero } from "@/components/Hero";
import { ExploreSection } from "@/components/ExploreSection";
import { VirtualTour } from "@/components/VirtualTour";
import { Opportunity } from "@/components/Opportunity";
import { FloorPlan } from "@/components/FloorPlan";
import { Location } from "@/components/Location";
import { SectionTitle } from "@/components/SectionTitle";
import { FinalCta } from "@/components/FinalCta";
import { CompositionList } from "@/components/CompositionList";
import { MortgageSimulator } from "@/components/MortgageSimulator";
import { ENABLE_3D_TOUR, PROPERTY, TOUR_EMBED_URL } from "@/config/site";

/** Collega automaticamente la prima immagine trovata in /public/images/planimetria (verificata al build). */
function findFloorPlan(): string | null {
  try {
    const dir = path.join(process.cwd(), "public", "images", "planimetria");
    const file = readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
      .sort()[0];
    return file ? `/images/planimetria/${file}` : null;
  } catch {
    return null;
  }
}

/** Fascia a tutta larghezza: alterna bianco e grigio ghiaccio tra le sezioni */
function Band({ tone = "white", last = false, children }: { tone?: "white" | "ice"; last?: boolean; children: React.ReactNode }) {
  return (
    <div className={`${tone === "ice" ? "border-y border-line bg-ice" : "bg-page"} py-14 sm:py-20 ${last ? "pb-28" : ""}`}>
      {children}
    </div>
  );
}

export default function Home() {
  const floorPlan = findFloorPlan();
  // Il tour 360° compare solo quando è attivo e ha un URL; altrimenti la sezione segnaposto è nascosta
  const showTour = ENABLE_3D_TOUR && Boolean(TOUR_EMBED_URL);
  // Alternanza bianco / grigio ghiaccio delle fasce, che resta corretta con o senza il tour
  const tone = (i: number): "white" | "ice" => ((i + (showTour ? 0 : 1)) % 2 === 1 ? "white" : "ice");
  // Solo un booleano: la chiave resta sul server e non arriva mai al browser
  const aiEnabled = Boolean(process.env.OPENAI_API_KEY);

  return (
    <UiProvider>
      <main>
        <Hero />

        <div className="pb-16 sm:pb-20">
          <ExploreSection aiEnabled={aiEnabled} />
        </div>

        {showTour && (
          <Band tone={tone(0)}>
            <VirtualTour />
          </Band>
        )}

        <Band tone={tone(1)}>
          <Location />
        </Band>

        <Band tone={tone(2)}>
          <Opportunity />
        </Band>

        <Band tone={tone(3)}>
          <section id="planimetria" className="mx-auto max-w-5xl scroll-mt-4 px-4">
            <SectionTitle
              eyebrow="Quadrilocale · 4 stanze"
              title="Distribuzione degli spazi"
              intro="Zona giorno e zona notte ben separate dal corridoio centrale: 4 stanze, cucina abitabile, 2 bagni, terrazza e 2 balconi."
            />
            <div className="grid gap-4 md:grid-cols-2 md:items-start">
              <CompositionList />
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">Planimetria · tocca per ingrandire</p>
                <FloorPlan src={floorPlan} />
              </div>
            </div>
          </section>
        </Band>

        <Band tone={tone(4)}>
          <MortgageSimulator />
        </Band>

        <Band tone={tone(5)} last>
          <FinalCta />
        </Band>
      </main>

      <footer className="bg-page px-4 pb-28 pt-8 text-center text-xs leading-relaxed text-slate-ink">
        <p className="text-base font-semibold text-ink">
          {PROPERTY.address} · {PROPERTY.city}
        </p>
        <p className="mt-1">Vendita diretta da privato · Nessuna agenzia coinvolta · Visite solo in presenza su appuntamento</p>
        <p className="mt-3 text-[11px]">
          I render 3D e le immagini generate con l&apos;AI sono ipotesi illustrative di arredo e non costituiscono
          elemento contrattuale. Superfici e dati indicativi, da verificare in sede di visita e rogito.
        </p>
      </footer>
    </UiProvider>
  );
}
