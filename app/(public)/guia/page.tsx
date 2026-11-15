import type { Metadata } from "next";
import GuiaPet from "@/components/site/GuiaPet";

export const metadata: Metadata = {
  title: "Guia Pet — veterinários, pet shops, banho e tosa perto de você",
  description: "Encontre no mapa clínicas veterinárias, hospitais 24 h, pet shops, banho e tosa, hotéis, adestradores, farmácias veterinárias e ONGs perto de você — com trajeto, telefone e horário.",
};

export default function GuiaPage() {
  return (
    <>
      <section className="pagina-cab">
        <div className="container">
          <span className="eyebrow">Grátis · perto de você</span>
          <h1>Guia Pet</h1>
          <p>Tudo do mundo animal num mapa: veterinário, hospital 24 h, pet shop, banho e tosa, hotel e creche, adestrador, farmácia veterinária e ONGs. Clique num lugar para ver o trajeto, o telefone e o horário.</p>
        </div>
      </section>
      <section className="section pagina-corpo" style={{ paddingTop: 36 }}>
        <div className="container">
          <GuiaPet />
        </div>
      </section>
    </>
  );
}
