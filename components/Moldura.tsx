"use client";

// Topo e rodapé no layout do site padrão (p2pcorp — mesmas classes).
import Link from "next/link";
import { useState } from "react";
import { Download, Menu, X } from "lucide-react";

const LINKS = [
  { href: "/#inicio", rotulo: "Início" },
  { href: "/#como-funciona", rotulo: "Como funciona" },
  { href: "/#modulos", rotulo: "Módulos e serviços" },
  { href: "/#veterinarios", rotulo: "Para veterinários" },
];

function Logo({ branco = false }: { branco?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={branco ? "/images/logo-petgo360-branco.png" : "/images/logo-petgo360.png"} alt="PetGo360" />;
}

export function Header() {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="topo-fixo">
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

export function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-marca">
            <Logo branco />
            <p>O passaporte de saúde do seu pet: vacinas, saúde e proteção no celular, para levar a qualquer clínica ou pet shop.</p>
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
          </div>
          <div>
            <h4>Legal</h4>
            <Link href="/termos-de-uso">Termos de uso</Link>
            <Link href="/privacidade">Política de privacidade</Link>
          </div>
        </div>
        <div className="footer-fim">
          <div className="copy">
            <span>© {new Date().getFullYear()} PetGo360. Todos os direitos reservados.</span>
            <span>Tecnologia P2P Corp</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
