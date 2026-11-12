/** Segnaposto rosso ben visibile: da sostituire prima della messa online. */
export function DaControllare({ children, block = false }: { children: React.ReactNode; block?: boolean }) {
  const Tag = block ? "div" : "span";
  return (
    <Tag
      className={`${block ? "block" : "inline-block"} rounded-md border border-red-400 bg-red-50 px-2 py-0.5 text-sm font-bold text-red-600`}
    >
      [DA CONTROLLARE: {children}]
    </Tag>
  );
}
