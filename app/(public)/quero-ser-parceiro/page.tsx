import type { Metadata } from "next";
import { Wallet, CalendarCheck, Ticket, Syringe, BarChart3, Smartphone } from "lucide-react";
import LeadFormulario from "@/components/parceiro/LeadFormulario";

export const metadata: Metadata = { title: "Quero ser parceiro", description: "Receba reservas já pagas, publique cupons no Clube Pet e gerencie tudo pelo app ou pelo portal web." };

const BENEFICIOS = [
  { icone: Wallet, titulo: "Reserva já paga", texto: "O tutor paga antecipado e recebe o voucher. Menos falta, menos cobrança." },
  { icone: CalendarCheck, titulo: "Agenda organizada", texto: "Horários, confirmação, check-in e histórico em um lugar só." },
  { icone: Ticket, titulo: "Clube Pet", texto: "Publique cupons OFF e vantagens para atrair cliente novo e trazer de volta quem já veio." },
  { icone: Syringe, titulo: "Carteira do Pet", texto: "Com o QR Code do tutor, veja vacinas e saúde do pet e registre a vacina aplicada." },
  { icone: BarChart3, titulo: "Repasses e relatórios", texto: "Acompanhe vendas, repasses, avaliações e recorrência." },
  { icone: Smartphone, titulo: "App e portal web", texto: "Opere pelo celular no dia a dia ou pelo computador no balcão." },
];

export default function QueroSerParceiroPage() {
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="eyebrow">Para parceiros</div>
          <h1 style={{ maxWidth: 820 }}>Mais clientes para o seu negócio pet, <span className="laranja">sem complicação</span>.</h1>
          <p className="lead">Clínicas, hospitais veterinários, pet shops, banho e tosa, hotéis e creches, transporte e profissionais autônomos. Cadastre-se e fale com o nosso time.</p>
          <div className="acoes"><a href="#cadastro" className="btn btn-primario">Quero ser parceiro</a></div>
        </div>
      </section>

      <section className="secao">
        <div className="wrap">
          <h2 className="titulo">Por que entrar para o PetHub360</h2>
          <div className="grade3" style={{ marginTop: 24 }}>
            {BENEFICIOS.map(({ icone: Icone, titulo, texto }) => (
              <div key={titulo} className="card"><div className="ico"><Icone size={22} /></div><h3>{titulo}</h3><p>{texto}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section id="cadastro" className="secao faixa-creme">
        <div className="wrap grade2" style={{ alignItems: "start" }}>
          <div>
            <div className="eyebrow">Cadastro</div>
            <h2 className="titulo">Comece agora</h2>
            <p className="sub">Preencha os dados abaixo. Nosso time analisa o cadastro, apresenta os planos e ajuda na configuração dos serviços.</p>
            <div className="passos" style={{ marginTop: 22 }}>
              <div className="passo"><span>Você envia o interesse por este formulário.</span></div>
              <div className="passo"><span>O comercial entra em contato e apresenta os planos.</span></div>
              <div className="passo"><span>Cadastro aprovado: você configura serviços e agenda e começa a receber reservas.</span></div>
            </div>
          </div>
          <div className="card"><LeadFormulario /></div>
        </div>
      </section>
    </>
  );
}
