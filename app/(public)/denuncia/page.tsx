import type { Metadata } from "next";
import DenunciaPet from "@/components/site/DenunciaPet";
import { lerConfigSite } from "@/lib/site";

export const metadata: Metadata = {
  title: "Disque Denúncia Pet — denuncie maus-tratos a animais",
  description: "Serviço de utilidade pública do PetGo360: denúncia ANÔNIMA de maus-tratos a animais, encaminhada ao órgão competente do seu município.",
};

export default async function DenunciaPage() {
  const config = await lerConfigSite();
  return (
    <>
      <section className="pagina-cab">
        <div className="container">
          <span className="eyebrow">Anônimo · utilidade pública</span>
          <h1>Disque Denúncia Pet</h1>
          <p>Viu um animal sendo maltratado, abandonado, sem comida ou acorrentado? Denuncie. Não registramos quem denuncia: a nossa central encaminha a denúncia ao órgão competente do seu município — também pelo WhatsApp e pelo app.</p>
        </div>
      </section>
      <section className="section pagina-corpo" style={{ paddingTop: 36 }}>
        <div className="container">
          <DenunciaPet whatsapp={config.whatsapp} />
        </div>
      </section>
    </>
  );
}
