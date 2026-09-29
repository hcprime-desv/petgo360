import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import AvisosClient from "@/components/public/AvisosClient";
import { AoVivoProvider } from "@/components/public/AoVivo";
import { listarAvisosAtivos, listarConfiguracao, listarPaginasPublicadas, listarVitrine } from "@/lib/data";

// Sem cache: o servidor Node renderiza cada acesso com o dado atual do
// Firestore, e no navegador tudo segue em tempo real (AoVivoProvider para
// configuração/vitrine; Header/Footer para páginas; AvisosClient para avisos).
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [configuracao, vitrine, paginas, avisos] = await Promise.all([
    listarConfiguracao(), listarVitrine(), listarPaginasPublicadas(), listarAvisosAtivos(),
  ]);
  return (
    <AoVivoProvider configuracao={configuracao} vitrine={vitrine}>
      {/* Faixa de aviso + cabeçalho presos juntos no topo ao rolar. */}
      <div className="topo-fixo">
        <AvisosClient avisosIniciais={avisos} />
        <Header paginasIniciais={paginas} />
      </div>
      <main id="conteudo">{children}</main>
      <Footer paginasIniciais={paginas} />
    </AoVivoProvider>
  );
}
