import Link from "next/link";
import {
  PawPrint, Store, MessageCircle, Settings2, MapPin, Ticket, Syringe, Handshake, ShieldCheck, QrCode, BellRing, Users, Heart, TrendingUp, Building2,
} from "lucide-react";
import { listarConfiguracao, listarVitrine } from "@/lib/data";
import { ehExterno } from "@/lib/util";
import { CardBeneficio, CardCategoria, CardParceiro } from "@/components/vitrine/Cards";
import Lojas from "@/components/public/Lojas";
import CanaisTutor from "@/components/public/CanaisTutor";

export const revalidate = 300;

// Título da Home com a palavra de destaque pintada na cor de ação.
function TituloHero({ titulo, destaque }: { titulo: string; destaque: string }) {
  const i = destaque ? titulo.toLowerCase().indexOf(destaque.toLowerCase()) : -1;
  if (i < 0) return <h1>{titulo}</h1>;
  return <h1>{titulo.slice(0, i)}<span className="laranja">{titulo.slice(i, i + destaque.length)}</span>{titulo.slice(i + destaque.length)}</h1>;
}

function BotaoLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  return ehExterno(href) ? <a href={href} className={className} target="_blank" rel="noreferrer">{children}</a> : <Link href={href} className={className}>{children}</Link>;
}

const CORES_NUMERO = ["var(--g)", "var(--o)", "var(--g2)", "#c98500"];
const ICONES_NUMERO = [Building2, Users, Heart, TrendingUp];

export default async function HomePage() {
  const [c, vitrine] = await Promise.all([listarConfiguracao(), listarVitrine()]);
  const porId = new Map(vitrine.parceiros.map((p) => [p.id, p]));
  const beneficiosPor = new Map<string, number>();
  vitrine.beneficios.forEach((b) => beneficiosPor.set(b.idEmpresa, (beneficiosPor.get(b.idEmpresa) ?? 0) + 1));
  // Destaques: os marcados no painel (Empresas → Destaque no site), na ordem; sem nenhum, os mais bem avaliados.
  const marcados = vitrine.parceiros.filter((p) => p.destaque).sort((a, b) => a.ordemDestaque - b.ordemDestaque);
  const destaques = (marcados.length ? marcados : [...vitrine.parceiros].sort((a, b) => b.avaliacaoMedia - a.avaliacaoMedia)).slice(0, Math.max(3, Math.min(c.quantidadeDestaques, 6)));

  return (
    <>
      {/* ── Hero ── */}
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
              <Link href="/petgo360#vacinacao"><span className="ico"><Syringe size={16} /></span>Carteira de vacinação</Link>
              <Link href="/quero-ser-parceiro"><span className="ico"><Handshake size={16} /></span>Seja um parceiro</Link>
            </nav>
          </div>
        </div>
      </section>

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
            <div className="card"><div className="ico"><PawPrint size={22} /></div><h3>PetGo360</h3><p>App do tutor com pets, carteira de vacinação digital, serviços, pontos, cupons e histórico.</p><Link href="/petgo360" className="card-link">Conhecer o app →</Link></div>
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

      {/* ── Carteira de vacinação ── */}
      <section className="secao">
        <div className="wrap grade2">
          <div>
            <div className="eyebrow">Carteira de Vacinação Digital</div>
            <h2 className="titulo">A carteira é do seu pet — e fica com você</h2>
            <p className="lead">No app PetGo360 você registra as vacinas e recebe lembrete da próxima dose. Quando um parceiro habilitado aplica a vacina, ela entra validada na carteira.</p>
            <div className="passos" style={{ marginTop: 22 }}>
              <div className="passo"><span>Você gera um <b>QR Code</b> no app, na hora do atendimento.</span></div>
              <div className="passo"><span>O parceiro lê o código e registra vacina, lote, fabricante e próxima dose.</span></div>
              <div className="passo"><span>O acesso expira sozinho. Sem o seu QR Code, ninguém vê a carteira.</span></div>
            </div>
          </div>
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><span className="ico"><Syringe size={22} /></span><b style={{ fontSize: 18 }}>Carteira do Thor</b></div>
            {[["V10", "Validada pela clínica", true], ["Antirrábica", "Validada pela clínica", true], ["Gripe canina", "Declarada pelo tutor", false]].map(([nome, origem, ok]) => (
              <div key={String(nome)} className="item-servico">
                <div><b>{nome}</b><span className="mut" style={{ fontSize: 13 }}>{origem}</span></div>
                <span className={`selo${ok ? "" : " selo-laranja"}`}>{ok ? <><ShieldCheck size={12} /> Validada</> : "Declarada"}</span>
              </div>
            ))}
            <div className="chips" style={{ marginTop: 14 }}>
              <span className="selo"><QrCode size={12} /> Acesso por QR Code</span>
              <span className="selo"><BellRing size={12} /> Lembrete da próxima dose</span>
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
            <p className="sub">Agende e pague com segurança, acompanhe a carteira de vacinação, acumule pontos e use os cupons dos parceiros. Quem usa o app ganha mais benefícios.</p>
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
                <b>Visão geral</b>
                <div className="stats" style={{ marginTop: 10 }}>
                  <div className="stat">Atendimentos<b>128</b></div><div className="stat">Cupons<b>74</b></div><div className="stat">Novos clientes<b>31</b></div>
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
