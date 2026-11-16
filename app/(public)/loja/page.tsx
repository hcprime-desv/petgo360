import type { Metadata } from "next";
import LojaSite from "@/components/site/LojaSite";

export const metadata: Metadata = {
  title: "Loja PetGo360 — Backup, Clube e serviços para o seu pet",
  description: "Contrate o Backup na nuvem, o Clube PetGo, recursos e serviços de parceiros com Pix. Ativa na hora no app e você ganha pontos.",
};

export default function LojaPage() {
  return (
    <>
      <section className="pagina-cab"><div className="container"><span className="eyebrow">Pix · ativa na hora no app</span><h1>Loja PetGo360</h1>
        <p>Backup na nuvem, Clube PetGo, recursos da conta e serviços de parceiros — com a mesma conta do app. Cada compra rende pontos.</p></div></section>
      <section className="section pagina-corpo" style={{ paddingTop: 36 }}><div className="container"><LojaSite /></div></section>
    </>
  );
}
