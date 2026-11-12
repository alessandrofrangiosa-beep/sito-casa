import { composition } from "@/data/composition";

/** Elenco della composizione reale, ambiente per ambiente */
export function CompositionList() {
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
      {composition.map((c) => (
        <li key={c.area} className="grid grid-cols-[6.5rem_1fr] gap-3 px-4 py-3.5 sm:grid-cols-[8rem_1fr]">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">{c.area}</span>
          <span className="text-[15px] leading-snug text-ink">{c.text}</span>
        </li>
      ))}
    </ol>
  );
}
