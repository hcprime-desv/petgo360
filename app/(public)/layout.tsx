import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import AvisosClient from "@/components/public/AvisosClient";
import { listarAvisosAtivos, listarConfiguracao, listarPaginasPublicadas } from "@/lib/data";

export const revalidate = 300;

// SSR (ver next.config.js): configuração, páginas do menu/rodapé e avisos
// já saem no HTML; os avisos seguem em tempo real no cliente. As cores da
// Configuração do site (painel → Portal Pet) sobrescrevem --g/--o.
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [configuracao, paginas, avisos] = await Promise.all([listarConfiguracao(), listarPaginasPublicadas(), listarAvisosAtivos()]);
  const tema = { ["--g" as any]: configuracao.corPrimaria, ["--o" as any]: configuracao.corDestaque } as React.CSSProperties;
  return (
    <div style={tema}>
      <AvisosClient avisosIniciais={avisos} />
      <Header configuracao={configuracao} paginas={paginas} />
      <main id="conteudo">{children}</main>
      <Footer configuracao={configuracao} paginas={paginas} />
    </div>
  );
}
