import type { Metadata } from "next";
import { CalendarCheck, Syringe, Ticket, Trophy, BellRing, History, PawPrint, MessageCircle } from "lucide-react";
import { listarConfiguracao } from "@/lib/data";
import { linkWhatsapp } from "@/lib/util";
import Lojas from "@/components/public/Lojas";
import CanaisTutor from "@/components/public/CanaisTutor";

export const revalidate = 300;
export const metadata: Metadata = { title: "PetGo360", description: "O app do tutor: agende serviços, acompanhe a carteira de vacinação digital, acumule pontos e use cupons dos parceiros." };

const RECURSOS = [
  { icone: CalendarCheck, titulo: "Agende e pague", texto: "Escolha parceiro e horário, pague antecipado e receba o voucher com QR Code." },
  { icone: PawPrint, titulo: "Carteira do pet", texto: "Dados, fotos, documentos e histórico de atendimentos de cada pet." },
  { icone: Syringe, titulo: "Vacinação digital", texto: "Carteira de vacinação com lembrete da próxima dose e registro validado pelo parceiro." },
  { icone: Trophy, titulo: "Pontos e níveis", texto: "Cada agendamento e avaliação soma pontos. Quanto mais alto o nível, mais vantagens." },
  { icone: Ticket, titulo: "Cupons OFF", texto: "Resgate os cupons dos parceiros direto no agendamento." },
  { icone: BellRing, titulo: "Notificações", texto: "Confirmação, lembrete de horário, banho, vacina e ofertas perto de você." },
  { icone: History, titulo: "Histórico", texto: "Tudo que seu pet já fez, em um lugar só — inclusive o que começou no WhatsApp." },
];

// Página do app do tutor. Estratégia: WhatsApp traz o cliente, o app
// fideliza (pontos e vantagens só no app).
export default async function PetGo360Page() {
  const c = await listarConfiguracao();
  const whats = linkWhatsapp(c.whatsapp, "Olá! Quero conhecer o PetGo360.");
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">App do tutor</div>
            <h1>PetGo360: tudo do seu pet, <span className="laranja">no seu bolso</span>.</h1>
            <p className="lead">Agende serviços, acompanhe a carteira de vacinação, acumule pontos e use os cupons dos parceiros. O que você começa no WhatsApp continua no app.</p>
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

      <section id="vacinacao" className="secao">
        <div className="wrap grade2">
          <div>
            <div className="eyebrow">Carteira de Vacinação Digital</div>
            <h2 className="titulo">Sua carteira, suas regras</h2>
            <p className="lead">A carteira é do pet e do tutor. Você pode registrar as vacinas que já tomou (ficam como &quot;declaradas&quot;). As aplicadas por um parceiro habilitado entram como &quot;validadas&quot;.</p>
          </div>
          <div className="passos">
            <div className="passo"><span>No atendimento, abra a carteira no app e gere o <b>QR Code de acesso</b>.</span></div>
            <div className="passo"><span>O parceiro lê o código pelo app ou pelo portal e registra vacina, lote, fabricante e próxima dose.</span></div>
            <div className="passo"><span>O acesso expira sozinho. A carteira não é aberta pelo WhatsApp nem sem o seu QR Code.</span></div>
          </div>
        </div>
      </section>
    </>
  );
}
