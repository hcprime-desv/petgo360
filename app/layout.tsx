import type { Metadata } from "next";
import "./globals.css";
import { Inter, Poppins } from "next/font/google";

// Mesmo padrão do site p2pcorp: títulos em Poppins, texto em Inter; tema
// claro/escuro seguindo o aparelho (aplicado antes de pintar).
const titulo = Poppins({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--fonte-titulo", display: "swap" });
const texto = Inter({ subsets: ["latin"], variable: "--fonte-texto", display: "swap" });

export const metadata: Metadata = {
  title: { default: "PetGo360 — o passaporte de saúde do seu pet", template: "%s | PetGo360" },
  description: "Carteira de vacinação digital e o gestor da vida do seu pet. Leve o histórico a qualquer clínica pelo QR Code. Grátis para 1 pet.",
  icons: { icon: "/images/simbolo-petgo360.png" },
  openGraph: { title: "PetGo360", description: "O passaporte de saúde do seu pet.", siteName: "PetGo360", locale: "pt_BR", type: "website" },
};

const scriptTema = `(function(){try{var e=matchMedia("(prefers-color-scheme: dark)").matches?"escuro":"claro";document.documentElement.setAttribute("data-tema",e)}catch(_){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${texto.variable}`} data-tema="claro" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: scriptTema }} /></head>
      <body><div className="tema">{children}</div></body>
    </html>
  );
}
