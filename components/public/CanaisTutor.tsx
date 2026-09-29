import Link from "next/link";
import { Check, Minus, MessageCircle, Smartphone } from "lucide-react";
import type { Configuracao } from "@/types/conteudo";
import { linkWhatsapp } from "@/lib/util";

// O que o tutor faz em cada canal (documentação: 00_PetHub360_Ecossistema_
// Modulos.md e 02_PetGo360_App_Cliente_WhatsApp.pdf). WhatsApp e app são
// equivalentes para a jornada de compra; o que é SÓ do app vem das regras do
// projeto: carteira de vacinação (nunca pelo WhatsApp), pontos/Clube Pet
// (fidelização é no app), carteira de cupons e histórico/documentos do pet.
const PASSOS_WHATSAPP = [
  "Escreva do seu jeito o que o pet precisa — a assistente com IA entende o pedido.",
  "Compartilhe a localização e receba os parceiros mais próximos, com preço e horários.",
  "Escolha o horário e pague pelo link seguro (checkout) que chega na conversa.",
  "Receba o voucher com QR Code, a confirmação e o lembrete do atendimento.",
];

const COMPARATIVO: { item: string; whatsapp: boolean; nota?: string }[] = [
  { item: "Buscar serviços e parceiros perto de você", whatsapp: true },
  { item: "Ver preços e horários disponíveis", whatsapp: true },
  { item: "Reservar e pagar antecipado", whatsapp: true, nota: "pelo link seguro" },
  { item: "Voucher com QR Code e lembretes", whatsapp: true },
  { item: "Usar cupons OFF dos parceiros", whatsapp: true },
  { item: "Acompanhar o atendimento", whatsapp: true },
  { item: "Carteira de vacinação digital", whatsapp: false },
  { item: "Pontos, níveis e vantagens do Clube Pet", whatsapp: false },
  { item: "Carteira de cupons, histórico e documentos do pet", whatsapp: false },
];

export default function CanaisTutor({ configuracao, titulo = true }: { configuracao: Configuracao; titulo?: boolean }) {
  const whats = linkWhatsapp(configuracao.whatsapp, "Olá! Quero agendar um serviço para o meu pet.");
  return (
    <div>
      {titulo && (
        <>
          <div className="eyebrow">WhatsApp ou app — você escolhe</div>
          <h2 className="titulo">Comece pelo WhatsApp. Ganhe mais no app.</h2>
          <p className="sub" style={{ marginBottom: 28 }}>A mesma reserva, o mesmo parceiro e o mesmo preço nos dois canais. No app você ainda acumula pontos e tem a carteira do seu pet.</p>
        </>
      )}
      <div className="grade2" style={{ alignItems: "stretch" }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span className="ico" style={{ background: "#e7f8ee", color: "#128c4a" }}><MessageCircle size={22} /></span><h3 style={{ margin: 0 }}>No WhatsApp</h3></div>
          <div className="passos" style={{ marginTop: 18 }}>
            {PASSOS_WHATSAPP.map((p) => <div key={p} className="passo"><span>{p}</span></div>)}
          </div>
          {whats ? (
            <div className="acoes"><a href={whats} target="_blank" rel="noreferrer" className="btn btn-verde"><MessageCircle size={18} /> Chamar no WhatsApp</a></div>
          ) : (
            <p className="mut" style={{ marginTop: 18 }}>Atendimento pelo WhatsApp em breve.</p>
          )}
        </div>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span className="ico"><Smartphone size={22} /></span><h3 style={{ margin: 0 }}>No app PetGo360</h3></div>
          <p style={{ marginTop: 14 }}>Tudo que você faz no WhatsApp, e mais:</p>
          <table className="horarios" style={{ marginTop: 8 }}>
            <thead>
              <tr><th style={{ textAlign: "left", paddingBottom: 6 }}></th><th style={{ paddingBottom: 6, fontSize: 13 }}>WhatsApp</th><th style={{ paddingBottom: 6, fontSize: 13 }}>App</th></tr>
            </thead>
            <tbody>
              {COMPARATIVO.map((c) => (
                <tr key={c.item}>
                  <td style={{ textAlign: "left" }}>{c.item}{c.nota && <span className="mut" style={{ fontSize: 12 }}> ({c.nota})</span>}</td>
                  <td style={{ textAlign: "center", width: 80 }}>{c.whatsapp ? <Check size={16} color="#128c4a" aria-label="sim" /> : <Minus size={16} color="#98a29d" aria-label="não" />}</td>
                  <td style={{ textAlign: "center", width: 60 }}><Check size={16} color="var(--g)" aria-label="sim" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="acoes"><Link href="/petgo360#baixar" className="btn btn-primario"><Smartphone size={18} /> Baixar o app</Link></div>
        </div>
      </div>
    </div>
  );
}
