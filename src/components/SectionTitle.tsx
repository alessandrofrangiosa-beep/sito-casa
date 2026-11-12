export function SectionTitle({ eyebrow, title, intro }: { eyebrow: string; title: React.ReactNode; intro?: React.ReactNode }) {
  return (
    <div className="mb-6 max-w-2xl">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-terra">
        <span className="h-px w-6 bg-terra" /> {eyebrow}
      </p>
      <h2 className="mt-2 text-[1.75rem] font-semibold leading-tight sm:text-4xl">{title}</h2>
      {intro && <p className="mt-3 text-[15px] leading-relaxed text-slate-ink sm:text-base">{intro}</p>}
    </div>
  );
}
