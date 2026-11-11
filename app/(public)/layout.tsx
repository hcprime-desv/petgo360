import { Footer, Header } from "@/components/Moldura";
import ChatSite from "@/components/site/ChatSite";
import { lerConfigSite } from "@/lib/site";

// Configuração do site (/admin ou admsite360) lida a cada acesso; no navegador segue ao vivo.
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const config = await lerConfigSite();
  return (
    <>
      <Header config={config} />
      <main id="conteudo">{children}</main>
      <Footer config={config} />
      <ChatSite config={config} />
    </>
  );
}
