"use client";

import Link from "next/link";
import { Store, PawPrint } from "lucide-react";
import { useConfiguracao } from "@/components/public/AoVivo";
import Lojas from "@/components/public/Lojas";


// Portal do Parceiro (área autenticada) é a próxima etapa do site. Por ora
// esta página só orienta: tutor → app; parceiro → app do parceiro / cadastro.
export default function Entrar() {
  const c = useConfiguracao();
  return (
    <>
      <section className="pagina-cab">
        <div className="wrap">
          <h1>Entrar</h1>
          <p className="sub">Escolha como você usa o {c.nomeSite}.</p>
        </div>
      </section>
      <section className="secao" style={{ paddingTop: 32 }}>
        <div className="wrap grade2" style={{ alignItems: "stretch" }}>
          <div className="card">
            <div className="ico"><PawPrint size={22} /></div>
            <h3>Sou tutor</h3>
            <p>Sua conta fica no app PetGo360: agendamentos, carteira de vacinação, pontos e cupons.</p>
            <Lojas configuracao={c} />
          </div>
          <div className="card">
            <div className="ico"><Store size={22} /></div>
            <h3>Sou parceiro</h3>
            <p>O Portal do Parceiro no navegador está chegando. Enquanto isso, a operação é pelo app PetHub360 Parceiro.</p>
            <div className="acoes"><Link href="/quero-ser-parceiro" className="btn btn-primario">Ainda não sou parceiro</Link></div>
          </div>
        </div>
      </section>
    </>
  );
}
