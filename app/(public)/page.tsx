import Link from "next/link";
import { ChevronRight, Clock, Download, FileText, QrCode, ShieldAlert, ShieldCheck, Smartphone, Stethoscope, Syringe, CheckCircle2, Lock } from "lucide-react";
import Modulos from "@/components/Modulos";
import Contato from "@/components/site/Contato";
import Perguntas from "@/components/site/Perguntas";
import { lerConfigSite } from "@/lib/site";

// Página inicial do PetGo360 (layout do site padrão: hero + hero-numeros,
// faixa de cartões, como funciona, módulos, veterinários, baixar).
const PASSOS = [
  { titulo: "Cadastre seu pet", texto: "Raça, peso, microchip, alergias. Grátis para 1 pet." },
  { titulo: "Registre as vacinas", texto: "Data, lote e próxima dose. O app avisa antes de vencer." },
  { titulo: "Mostre o QR Code", texto: "Na clínica ou no pet shop, o profissional abre a carteira no celular dele." },
  { titulo: "Ele valida na hora", texto: "O veterinário registra a vacina e você recebe o aviso: “Validado por profissional”." },
];

export default async function HomePage() {
  const config = await lerConfigSite();
  const play = config.googlePlay, store = config.appStore;
  return (
    <>
      <section className="hero" id="inicio">
        <div className="hero-bg" style={{ ["--banner" as any]: "url('/images/hero-bg.jpg')", ["--banner-mobile" as any]: "url('/images/hero-bg.jpg')" }} />
        <div className="container hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">Carteira de vacinação digital</div>
            <h1>O passaporte de saúde<span className="g">do seu pet.</span></h1>
            <p>Nunca mais perca a carteirinha de papel. Vacinas, saúde e alimentação no celular, para mostrar em qualquer clínica ou pet shop pelo QR Code.</p>
            <div className="hero-actions">
              <Link href="#baixar" className="btn btn-grande btn-primary"><Download size={28} aria-hidden /><span><b>Baixar o app</b><small>grátis para 1 pet</small></span><ChevronRight size={20} aria-hidden /></Link>
              <Link href="#veterinarios" className="btn btn-grande btn-outline-green"><Stethoscope size={28} aria-hidden /><span><b>Sou veterinário</b><small>como funciona o QR</small></span><ChevronRight size={20} aria-hidden /></Link>
            </div>
            <div className="chips">
              <span className="chip"><span className="chip-ic"><Smartphone size={18} /></span>Dados no seu celular</span>
              <span className="chip"><span className="chip-ic"><Lock size={18} /></span>LGPD</span>
              <span className="chip"><span className="chip-ic"><Clock size={18} /></span>QR de 10 minutos</span>
            </div>
          </div>
          <div className="hero-numeros">
            <div className="numero"><span className="numero-ic"><Syringe size={22} /></span><div><strong>Vacinas em dia</strong><span>Alerta antes de cada dose.</span></div></div>
            <div className="numero"><span className="numero-ic"><QrCode size={22} /></span><div><strong>QR Code</strong><span>Sem o profissional baixar nada.</span></div></div>
            <div className="numero"><span className="numero-ic"><FileText size={22} /></span><div><strong>PDF</strong><span>Para viagens e hotéis.</span></div></div>
          </div>
        </div>
      </section>

      <section className="section" id="como-funciona">
        <div className="container">
          <div className="section-head">
            <div><div className="eyebrow">Como funciona</div><h2>Simples para o tutor, <span className="destaque">rápido para o vet</span></h2></div>
            <p>O PetGo360 é o gestor da vida do seu pet. Comece grátis com as vacinas e acrescente só o que fizer sentido.</p>
          </div>
          <div className="flow">{PASSOS.map((p) => <div className="step" key={p.titulo}><strong>{p.titulo}</strong><p>{p.texto}</p></div>)}</div>
        </div>
      </section>

      <section className="section soft" id="modulos">
        <div className="container">
          <div className="section-head">
            <div><div className="eyebrow">Módulos</div><h2>Pague só pelo que <span className="destaque">usar</span></h2></div>
            <p>Grátis: 1 pet e as vacinas. Histórico de saúde, alimentação, PDF completo, alertas por WhatsApp e mais pets são módulos — ou leve o pacote Completo.</p>
          </div>
          <Modulos />
        </div>
      </section>

      <section className="section" id="veterinarios">
        <div className="container two-col">
          <div>
            <div className="eyebrow">Para veterinários e pet shops</div>
            <h2 className="h2-grande">Leia o QR Code e <span className="destaque" style={{ color: "var(--green)" }}>valide na hora</span></h2>
            <p className="texto-mut">Você não precisa instalar nada nem ter cadastro. Aponte a câmera do celular para o QR Code que o tutor mostrar: a carteira do pet abre no navegador, com vacinas, alergias e histórico.</p>
            <ul className="lista-check">
              <li>Registre a vacina aplicada (com lote e próxima dose) em segundos.</li>
              <li>Confirme as vacinas que o tutor declarou — elas passam a “Validado por profissional”.</li>
              <li>O QR vale 10 minutos; aberto, a página fica liberada por 1 hora.</li>
              <li>O tutor recebe o aviso de que você atualizou a carteira.</li>
            </ul>
          </div>
          <div className="panel">
            <div className="panel-head"><b>Carteira do pet</b><div className="panel-sub">aberta pelo QR Code · sem aplicativo</div></div>
            <div className="panel-body">
              <div className="checks" style={{ margin: 0 }}>
                <div className="check"><span className="dot"><CheckCircle2 size={14} /></span>V10 · 2ª dose · Lote 23A · Validado por profissional</div>
                <div className="check"><span className="dot"><CheckCircle2 size={14} /></span>Antirrábica · próxima em 12/2026</div>
                <div className="check"><span className="dot"><ShieldCheck size={14} /></span>Alergia: dipirona</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="denuncia">
        <div className="container">
          <div className="dp-chamada">
            <span className="dp-icone"><ShieldAlert size={30} /></span>
            <div style={{ flex: 1 }}>
              <span className="eyebrow">Utilidade pública · anônimo</span>
              <h2 style={{ margin: "4px 0 6px" }}>Disque Denúncia Pet</h2>
              <p style={{ margin: 0 }}>Viu maus-tratos a um animal? Denuncie pelo site, pelo app ou pelo WhatsApp. Não registramos quem denuncia — a central encaminha ao órgão competente do seu município.</p>
            </div>
            <Link className="btn btn-primary" href="/denuncia">Denunciar <ChevronRight size={18} /></Link>
          </div>
        </div>
      </section>

      <section className="section soft" id="baixar">
        <div className="container">
          <div className="cta">
            <div>
              <div className="eyebrow">Baixe grátis</div>
              <h2>O seu pet merece um passaporte de saúde.</h2>
              <p>Disponível para Android e iPhone. Comece grátis com 1 pet e as vacinas.</p>
            </div>
            <div className="cta-acoes">
              <a href={play || "#"} className="loja" aria-label={play ? "Baixar no Google Play" : "Google Play (em breve)"} target={play ? "_blank" : undefined} rel="noreferrer"><span className="loja-ic">▶</span><span><small>{play ? "Disponível no" : "Em breve no"}</small><b>Google Play</b></span></a>
              <a href={store || "#"} className="loja" aria-label={store ? "Baixar na App Store" : "App Store (em breve)"} target={store ? "_blank" : undefined} rel="noreferrer"><span className="loja-ic"></span><span><small>{store ? "Disponível na" : "Em breve na"}</small><b>App Store</b></span></a>
            </div>
          </div>
        </div>
      </section>

      <Perguntas />
      <Contato config={config} />
    </>
  );
}
