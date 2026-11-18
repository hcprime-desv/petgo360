import type { Metadata } from "next";
import CadastroPuc from "@/components/site/CadastroPuc";

export const metadata: Metadata = {
  title: "Receba denúncias de maus-tratos — cadastro de ONGs e protetores",
  description: "ONGs e protetores independentes se cadastram para receber as denúncias de maus-tratos a animais da sua região (Disque Denúncia Pet).",
};

export default function CadastroPontoPage() {
  return (
    <>
      <section className="pagina-cab"><div className="container">
        <span className="eyebrow">Disque Denúncia Pet</span>
        <h1>Receba denúncias da sua região</h1>
        <p>ONGs e protetores independentes podem receber as denúncias de maus-tratos que as pessoas escolherem enviar a vocês — conversar com o denunciante (anônimo) e encaminhar aos órgãos competentes. O cadastro passa pela aprovação da central do PetGo360.</p>
      </div></section>
      <section className="section pagina-corpo" style={{ paddingTop: 36 }}><div className="container"><CadastroPuc /></div></section>
    </>
  );
}
