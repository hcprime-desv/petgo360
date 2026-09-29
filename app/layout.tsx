import type { Metadata } from "next";
import "./globals.css";
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
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
