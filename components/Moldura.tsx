"use client";

// Topo e rodapé no layout do site padrão (p2pcorp — mesmas classes).
import Link from "next/link";
import { useState } from "react";
import { Download, Menu, X } from "lucide-react";
import { BotaoTemaSite } from "./public/TemaSite";
import Avisos from "./site/Avisos";
import { useConfigSite } from "@/lib/siteAoVivo";
import type { ConfigSite } from "@/lib/site";

const LINKS = [
  { href: "/#inicio", rotulo: "Início" },
  { href: "/#como-funciona", rotulo: "Como funciona" },
  { href: "/#modulos", rotulo: "Módulos e serviços" },
  { href: "/#veterinarios", rotulo: "Para veterinários" },
  { href: "/#contato", rotulo: "Contato" },
];

function Logo({ branco = false }: { branco?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={branco ? "/images/logo-petgo360-branco.png" : "/images/logo-petgo360.png"} alt="PetGo360" />;
}

export function Header({ config }: { config: ConfigSite }) {
  const c = useConfigSite(config);
  const [aberto, setAberto] = useState(false);
  return (
    <div className="topo-fixo">
      <Avisos />
      <header className="topbar">
        <div className="container nav">
          <Link className="brand" href="/" aria-label="PetGo360 — início">
            <span className="logo-tema-claro"><Logo /></span>
            <span className="logo-tema-escuro"><Logo branco /></span>
          </Link>
          <nav className={`links${aberto ? " aberto" : ""}`} aria-label="Menu principal">
            {LINKS.map((l) => <Link key={l.href} href={l.href} onClick={() => setAberto(false)}>{l.rotulo}</Link>)}
            <Link href="/#baixar" className="btn btn-primary so-mobile" onClick={() => setAberto(false)}><Download size={18} /> Baixar o app</Link>
          </nav>
          <div className="nav-actions">
            {c.temaBotao && <BotaoTemaSite />}
            <Link href="/#baixar" className="btn btn-primary btn-baixar"><Download size={19} /> Baixar o app</Link>
          </div>
          <button className="menu-btn" type="button" onClick={() => setAberto((v) => !v)} aria-label={aberto ? "Fechar menu" : "Abrir menu"} aria-expanded={aberto}>
            {aberto ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </header>
    </div>
  );
}

export function Footer({ config }: { config: ConfigSite }) {
  const c = useConfigSite(config);
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-marca">
            <Logo branco />
            <p>{c.textoRodape}</p>
            {c.redes.length > 0 && <p className="footer-redes">{c.redes.map((r) => <a key={r.rede} href={r.url} target="_blank" rel="noreferrer" style={{ marginRight: 14, textTransform: "capitalize" }}>{r.rede}</a>)}</p>}
          </div>
          <div>
            <h4>O app</h4>
            <Link href="/#como-funciona">Como funciona</Link>
            <Link href="/#modulos">Módulos e preços</Link>
            <Link href="/#baixar">Baixar</Link>
          </div>
          <div>
            <h4>Profissionais</h4>
            <Link href="/#veterinarios">Veterinários e pet shops</Link>
            <Link href="/#contato">Contato</Link>
            {c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}
            {c.whatsapp && <a href={`https://wa.me/55${c.whatsapp.replace(/\D/g, "").replace(/^55/, "")}`} target="_blank" rel="noreferrer">WhatsApp {c.whatsapp}</a>}
          </div>
          <div>
            <h4>Legal</h4>
            <Link href="/termos-de-uso">Termos de uso</Link>
            <Link href="/privacidade">Política de privacidade</Link>
          </div>
        </div>
        <div className="footer-fim">
          <div className="copy">
            <span>© {new Date().getFullYear()} {c.nomeSite}. Todos os direitos reservados.</span>
            <span>Tecnologia P2P Corp</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
