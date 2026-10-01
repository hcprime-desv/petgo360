"use client";

import Link from "next/link";
import {
  PawPrint, Store, MessageCircle, Settings2, ArrowRight, Stethoscope, Scale, MapPin, Ticket, Syringe, Handshake, ShieldCheck, QrCode, BellRing, Users, Heart, TrendingUp, Building2,
} from "lucide-react";
import { useConfiguracao, useVitrine } from "@/components/public/AoVivo";
import { ehExterno } from "@/lib/util";
import { CardBeneficio, CardCategoria, CardParceiro } from "@/components/vitrine/Cards";
import Lojas from "@/components/public/Lojas";
import CanaisTutor from "@/components/public/CanaisTutor";


// Título da Home com a palavra de destaque pintada na cor de ação.
function TituloHero({ titulo, destaque }: { titulo: string; destaque: string }) {
  const i = destaque ? titulo.toLowerCase().indexOf(destaque.toLowerCase()) : -1;
  if (i < 0) return <h1>{titulo}</h1>;
  return (
    <h1>
      {titulo.slice(0, i)}
      <span className="laranja destaque-coracao">{titulo.slice(i, i + destaque.length)}<CoracaoDesenhado className="coracao-titulo" /></span>
      {titulo.slice(i + destaque.length)}
    </h1>
  );
}

function BotaoLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  return ehExterno(href) ? <a href={href} className={className} target="_blank" rel="noreferrer">{children}</a> : <Link href={href} className={className}>{children}</Link>;
}

// Traços desenhados à mão do hero (imagem de referência do layout).
function CoracaoDesenhado({ className, contorno = false }: { className?: string; contorno?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 32 30" aria-hidden="true">
      <path d="M16 27C9 21.5 3 16.8 3 10.4 3 6.3 6.1 3.2 10 3.2c2.5 0 4.6 1.3 6 3.3 1.4-2 3.5-3.3 6-3.3 3.9 0 7 3.1 7 7.2 0 6.4-6 11.1-13 16.6z"
        fill={contorno ? "none" : "currentColor"} stroke="currentColor" strokeWidth={contorno ? 2.4 : 0} strokeLinejoin="round" />
    </svg>
  );
}

const CORES_NUMERO = ["var(--g)", "var(--o)", "var(--g2)", "#c98500"];
const ICONES_NUMERO = [Building2, Users, Heart, TrendingUp];

