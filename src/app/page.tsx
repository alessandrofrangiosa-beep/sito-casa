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
import { PROPERTY } from "@/config/site";

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

export default function Home() {
  const floorPlan = findFloorPlan();

  return (
    <UiProvider>
      <main className="space-y-16 pb-32 sm:space-y-24">
        <div className="space-y-6">
          <Hero />
          <ExploreSection />
        </div>

        <VirtualTour />

        <Opportunity />

        <section id="planimetria" className="mx-auto max-w-5xl scroll-mt-4 px-4">
          <SectionTitle
            eyebrow="Distribuzione"
            title="Planimetria"
            intro="Zona giorno e zona notte ben separate da un corridoio luminoso, 3 terrazze e 2 bagni: tocca la pianta per ingrandirla a schermo intero."
          />
          <FloorPlan src={floorPlan} />
        </section>

        <Location />

        <FinalCta />
      </main>

      <footer className="border-t border-line bg-card px-4 pb-28 pt-8 text-center text-xs leading-relaxed text-slate-ink">
        <p className="font-serif text-base font-semibold text-gulf">
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
