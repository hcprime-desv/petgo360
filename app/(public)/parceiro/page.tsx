import type { Metadata } from "next";
import PortalParceiro from "@/components/site/PortalParceiro";

export const metadata: Metadata = {
  title: "Portal do Parceiro PetGo360",
  description: "Área do parceiro PetGo360: crie a cobrança e o cliente paga pelo app, com cupons e pontos do Clube PetGo.",
  robots: { index: false },
};

export default function ParceiroPage() {
  return (
    <section className="section pagina-corpo" style={{ paddingTop: 36 }}>
      <div className="container">
        <PortalParceiro />
      </div>
    </section>
  );
}
