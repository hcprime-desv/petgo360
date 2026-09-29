"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Search, ChevronDown, Heart } from "lucide-react";
import type { Configuracao, Pagina } from "@/types/conteudo";
import { subscribePaginasPublicadas } from "@/lib/data";
import { useConfiguracao } from "./AoVivo";

// Menu fixo do documento do site (Início, Soluções, Serviços, Clube,
// Parceiros, PetGo360, Para Parceiros) — cada item pode ser desligado em
// Portal Pet → Configuração do site. Páginas com local "menu" entram depois,
// agrupadas pelo `submenu` (ex.: "Institucional" → Sobre, Como funciona).
type Item = { tipo: "link"; href: string; label: string } | { tipo: "grupo"; label: string; itens: { href: string; label: string }[] };

function montarMenu(c: Configuracao, paginas: Pagina[]): Item[] {
  const fixos: [boolean, string, string][] = [
    [true, "/", "Início"],
    [c.menu.solucoes, "/#solucoes", "Soluções"],
    [c.menu.servicos, "/servicos", "Serviços"],
    [c.menu.clube, "/clube", "Clube Pet"],
    [c.menu.parceiros, "/parceiros", "Parceiros"],
    [c.menu.petgo360, "/petgo360", "PetGo360"],
    [c.menu.paraParceiros, "/quero-ser-parceiro", "Para Parceiros"],
  ];
  const itens: Item[] = fixos.filter(([mostra]) => mostra).map(([, href, label]) => ({ tipo: "link", href, label }));
  const grupos = new Map<string, { href: string; label: string }[]>();
  for (const p of paginas.filter((x) => x.local === "menu")) {
    const link = { href: `/paginas/${p.slug}`, label: p.titulo };
    if (!p.submenu) itens.push({ tipo: "link", ...link });
    else grupos.set(p.submenu, [...(grupos.get(p.submenu) ?? []), link]);
  }
  grupos.forEach((lista, label) => itens.push({ tipo: "grupo", label, itens: lista }));
  return itens;
}

export function Logo({ configuracao }: { configuracao: Configuracao }) {
  return (
    <Link href="/" className="logo" aria-label={`${configuracao.nomeSite} — início`}>
      {configuracao.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={configuracao.logoUrl} alt={configuracao.nomeSite} />
      ) : (
        <>
          <span className="marca"><Heart size={20} fill="currentColor" /></span>
          {configuracao.nomeSite}
        </>
      )}
    </Link>
  );
}

// `paginasIniciais` vem do servidor (SSR); depois o menu acompanha a coleção
// `paginas` em tempo real — publicar/despublicar no painel reflete na hora.
export default function Header({ paginasIniciais }: { paginasIniciais: Pagina[] }) {
  const configuracao = useConfiguracao();
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [paginas, setPaginas] = useState<Pagina[]>(paginasIniciais);
  useEffect(() => subscribePaginasPublicadas(setPaginas), []);
  useEffect(() => setAberto(false), [pathname]);
  const itens = montarMenu(configuracao, paginas);
  const ativo = (href: string) => (href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href));

  return (
    <header className="cabecalho">
      <div className="wrap">
        <Logo configuracao={configuracao} />
        <nav className="menu" aria-label="Principal">
          {itens.map((i) =>
            i.tipo === "link" ? (
              <Link key={i.href} href={i.href} className={ativo(i.href) ? "ativo" : undefined} aria-current={ativo(i.href) ? "page" : undefined}>{i.label}</Link>
            ) : (
              <div key={i.label} className="grupo">
                <button type="button" className="sub" aria-haspopup="true">{i.label} <ChevronDown size={14} /></button>
                <div className="dropdown">{i.itens.map((s) => <Link key={s.href} href={s.href}>{s.label}</Link>)}</div>
              </div>
            ),
          )}
        </nav>
        <div className="cab-acoes">
          <Link href="/servicos" className="icone-btn esconde-mobile" aria-label="Buscar serviços"><Search size={20} /></Link>
          <Link href="/entrar" className="btn btn-contorno btn-sm esconde-mobile">Entrar</Link>
          <Link href="/petgo360#baixar" className="btn btn-primario btn-sm esconde-mobile">Cadastre-se</Link>
          <button type="button" className="icone-btn menu-mobile-btn" onClick={() => setAberto(!aberto)} aria-expanded={aberto} aria-controls="menu-mobile" aria-label={aberto ? "Fechar menu" : "Abrir menu"}>
            {aberto ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <div id="menu-mobile" className={`menu-mobile${aberto ? " aberto" : ""}`}>
        {itens.flatMap((i) => (i.tipo === "link" ? [i] : i.itens.map((s) => ({ tipo: "link" as const, ...s })))).map((i) => (
          <Link key={i.href} href={i.href}>{i.label}</Link>
        ))}
        <div className="botoes">
          <Link href="/entrar" className="btn btn-contorno btn-sm">Entrar</Link>
          <Link href="/petgo360#baixar" className="btn btn-primario btn-sm">Cadastre-se</Link>
        </div>
      </div>
    </header>
  );
}
