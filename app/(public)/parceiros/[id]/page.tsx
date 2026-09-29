import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, MapPin, MessageCircle, Smartphone, Navigation, Home as Casa } from "lucide-react";
import { buscarParceiro, listarConfiguracao, listarVitrine, moeda } from "@/lib/data";
import { DIAS_SEMANA, ROTULOS_TIPO_EMPRESA, dataCurta, linkWhatsapp } from "@/lib/util";
import { CardBeneficio, Nota } from "@/components/vitrine/Cards";
import type { Unidade } from "@/types/conteudo";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await listarVitrine()).parceiros.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const r = await buscarParceiro((await params).id);
  return r ? { title: r.parceiro.nome, description: r.parceiro.descricao || `${ROTULOS_TIPO_EMPRESA[r.parceiro.tipo] ?? "Parceiro"} na rede PetHub360.` } : { title: "Parceiro" };
}

function Horarios({ u }: { u: Unidade }) {
  if (u.funciona24h) return <p className="mut" style={{ margin: 0 }}>Aberto 24 horas</p>;
  if (!u.horarios.length) return null;
  const porDia = new Map(u.horarios.map((h) => [h.dia_semana, `${h.abre} – ${h.fecha}`]));
  return (
    <table className="horarios">
      <tbody>{[1, 2, 3, 4, 5, 6, 0].map((d) => <tr key={d}><td>{DIAS_SEMANA[d]}</td><td>{porDia.get(d) ?? "Fechado"}</td></tr>)}</tbody>
    </table>
  );
}