export default function Home() {
  const c = useConfiguracao();
  const vitrine = useVitrine();
  const porId = new Map(vitrine.parceiros.map((p) => [p.id, p]));
  const beneficiosPor = new Map<string, number>();
  vitrine.beneficios.forEach((b) => beneficiosPor.set(b.idEmpresa, (beneficiosPor.get(b.idEmpresa) ?? 0) + 1));
  // Destaques: os marcados no painel (Empresas → Destaque no site), na ordem; sem nenhum, os mais bem avaliados.
  const marcados = vitrine.parceiros.filter((p) => p.destaque).sort((a, b) => a.ordemDestaque - b.ordemDestaque);
  const totalServicos = vitrine.parceiros.reduce((n, p) => n + p.servicos.length, 0);
  const destaques = (marcados.length ? marcados : [...vitrine.parceiros].sort((a, b) => b.avaliacaoMedia - a.avaliacaoMedia)).slice(0, Math.max(3, Math.min(c.quantidadeDestaques, 6)));

  return (
    <>
      {/* ── Hero ── */}
      {c.heroImagemUrl ? (
        // Com imagem de topo (Configuração do site): foto em faixa inteira à
        // direita, fundindo no creme; frase manuscrita = slogan; atalhos no canto.
        <section className="hero hero-foto">
          <div className="hero-foto-img" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.heroImagemUrl} alt="" />
          </div>
          {c.slogan && (
            <div className="hero-manuscrito" aria-hidden="true">
              <span>{c.slogan}</span>
              <svg className="hero-traco" viewBox="0 0 160 24"><path d="M4 18c38-10 88-16 150-10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
            </div>
          )}
          <CoracaoDesenhado className="hero-coracao-contorno" contorno />
          <div className="wrap hero-foto-conteudo">
            <div className="hero-texto">
              {c.heroChamada && <div className="eyebrow">{c.heroChamada}</div>}
              <TituloHero titulo={c.heroTitulo} destaque={c.heroTituloDestaque} />
              {c.heroTexto && <p className="lead">{c.heroTexto}</p>}
              <div className="acoes">
                <BotaoLink href={c.ctaPrincipalLink} className="btn btn-primario btn-grande">{c.ctaPrincipalTexto} <ArrowRight size={20} /></BotaoLink>
                <BotaoLink href={c.ctaSecundarioLink} className="btn btn-contorno btn-grande">{c.ctaSecundarioTexto}</BotaoLink>
              </div>
            </div>
            <nav className="hero-atalhos hero-atalhos-foto" aria-label="Atalhos">
              <Link href="/servicos"><MapPin size={20} color="#f36b21" />Serviços perto de você</Link>
              <Link href="/clube"><Ticket size={20} color="#14523d" />Clube Pet</Link>
              <Link href="/petgo360#carteira"><Syringe size={20} color="#f36b21" />Carteira do Pet</Link>
              <Link href="/petgo360#whatsapp"><MessageCircle size={20} color="#14523d" />Atendimento no WhatsApp</Link>
              <Link href="/quero-ser-parceiro"><Handshake size={20} color="#f36b21" />Seja um parceiro</Link>
            </nav>
          </div>
          <svg className="hero-curva" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60V38C360 8 1080 8 1440 38V60Z" /></svg>
        </section>
      ) : (
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            {c.heroChamada && <div className="eyebrow">{c.heroChamada}</div>}
            <TituloHero titulo={c.heroTitulo} destaque={c.heroTituloDestaque} />
            {c.heroTexto && <p className="lead">{c.heroTexto}</p>}
            <div className="acoes">
              <BotaoLink href={c.ctaPrincipalLink} className="btn btn-primario">{c.ctaPrincipalTexto} →</BotaoLink>
              <BotaoLink href={c.ctaSecundarioLink} className="btn btn-contorno">{c.ctaSecundarioTexto}</BotaoLink>
            </div>
          </div>
          <div className="hero-visual">
            {c.heroImagemUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.heroImagemUrl} alt="" />
            ) : (
              <div className="ilustra">
                <b>PetGo360</b>
                <div style={{ opacity: 0.8 }}>Tudo do WhatsApp também no app — com fidelidade e benefícios.</div>
                <div className="phones" aria-hidden="true">
                  <div className="phone"><b>Olá, tutor 👋</b><div className="mini" /><div className="mini" /><div className="mini" /><small>Pet • Vacinas • Pontos • Cupons</small></div>
                  <div className="phone"><b>Clube OFF</b><div className="mini" /><div className="mini" /><div className="mini" /><small>Benefícios perto de você</small></div>
                </div>
              </div>
            )}
            <nav className="hero-atalhos" aria-label="Atalhos">
              <Link href="/servicos"><span className="ico"><MapPin size={16} /></span>Serviços perto de você</Link>
              <Link href="/clube"><span className="ico"><Ticket size={16} /></span>Clube Pet</Link>
              <Link href="/petgo360#carteira"><span className="ico"><Syringe size={16} /></span>Carteira do Pet</Link>
              <Link href="/quero-ser-parceiro"><span className="ico"><Handshake size={16} /></span>Seja um parceiro</Link>
            </nav>
          </div>
        </div>
      </section>
      )}

      {/* ── Números (só os cadastrados no painel) ── */}
      {c.numeros.length > 0 && (
        <section className="numeros" aria-label="Números">
          <div className="wrap grade">
            {c.numeros.map((n, i) => {
              const Icone = ICONES_NUMERO[i % ICONES_NUMERO.length];
              return (
                <div key={n.rotulo} className="numero">
                  <span className="ico" style={{ background: CORES_NUMERO[i % CORES_NUMERO.length] }}><Icone size={24} /></span>
                  <div><span className="rot">{n.rotulo}</span><b>{n.valor >= 1000 ? `+${n.valor.toLocaleString("pt-BR")}` : n.valor}</b><small>{n.detalhe}</small></div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Ecossistema ── */}
      <section id="solucoes" className="secao">
        <div className="wrap">
          <div className="eyebrow">Soluções</div>
          <h2 className="titulo">Um ecossistema, quatro experiências</h2>
          <p className="sub" style={{ marginBottom: 28 }}>Cada público usa o canal mais conveniente, compartilhando a mesma base e as mesmas regras.</p>
          <div className="grade4">
            <div className="card"><div className="ico"><PawPrint size={22} /></div><h3>PetGo360</h3><p>App do tutor com a Carteira do Pet (vacinas, saúde e histórico), serviços, pontos e cupons.</p><Link href="/petgo360" className="card-link">Conhecer o app →</Link></div>
            <div className="card"><div className="ico"><Store size={22} /></div><h3>Parceiro</h3><p>App e portal web para serviços, agenda, clientes, vacinação, cupons, fidelidade e relatórios.</p><Link href="/quero-ser-parceiro" className="card-link">Para parceiros →</Link></div>
            <div className="card"><div className="ico"><MessageCircle size={22} /></div><h3>WhatsApp</h3><p>Busque, reserve e pague conversando — com a mesma reserva e o mesmo preço do app.</p><Link href="#whatsapp" className="card-link">Como funciona →</Link></div>
            <div className="card"><div className="ico"><Settings2 size={22} /></div><h3>Plataforma</h3><p>Gestão central de parceiros, regras, conteúdo, pagamentos e indicadores — com segurança e LGPD.</p><Link href="/paginas/como-funciona" className="card-link">Como funciona →</Link></div>
          </div>
        </div>
      </section>

      {/* ── WhatsApp × App ── */}
      <section id="whatsapp" className="secao faixa-creme">
        <div className="wrap"><CanaisTutor configuracao={c} /></div>
      </section>

      {/* ── Serviços ── */}
      {vitrine.categorias.length > 0 && (
        <section className="secao">
          <div className="wrap">
            <div className="secao-cab">
              <div>
                <div className="eyebrow">Serviços</div>
                <h2 className="titulo">Do que seu pet precisa hoje?</h2>
                <p className="sub">Parceiros avaliados, reserva com pagamento antecipado e voucher com QR Code.</p>
              </div>
              <form action="/servicos" className="busca-barra" role="search" style={{ gridTemplateColumns: "1fr auto", minWidth: "min(100%, 420px)" }}>
                <div className="campo"><label htmlFor="home-q">Buscar</label><input id="home-q" name="q" placeholder="Banho, vacina, consulta, hotel…" /></div>
                <div className="campo" style={{ justifyContent: "flex-end" }}><button className="btn btn-primario" type="submit">Buscar</button></div>
              </form>
            </div>
            <div className="grade4">
              {vitrine.categorias.slice(0, 8).map((cat) => <CardCategoria key={cat.id} categoria={cat} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Clube Pet ── */}
      <section id="clube" className="secao faixa-escura">
        <div className="wrap">
          <div className="secao-cab">
            <div>
              <div className="eyebrow">Clube Pet</div>
              <h2 className="titulo">Benefício de verdade, no parceiro perto de você</h2>
              <p className="sub">Cupons OFF dos parceiros e vantagens exclusivas para membros do Clube. Descubra aqui e resgate no app.</p>
            </div>
            <Link href="/clube" className="btn btn-primario">Ver todos os benefícios</Link>
          </div>
          {vitrine.beneficios.length ? (
            <div className="grade4">
              {vitrine.beneficios.slice(0, 4).map((b) => <CardBeneficio key={b.id} beneficio={b} parceiro={porId.get(b.idEmpresa)} />)}
            </div>
          ) : (
            <p className="mut">Novos benefícios em breve.</p>
          )}
        </div>
      </section>

      {/* ── Carteira do Pet ── */}
      <section className="secao">
        <div className="wrap grade2">
          <div>
            <div className="eyebrow">Carteira do Pet</div>
            <h2 className="titulo">Toda a vida do seu pet em um só lugar</h2>
            <p className="lead">No app PetGo360 a carteira guarda as vacinas (com aviso da próxima dose), a saúde — consultas, exames, prescrições e peso — e todo o histórico de atendimentos: banho, tosa, hotel, creche e transporte.</p>
            <div className="passos" style={{ marginTop: 22 }}>
              <div className="passo"><span>No atendimento, você gera um <b>QR Code</b> no app e escolhe o que liberar.</span></div>
              <div className="passo"><span>O parceiro vê vacinas e saúde e registra o que fez — a vacina entra <b>validada</b>.</span></div>
              <div className="passo"><span>O acesso expira sozinho. Ninguém vê os serviços que você fez em outros parceiros.</span></div>
            </div>
          </div>
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><span className="ico"><PawPrint size={22} /></span><b style={{ fontSize: 18 }}>Como a carteira aparece no app</b></div>
            {([
              [BellRing, "Próxima dose: V10", "em 12 dias", "Aviso", true],
              [Store, "Banho e tosa", "Pet shop · há 3 dias", "Serviço", false],
              [Stethoscope, "Consulta veterinária", "Clínica · há 2 semanas", "Saúde", false],
              [ShieldCheck, "Vacina antirrábica", "Clínica · há 2 semanas", "Validada", false],
              [Scale, "Peso: 12,4 kg", "há 2 semanas", "Saúde", false],
            ] as const).map(([Icone, titulo, quando, selo, futuro]) => (
              <div key={titulo} className="item-servico">
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Icone size={18} color={futuro ? "var(--o)" : "var(--g)"} style={{ marginTop: 2, flex: "none" }} />
                  <div><b>{titulo}</b><span className="mut" style={{ fontSize: 13 }}>{quando}</span></div>
                </div>
                <span className={`selo${futuro ? " selo-laranja" : ""}`}>{selo}</span>
              </div>
            ))}
            <div className="chips" style={{ marginTop: 14 }}>
              <span className="selo"><QrCode size={12} /> Acesso por QR Code</span>
              <span className="selo"><ShieldCheck size={12} /> Você escolhe o que liberar</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Parceiros em destaque ── */}
      {destaques.length > 0 && (
        <section className="secao faixa-creme">
          <div className="wrap">
            <div className="secao-cab">
              <div>
                <div className="eyebrow">Parceiros</div>
                <h2 className="titulo">Parceiros em destaque</h2>
              </div>
              <Link href="/parceiros" className="btn btn-contorno">Ver todos os parceiros</Link>
            </div>
            <div className="grade3">
              {destaques.map((p) => <CardParceiro key={p.id} parceiro={p} beneficios={beneficiosPor.get(p.id) ?? 0} categorias={vitrine.categorias} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── App PetGo360 ── */}
      <section id="app" className="secao faixa-escura">
        <div className="wrap app-faixa">
          <div className="phones" aria-hidden="true" style={{ marginTop: 0 }}>
            <div className="phone"><b>PetGo360</b><div className="mini" /><div className="mini" /><div className="mini" /><small>Serviços • Vacinas • Pontos</small></div>
          </div>
          <div>
            <div className="eyebrow">Sempre com você</div>
            <h2 className="titulo">O cuidado do seu pet na palma da mão</h2>
            <p className="sub">Agende e pague com segurança, acompanhe a Carteira do Pet, acumule pontos e use os cupons dos parceiros. Quem usa o app ganha mais benefícios.</p>
            <Lojas configuracao={c} />
          </div>
        </div>
      </section>

      {/* ── Para parceiros ── */}
      <section className="secao">
        <div className="wrap grade2">
          <div>
            <div className="eyebrow">Para o parceiro</div>
            <h2 className="titulo">O app no bolso. A operação completa também no navegador.</h2>
            <p className="lead">Receba reservas já pagas, publique cupons no Clube Pet, registre vacinas na carteira digital e acompanhe clientes, repasses e relatórios.</p>
            <div className="acoes">
              <Link href="/quero-ser-parceiro" className="btn btn-primario">Quero ser parceiro</Link>
              <Link href="/entrar" className="btn btn-contorno">Área do Parceiro</Link>
            </div>
          </div>
          <div className="dash" aria-hidden="true">
            <div className="barra"><i className="ponto" /><i className="ponto" /><i className="ponto" /></div>
            <div className="corpo-d">
              <div className="lado"><b>PetHub360 Parceiro</b><div>▦ Dashboard</div><div>◫ Agenda</div><div>🐾 Clientes e Pets</div><div>✚ Vacinação</div><div>🏷 Cupons</div><div>★ Fidelidade</div><div>▤ Relatórios</div></div>
              <div className="painel">
                <b>A rede hoje</b>
                <div className="stats" style={{ marginTop: 10 }}>
                  <div className="stat">Parceiros<b>{vitrine.parceiros.length}</b></div><div className="stat">Serviços<b>{totalServicos}</b></div><div className="stat">Benefícios<b>{vitrine.beneficios.length}</b></div>
                </div>
                <div className="grafico">{[42, 62, 50, 86, 72, 95].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
