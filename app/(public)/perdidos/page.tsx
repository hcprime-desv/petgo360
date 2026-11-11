import type { Metadata } from "next";
import PetsPerdidos from "@/components/site/PetsPerdidos";

export const metadata: Metadata = {
  title: "Pets perdidos e encontrados",
  description: "Serviço gratuito do PetGo360: registre um pet perdido ou encontrado com foto. O reconhecimento pela foto avisa o tutor e quem encontrou.",
};

export default function PerdidosPage() {
  return (
    <>
      <section className="pagina-cab">
        <div className="container">
          <span className="eyebrow">Grátis para todos</span>
          <h1>Pets perdidos e encontrados</h1>
          <p>Viu um destes pets? Avise o tutor. Perdeu ou encontrou um pet? Registre com foto: o reconhecimento compara com os pets procurados e avisa as duas pessoas na hora — também pelo WhatsApp.</p>
        </div>
      </section>
      <section className="section pagina-corpo" style={{ paddingTop: 36 }}>
        <div className="container">
          <PetsPerdidos />
        </div>
      </section>
    </>
  );
}
