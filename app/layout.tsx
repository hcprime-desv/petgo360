import type { Metadata } from "next";
import "./globals.css";
import { scriptTemaSite } from "@/components/public/temaSiteScript";
import { Inter, Poppins } from "next/font/google";
import { lerConfigSite } from "@/lib/site";

// Mesmo padrão do site p2pcorp: títulos em Poppins, texto em Inter; tema
// claro/escuro seguindo o aparelho (aplicado antes de pintar).
const titulo = Poppins({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--fonte-titulo", display: "swap" });
const texto = Inter({ subsets: ["latin"], variable: "--fonte-texto", display: "swap" });

const DESCRICAO = "Carteira de vacinação digital e o gestor da vida do seu pet. Leve o histórico a qualquer clínica pelo QR Code. Grátis para 1 pet.";

// Nome e SEO: Configuração do site (/admin ou admsite360); sem configuração, o padrão.
export async function generateMetadata(): Promise<Metadata> {
  const c = await lerConfigSite();
  const titulo = c.seoTitulo || `${c.nomeSite} — o passaporte de saúde do seu pet`;
  const descricao = c.seoDescricao || DESCRICAO;
  return {
    title: { default: titulo, template: `%s | ${c.nomeSite}` },
    description: descricao,
    icons: { icon: "/images/simbolo-petgo360.png" },
    openGraph: { title: titulo, description: descricao, siteName: c.nomeSite, locale: "pt_BR", type: "website" },
  };
}

// Padrão ESCURO (dono, 11/11/2026) ou o "Tema do site" da Configuração; a escolha do visitante (sol/lua) vale só no navegador dele.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const c = await lerConfigSite();
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${texto.variable}`} data-tema={c.tema === "claro" ? "claro" : "escuro"} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: scriptTemaSite(c.tema) }} /></head>
      <body><div className="tema">{children}</div></body>
    </html>
  );
}
