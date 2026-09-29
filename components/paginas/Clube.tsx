"use client";

import Link from "next/link";
import { Crown, Ticket, Smartphone } from "lucide-react";
import { useConfiguracao, useVitrine } from "@/components/public/AoVivo";
import { CardBeneficio } from "@/components/vitrine/Cards";
import Lojas from "@/components/public/Lojas";


// Vitrine do Clube: cupons OFF (campanhas publicadas com canal "site" e
// saldo) e vantagens dos parceiros para membros. O resgate é SEMPRE pelo app
// — o cupom tem código único e status central, pra não ser usado duas vezes
// em canais diferentes.
export default function Clube() {
  const c = useConfiguracao();
  const vitrine = useVitrine();
  const porId = new Map(vitrine.parceiros.map((p) => [p.id, p]));
  const cupons = vitrine.beneficios.filter((b) => b.origem === "cupom_off");
  const vantagens = vitrine.beneficios.filter((b) => b.origem === "vantagem");

  return (
    <>
      <section className="pagina-cab">
        <div className="wrap">
          <div className="eyebrow">Clube Pet</div>
          <h1>Economize no cuidado do seu pet</h1>
          <p className="sub">Os parceiros publicam cupons OFF e vantagens para quem é do Clube Pet. Você descobre aqui e resgata no app, na hora de agendar.</p>
        </div>
      </section>

      <section className="secao" style={{ paddingTop: 36 }}>
        <div className="wrap">
          <div className="grade3" style={{ marginBottom: 44 }}>
            <div className="card"><div className="ico"><Ticket size={22} /></div><h3>Cupons OFF</h3><p>Desconto em serviços dos parceiros, com quantidade limitada. Cada cupom tem um código único.</p></div>
            <div className="card"><div className="ico"><Crown size={22} /></div><h3>Vantagens do Clube</h3><p>Benefícios permanentes para membros, que crescem conforme o seu nível no Clube Pet.</p></div>
            <div className="card"><div className="ico"><Smartphone size={22} /></div><h3>Resgate no app</h3><p>Usou o app, ganhou pontos: agendamentos e avaliações somam para subir de nível.</p></div>
          </div>

          <h2 className="titulo" style={{ fontSize: 30 }}>Cupons OFF disponíveis</h2>
          {cupons.length ? (
            <div className="grade4" style={{ margin: "18px 0 44px" }}>
              {cupons.map((b) => <CardBeneficio key={b.id} beneficio={b} parceiro={porId.get(b.idEmpresa)} />)}
            </div>
          ) : <p className="vazio">Nenhum cupom disponível agora — novos lotes entram toda semana.</p>}

          <h2 className="titulo" style={{ fontSize: 30 }}>Vantagens para membros</h2>
          {vantagens.length ? (
            <div className="grade4" style={{ marginTop: 18 }}>
              {vantagens.map((b) => <CardBeneficio key={b.id} beneficio={b} parceiro={porId.get(b.idEmpresa)} />)}
            </div>
          ) : <p className="vazio">As vantagens dos parceiros aparecem aqui assim que forem aprovadas.</p>}
        </div>
      </section>

      <section className="secao faixa-escura">
        <div className="wrap grade2">
          <div>
            <h2 className="titulo">Baixe o PetGo360 e comece a economizar</h2>
            <p className="sub">Crie a conta, cadastre seu pet e resgate os cupons direto no agendamento.</p>
            <Lojas configuracao={c} />
          </div>
          <div>
            <h3 style={{ marginTop: 0 }}>É parceiro?</h3>
            <p className="sub">Publique cupons OFF no Clube e transforme benefício em cliente novo e recorrência.</p>
            <div className="acoes"><Link href="/quero-ser-parceiro" className="btn btn-primario">Quero ser parceiro</Link></div>
          </div>
        </div>
      </section>
    </>
  );
}
