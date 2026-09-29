import type { Metadata } from "next";
import "./globals.css";
import { Caveat } from "next/font/google";

// Letra manuscrita do hero (frase = slogan da Configuração do site).
const manuscrita = Caveat({ subsets: ["latin"], weight: ["600"], variable: "--fonte-manuscrita", display: "swap" });
import { listarConfiguracao } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const c = await listarConfiguracao();
  return {
    title: { default: c.seoTitulo || c.nomeSite, template: `%s | ${c.nomeSite}` },
    description: c.seoDescricao || c.slogan,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={manuscrita.variable}>
      <body>{children}</body>
    </html>
  );
}
