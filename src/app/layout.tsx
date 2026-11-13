import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: "Quadrilocale 144 m² vista mare con terrazza, 2 balconi e garage | Via Vittorio Veneto 390, Torre Annunziata",
  description:
    "Quadrilocale di ~144 m² al 6° piano con ascensore, vista mare sul Golfo, terrazza, 2 balconi e box auto privato. Vendita diretta dal proprietario, 0% commissioni d'agenzia. € 250.000 trattabili.",
  openGraph: {
    title: "Quadrilocale 144 m² vista mare con terrazza, 2 balconi e garage — Torre Annunziata",
    description: "Vendita da privato, 0% commissioni. € 250.000 trattabili. Prenota una visita dal vivo.",
    images: ["/images/attuali/01-vista-mare-golfo.jpg"],
    locale: "it_IT",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E6BA8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={inter.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
