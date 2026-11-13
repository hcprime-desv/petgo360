import type { Metadata } from "next";
import { lerConfigSite } from "@/lib/site";
import { normalizarCodigoParceiro } from "@/lib/compartilhado/indicacoes";

// PROGRAMA DE INDICAÇÃO (12/11/2026): link do parceiro (pet shop, clínica, influenciador) — `/i/<CÓDIGO>`. Mostra o código para
// usar no cadastro do app (dias extras grátis) e os links das lojas. Não lê nada do parceiro no banco (comissão e Pix não
// ficam expostos): a validação do código é feita no cadastro do app.
export const metadata: Metadata = { title: "Ganhe dias extras no PetGo360", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function IndicacaoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo: bruto } = await params;
  const codigo = normalizarCodigoParceiro(decodeURIComponent(bruto));
  const config = await lerConfigSite();
  const play = config.googlePlay, store = config.appStore;
  return (
    <>
      <section className="pagina-cab">
        <div className="container">
          <span className="eyebrow">Indicação</span>
          <h1>Você ganhou dias extras no PetGo360</h1>
          <p>O passaporte de saúde do seu pet no celular: carteira de vacinação, lembretes, QR Code para o veterinário e pets perdidos. Baixe o app e use o código no cadastro.</p>
        </div>
      </section>
      <section className="section pagina-corpo" style={{ paddingTop: 36 }}>
        <div className="container">
          <div className="cta">
            <div>
              <div className="eyebrow">Seu código</div>
              <h2 style={{ letterSpacing: 3 }}>{codigo || "—"}</h2>
              <p>1. Baixe o PetGo360 · 2. Toque em <b>Criar conta</b> · 3. Digite o código <b>{codigo}</b> em “Código de indicação” · 4. Assine o Backup na nuvem com os dias grátis a mais.</p>
            </div>
            <div className="cta-acoes">
              <a href={play || "#"} className="loja" aria-label={play ? "Baixar no Google Play" : "Google Play (em breve)"} target={play ? "_blank" : undefined} rel="noreferrer"><span className="loja-ic">▶</span><span><small>{play ? "Disponível no" : "Em breve no"}</small><b>Google Play</b></span></a>
              <a href={store || "#"} className="loja" aria-label={store ? "Baixar na App Store" : "App Store (em breve)"} target={store ? "_blank" : undefined} rel="noreferrer"><span className="loja-ic"></span><span><small>{store ? "Disponível na" : "Em breve na"}</small><b>App Store</b></span></a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
