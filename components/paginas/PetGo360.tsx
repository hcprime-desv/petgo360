"use client";

import { CalendarCheck, Syringe, Ticket, Trophy, BellRing, History, PawPrint, MessageCircle } from "lucide-react";
import { useConfiguracao } from "@/components/public/AoVivo";
import { linkWhatsapp } from "@/lib/util";
import Lojas from "@/components/public/Lojas";
import CanaisTutor from "@/components/public/CanaisTutor";


const RECURSOS = [
  { icone: CalendarCheck, titulo: "Agende e pague", texto: "Escolha parceiro e horário, pague antecipado e receba o voucher com QR Code." },
  { icone: PawPrint, titulo: "Carteira do pet", texto: "Dados, fotos, documentos e histórico de atendimentos de cada pet." },
  { icone: Syringe, titulo: "Carteira do Pet", texto: "Vacinas com aviso da próxima dose, saúde e todo o histórico de atendimentos do seu pet." },
  { icone: Trophy, titulo: "Pontos e níveis", texto: "Cada agendamento e avaliação soma pontos. Quanto mais alto o nível, mais vantagens." },
  { icone: Ticket, titulo: "Cupons OFF", texto: "Resgate os cupons dos parceiros direto no agendamento." },
  { icone: BellRing, titulo: "Notificações", texto: "Confirmação, lembrete de horário, banho, vacina e ofertas perto de você." },
  { icone: History, titulo: "Histórico", texto: "Tudo que seu pet já fez, em um lugar só — inclusive o que começou no WhatsApp." },
];

// Página do app do tutor. Estratégia: WhatsApp traz o cliente, o app
// fideliza (pontos e vantagens só no app).
export default function PetGo360() {
  const c = useConfiguracao();
  const whats = linkWhatsapp(c.whatsapp, "Olá! Quero conhecer o PetGo360.");
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">App do tutor</div>
            <h1>PetGo360: tudo do seu pet, <span className="laranja">no seu bolso</span>.</h1>
            <p className="lead">Agende serviços, acompanhe a Carteira do Pet, acumule pontos e use os cupons dos parceiros. O que você começa no WhatsApp continua no app.</p>
            <div id="baixar"><Lojas configuracao={c} /></div>
            {whats && <p className="mut" style={{ marginTop: 16 }}>Prefere começar pelo WhatsApp? <a href={whats} target="_blank" rel="noreferrer" style={{ color: "var(--g)", fontWeight: 700 }}><MessageCircle size={14} style={{ display: "inline" }} /> Fale com a gente</a></p>}
          </div>
          <div className="hero-visual">
            <div className="ilustra">
              <b>PetGo360</b>
              <div className="phones" aria-hidden="true">
                <div className="phone"><b>Olá, tutor 👋</b><div className="mini" /><div className="mini" /><div className="mini" /><small>Pet • Vacinas • Pontos • Cupons</small></div>
                <div className="phone"><b>Carteira</b><div className="mini" /><div className="mini" /><div className="mini" /><small>Próxima dose em 12 dias</small></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="secao">
        <div className="wrap">
          <h2 className="titulo">O que você faz no app</h2>
          <div className="grade4" style={{ marginTop: 24 }}>
            {RECURSOS.map(({ icone: Icone, titulo, texto }) => (
              <div key={titulo} className="card"><div className="ico"><Icone size={22} /></div><h3>{titulo}</h3><p>{texto}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section id="whatsapp" className="secao faixa-creme">
        <div className="wrap"><CanaisTutor configuracao={c} /></div>
      </section>

      <section id="carteira" className="secao">
        <div className="wrap grade2" style={{ alignItems: "start" }}>
          <div>
            <div className="eyebrow">Carteira do Pet</div>
            <h2 className="titulo">A vida do seu pet, com você no controle</h2>
            <p className="lead">A carteira é do pet e do tutor, não de uma clínica: acompanha seu pet por toda a vida, em qualquer parceiro.</p>
            <ul className="lista-carteira">
              <li><b>Vacinas</b> — as que você já tomou (declaradas) e as aplicadas pelos parceiros (validadas), com aviso da próxima dose.</li>
              <li><b>Saúde</b> — consultas, exames, prescrições e o histórico de peso.</li>
              <li><b>Histórico de atendimentos</b> — banho, tosa, hotel, creche, transporte e atendimento em casa.</li>
            </ul>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Quem vê o quê</h3>
            <div className="passos" style={{ marginTop: 12 }}>
              <div className="passo"><span><b>Você</b> vê tudo, sempre, no app.</span></div>
              <div className="passo"><span>O <b>parceiro</b> só vê depois de ler o <b>QR Code</b> que você gera — e só o que você liberar: vacinas e, se quiser, a saúde.</span></div>
              <div className="passo"><span>Ele vê os atendimentos feitos <b>na empresa dele</b>, nunca os de outros parceiros.</span></div>
              <div className="passo"><span>O acesso <b>expira sozinho</b>. A carteira não é aberta pelo WhatsApp.</span></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