// Página pública do parceiro. A reserva NÃO é feita aqui (sem checkout no
// site): vai para o app PetGo360 ou para o WhatsApp da plataforma (bot, com
// pagamento antecipado), já com parceiro e serviço no texto — nunca para o
// WhatsApp do próprio parceiro.
export default async function ParceiroPage({ params }: { params: Promise<{ id: string }> }) {
  const [r, config] = await Promise.all([buscarParceiro((await params).id), listarConfiguracao()]);
  if (!r) notFound();
  const { parceiro: p, beneficios, categorias, avaliacoes } = r;
  const reservar = (servico?: string) =>
    linkWhatsapp(config.whatsapp, servico ? `Olá! Quero agendar "${servico}" no parceiro ${p.nome} (vi no site).` : `Olá! Quero agendar um serviço no parceiro ${p.nome} (vi no site).`);
  const linkGeral = reservar();
  const nomesCat = categorias.filter((c) => p.categorias.includes(c.id)).map((c) => c.nome);

  return (
    <>
      <section className="p-topo">
        {p.capaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.capaUrl} alt="" className="capa-img" />
        )}
        <div className="wrap p-cab">
          <div className="logo-p">
            {p.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.logoUrl} alt="" />
            ) : p.nome.slice(0, 1)}
          </div>
          <div>
            <h1>{p.nome}</h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", color: "#cfe0d8" }}>
              <span>{ROTULOS_TIPO_EMPRESA[p.tipo] ?? "Parceiro"}</span>
              {nomesCat.length > 0 && <span>{nomesCat.join(" · ")}</span>}
              <Nota media={p.avaliacaoMedia} quantidade={p.quantidadeAvaliacoes} />
            </div>
          </div>
        </div>
      </section>

      <div className="wrap p-grade">
        <div style={{ display: "grid", gap: 24 }}>
          {p.descricao && <div className="card"><p style={{ fontSize: 16 }}>{p.descricao}</p></div>}

          <div className="card">
            <h2 style={{ margin: "0 0 4px" }}>Serviços</h2>
            <p className="mut" style={{ margin: 0, fontSize: 14 }}>Preços de referência — o valor final aparece no app ou no WhatsApp antes do pagamento.</p>
            <div className="lista-servicos">
              {p.servicos.map((s) => {
                const link = reservar(s.nome);
                return (
                  <div key={s.id} className="item-servico">
                    <div>
                      <b>{s.nome}</b>
                      {s.descricao && <span className="mut" style={{ fontSize: 14 }}>{s.descricao}</span>}
                      <div className="chips" style={{ marginTop: 6 }}>
                        {s.duracaoMinutos && <span className="selo"><Clock size={12} /> {s.duracaoMinutos} min</span>}
                        {s.domicilio && <span className="selo"><Casa size={12} /> Em casa</span>}
                        {s.aceitaClubeOff && <span className="selo selo-laranja">Aceita Clube OFF</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", display: "grid", gap: 8, justifyItems: "end" }}>
                      {s.valorBase > 0 && <span className="preco">{moeda(s.valorBase)}</span>}
                      {link && <a href={link} target="_blank" rel="noreferrer" className="btn btn-contorno btn-sm">Agendar</a>}
                    </div>
                  </div>
                );
              })}
              {!p.servicos.length && <div className="vazio">Serviços em cadastro.</div>}
            </div>
          </div>

          {beneficios.length > 0 && (
            <div>
              <h2 style={{ margin: "0 0 12px" }}>Cupons e vantagens</h2>
              <div className="grade2" style={{ alignItems: "stretch", gap: 14 }}>
                {beneficios.map((b) => <CardBeneficio key={b.id} beneficio={b} />)}
              </div>
              <p className="mut" style={{ fontSize: 14 }}>O resgate é pelo app PetGo360 — cada cupom tem um código único, válido em um canal só.</p>
            </div>
          )}

          <div className="card">
            <h2 style={{ margin: "0 0 8px" }}>Avaliações</h2>
            {avaliacoes.length ? avaliacoes.map((a) => (
              <div key={a.id} className="avaliacao">
                <div>
                  <span className="estrela" aria-label={`Nota ${a.nota} de 5`}>{"★".repeat(Math.round(a.nota))}{"☆".repeat(5 - Math.round(a.nota))}</span>{" "}
                  {a.data && <span className="mut" style={{ fontSize: 13 }}>{dataCurta(a.data)}</span>}
                </div>
                {a.comentario && <p style={{ margin: "6px 0 0" }}>{a.comentario}</p>}
                {a.resposta && <div className="resposta"><b>Resposta do parceiro:</b> {a.resposta}</div>}
              </div>
            )) : <p className="mut" style={{ margin: 0 }}>Ainda sem avaliações publicadas. Elas aparecem aqui depois dos atendimentos feitos pelo app.</p>}
          </div>
        </div>

        <aside style={{ display: "grid", gap: 18 }} className="caixa-reserva">
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Agende com pagamento antecipado</h3>
            <p>Escolha o horário, pague com segurança e receba o voucher com QR Code.</p>
            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              <Link href="/petgo360#baixar" className="btn btn-primario"><Smartphone size={18} /> Agendar pelo app</Link>
              {linkGeral && <a href={linkGeral} target="_blank" rel="noreferrer" className="btn btn-contorno"><MessageCircle size={18} /> Agendar pelo WhatsApp</a>}
            </div>
          </div>
          {p.unidades.map((u) => (
            <div key={u.id} className="card">
              <h3 style={{ marginTop: 0 }}>{u.nome}</h3>
              <p style={{ display: "flex", gap: 6 }}><MapPin size={16} style={{ flex: "none", marginTop: 2 }} /> <span>{u.endereco}<br />{u.municipio}/{u.uf}</span></p>
              {u.raioAtendimentoKm && <p style={{ marginTop: 6 }}><Casa size={14} style={{ display: "inline", marginRight: 6 }} />Atende em casa até {u.raioAtendimentoKm} km</p>}
              <div style={{ margin: "12px 0" }}><Horarios u={u} /></div>
              {u.latitude !== null && u.longitude !== null && (
                <a className="card-link" href={`https://www.google.com/maps/search/?api=1&query=${u.latitude},${u.longitude}`} target="_blank" rel="noreferrer"><Navigation size={14} /> Como chegar</a>
              )}
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
