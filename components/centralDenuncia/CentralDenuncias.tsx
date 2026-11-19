"use client";
// GERADO por "npm run sync:app" no painel PetGo360 a partir de shared/centralDenuncia/CentralDenuncias.tsx — NÃO EDITAR AQUI.
// CENTRAL DE DENÚNCIAS — layout escolhido pelo dono (18/11/2026, documentacao/modelos-denuncia/modelo-6): indicadores no topo,
// fila em cartões à esquerda, atendimento no centro (etapas, abas, relato com fotos e a CONVERSA pelo protocolo) e, à direita,
// local, destinos, trâmite e o alerta de prazo. Serve à central do PetGo (puc = null: todas as denúncias) e a cada PUC (só as
// denúncias que chegaram a ele). Ver fonte.ts.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { FonteCentral } from "./fonte";
import { Conversa } from "./Conversa";
import { Encaminhar } from "./Encaminhar";
import { CSS_CENTRAL } from "./estilo";
import {
  COLECOES_DENUNCIA, ETAPAS_DENUNCIA, ROTULOS_ETAPA, ROTULOS_TIPO_PUC, avancarTramite, etapaDaDenuncia, linhasDocumento, nomeUf,
  rotuloEspecieDenuncia, rotuloTipoDenuncia, tipoPuc, type EtapaDenuncia,
} from "@/lib/compartilhado/denunciaPet";

const C = COLECOES_DENUNCIA;
const PRAZO_HORAS = 24;
const ROTULO_FILTRO: Record<EtapaDenuncia, string> = { recebida: "Novas", em_analise: "Em análise", encaminhada: "Encaminhadas", concluida: "Concluídas" };
const COR_ETAPA: Record<EtapaDenuncia, string> = { recebida: "#EA534A", em_analise: "#D97706", encaminhada: "#2563EB", concluida: "#06B197" };
const quando = (ms: any) => {
  const n = Number(ms) || 0; if (!n) return "—";
  const min = Math.round((Date.now() - n) / 60000);
  if (min < 1) return "agora"; if (min < 60) return `há ${min} min`; const h = Math.round(min / 60); if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24); return d === 1 ? "ontem" : `${d} dias`;
};
const dataHora = (ms: any) => (Number(ms) ? new Date(Number(ms)).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—");
const urgente = (d: any) => d?.frequencia === "agora" || ["agressao", "envenenamento", "ferido_sem_socorro"].includes(d?.tipo);

/** `desconto` = quanto da altura da janela fica FORA da central (topo do site/painel, linhas acima) — a fila, o atendimento e o
 *  lado direito ocupam o resto, cada um com a própria rolagem. */
// TOPO (dono, 18/11/2026): sem as linhas de título/usuário (tomavam espaço) — ao lado dos indicadores ficam EXPANDIR (tela cheia),
// quem está logado (no 👤) e FECHAR (`aoFechar`: sair da central no site / voltar ao início no painel).
export default function CentralDenuncias({ fonte, tema = "auto", titulo, desconto = 250, usuario, aoFechar }: { fonte: FonteCentral; tema?: "claro" | "escuro" | "auto"; titulo?: string; desconto?: number; usuario?: string; aoFechar?: () => void }) {
  const puc = fonte.puc;
  const [denuncias, setDenuncias] = useState<any[] | null>(null);
  const [tramites, setTramites] = useState<any[]>([]);
  const [pucs, setPucs] = useState<any[]>([]);
  const [filtro, setFiltro] = useState<"todas" | EtapaDenuncia>("todas");
  const [busca, setBusca] = useState("");
  const [idSel, setIdSel] = useState<string | null>(null);
  const [aba, setAba] = useState<"atendimento" | "relato" | "denunciante" | "tramites" | "local" | "historico">("atendimento");
  // TAMANHO (dono, 18/11/2026): medido pela PRÓPRIA central (o painel tem menu lateral) — celular: fila OU atendimento em tela
  // cheia (com Voltar), abas no lugar do lado direito e a mensagem fixa no rodapé; médio: o lado direito abre num painel.
  const raiz = useRef<HTMLDivElement>(null);
  const [modo, setModo] = useState<"celular" | "medio" | "largo">("largo");
  const [verDetalhe, setVerDetalhe] = useState(false);
  const [cheia, setCheia] = useState(false);
  const alternarCheia = async () => {
    const entrar = !cheia; setCheia(entrar);
    try { if (entrar && !document.fullscreenElement) await document.documentElement.requestFullscreen?.(); if (!entrar && document.fullscreenElement) await document.exitFullscreen?.(); } catch { /* sem tela cheia do navegador */ }
  };
  useEffect(() => {
    const sair = () => { if (!document.fullscreenElement) setCheia(false); };
    document.addEventListener("fullscreenchange", sair);
    return () => { document.removeEventListener("fullscreenchange", sair); if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); };
  }, []);
  useEffect(() => { document.documentElement.classList.toggle("cdp-modo-cheio", cheia); return () => document.documentElement.classList.remove("cdp-modo-cheio"); }, [cheia]);
  // ALTURA (18/11/2026): a fila, o atendimento e o lado direito ocupam do ponto onde começam até o fim da janela — medido (o
  // topo do painel e do site têm alturas diferentes; o `desconto` fixo deixava a central passar do fim da tela).
  const corpoRef = useRef<HTMLDivElement>(null);
  const [alturaCorpo, setAlturaCorpo] = useState<number | null>(null);
  useLayoutEffect(() => {
    const medir = () => {
      const el = corpoRef.current; if (!el) return;
      const topo = el.getBoundingClientRect().top + (cheia ? 0 : window.scrollY);
      setAlturaCorpo(Math.max(480, Math.floor(window.innerHeight - topo - (cheia ? 14 : 18))));
    };
    medir();
    const t1 = setTimeout(medir, 400), t2 = setTimeout(medir, 1500);
    window.addEventListener("resize", medir);
    const o = typeof ResizeObserver !== "undefined" ? new ResizeObserver(medir) : null;
    if (o && raiz.current) o.observe(raiz.current);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener("resize", medir); o?.disconnect(); };
  }, [cheia, modo]);
  const fechar = async () => { if (document.fullscreenElement) await document.exitFullscreen?.().catch(() => {}); setCheia(false); aoFechar?.(); };
  const [ladoAberto, setLadoAberto] = useState(false);
  const [menuMais, setMenuMais] = useState(false);
  useEffect(() => {
    const el = raiz.current; if (!el) return;
    const medir = () => { const w = el.clientWidth; setModo(w < 760 ? "celular" : w < 1240 ? "medio" : "largo"); };
    medir(); const o = new ResizeObserver(medir); o.observe(el); return () => o.disconnect();
  }, []);
  useEffect(() => { if (modo !== "celular" && aba === "relato") setAba("atendimento"); if (modo !== "celular" && aba === "denunciante") setAba("atendimento"); }, [modo]); // eslint-disable-line
  const [encaminhar, setEncaminhar] = useState(false);
  const [aviso, setAviso] = useState("");
  const [escuro, setEscuro] = useState(tema === "escuro");

  // tema: o do painel (html[data-theme-mode="dark"]) ou o do site (data-tema="escuro")
  useEffect(() => {
    if (tema !== "auto") { setEscuro(tema === "escuro"); return; }
    const ler = () => { const h = document.documentElement; setEscuro(h.getAttribute("data-theme-mode") === "dark" || h.getAttribute("data-tema") === "escuro" || h.classList.contains("dark")); };
    ler(); const o = new MutationObserver(ler); o.observe(document.documentElement, { attributes: true }); return () => o.disconnect();
  }, [tema]);

  useEffect(() => {
    const u = [
      fonte.ouvir(C.denuncias, puc ? ["pucs", "array-contains", String(puc.id)] : null, setDenuncias),
      fonte.ouvir(C.tramites, puc ? ["id_orgaos_denuncia", "==", String(puc.id)] : null, setTramites),
      fonte.ouvir(C.orgaos, null, setPucs),
    ];
    return () => u.forEach((f) => f());
  }, [puc?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // trâmites de TODOS os PUCs da denúncia aberta (a cadeia completa aparece para quem trata)
  const [tramitesDen, setTramitesDen] = useState<any[]>([]);
  useEffect(() => { if (!idSel) { setTramitesDen([]); return; } return fonte.ouvir(C.tramites, ["id_denuncias_pet", "==", idSel], setTramitesDen); }, [idSel]); // eslint-disable-line

  // HISTÓRICO DO DENUNCIANTE (dono, 18/11/2026): outras denúncias do mesmo código cifrado (id_denunciante, HMAC — anônimo)
  const [abaLado, setAbaLado] = useState<"local" | "historico">("local");
  const [doDenunciante, setDoDenunciante] = useState<any[]>([]);
  const idDen = (denuncias ?? []).find((x) => String(x.id) === idSel)?.id_denunciante ?? null;
  useEffect(() => { if (!idDen) { setDoDenunciante([]); return; } return fonte.ouvir(C.denuncias, ["id_denunciante", "==", String(idDen)], setDoDenunciante); }, [idDen]); // eslint-disable-line
  const outras = doDenunciante.filter((x) => String(x.id) !== idSel).sort((a, b) => Number(b.recebida_em) - Number(a.recebida_em));

  const meuTramite = (d: any) => (puc ? tramites.find((t) => String(t.id_denuncias_pet) === String(d.id)) : null);
  // etapa na visão de quem usa: o trâmite do PUC ou a situação geral (central)
  const etapa = (d: any): EtapaDenuncia => { const t = meuTramite(d); return t ? (t.status as EtapaDenuncia) : etapaDaDenuncia(d); };
  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (denuncias ?? []).filter((d) => d.status !== "recusada")
      .filter((d) => filtro === "todas" || etapa(d) === filtro)
      .filter((d) => !q || [d.protocolo, d.bairro, d.municipio, d.descricao, rotuloTipoDenuncia(d.tipo)].join(" ").toLowerCase().includes(q))
      .sort((a, b) => Number(b.recebida_em ?? 0) - Number(a.recebida_em ?? 0));
  }, [denuncias, tramites, filtro, busca]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!idSel && lista.length) setIdSel(String(lista[0].id)); }, [lista, idSel]);
  const d = (denuncias ?? []).find((x) => String(x.id) === idSel) ?? null;
  const tr = d ? meuTramite(d) : null;
  const et = d ? etapa(d) : "recebida";

  // indicadores
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).getTime();
  const todas = denuncias ?? [];
  const contar = (e: EtapaDenuncia) => todas.filter((x) => etapa(x) === e).length;
  const respostas = todas.filter((x) => Number(x.primeira_resposta_em) && Number(x.recebida_em) >= Date.now() - 7 * 864e5).map((x) => Number(x.primeira_resposta_em) - Number(x.recebida_em));
  const media = respostas.length ? respostas.reduce((a, b) => a + b, 0) / respostas.length / 60000 : null;
  const kpis: [string, string, string, string][] = [
    ["Novas hoje", String(todas.filter((x) => Number(x.recebida_em) >= hoje.getTime()).length), `${contar("recebida")} esperando`, "#EA534A"],
    ["Em análise", String(contar("em_analise")), `${todas.filter((x) => (meuTramite(x)?.id_usuarios_assumido ?? x.id_usuarios_assumido) === fonte.usuario.id).length} com você`, "#F59E0B"],
    ["Encaminhadas", String(todas.filter((x) => etapa(x) === "encaminhada" && Number(x.difundida_em ?? x.updated_at) >= inicioMes).length), "no mês", "#3B82F6"],
    ["1ª resposta", media == null ? "—" : media < 60 ? `${Math.round(media)} min` : `${(media / 60).toFixed(1)} h`, "média 7 dias", "#06B197"],
  ];

  const nomeQuem = puc ? `${fonte.usuario.nome} (${puc.nome})` : fonte.usuario.nome;
  const marcarResposta = async () => { if (d && !d.primeira_resposta_em) await fonte.atualizar(C.denuncias, String(d.id), { primeira_resposta_em: Date.now() }); };
  const assumir = async () => {
    if (!d) return;
    if (tr) await fonte.definir(C.tramites, String(tr.id), { ...avancarTramite(tr, "em_analise", nomeQuem, "Assumiu a denúncia"), assumido_por: fonte.usuario.nome, id_usuarios_assumido: fonte.usuario.id });
    else await fonte.atualizar(C.denuncias, String(d.id), { status: d.status === "recebida" || d.status === "sem_orgao" ? "em_analise" : d.status, assumido_por: fonte.usuario.nome, id_usuarios_assumido: fonte.usuario.id });
    await marcarResposta();
    fonte.auditar?.(`Denúncia ${d.protocolo}: assumida`, { id: d.id });
    setAviso("Você assumiu esta denúncia.");
  };
  const concluir = async (descartar = false) => {
    if (!d) return;
    const nota = window.prompt(descartar ? "Motivo do descarte (o denunciante vê só que não foi encaminhada):" : "Conclusão (o que foi feito):", "");
    if (nota == null) return;
    if (tr) await fonte.definir(C.tramites, String(tr.id), avancarTramite(tr, "concluida", nomeQuem, nota || "Concluída"));
    else await fonte.atualizar(C.denuncias, String(d.id), { status: descartar ? "descartada" : "encerrada", encerrada_em: Date.now(), observacoes_central: nota });
    fonte.auditar?.(`Denúncia ${d.protocolo}: ${descartar ? "descartada" : "concluída"}`, { id: d.id, nota });
    setAviso(descartar ? "Denúncia descartada." : "Denúncia concluída.");
  };
  const imprimir = () => {
    if (!d) return;
    const w = window.open("", "_blank"); if (!w) return;
    const esc = (s: any) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
    w.document.write(`<html><head><meta charset="utf-8"><title>Denúncia ${esc(d.protocolo)}</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#1a1a1f}td{padding:5px 12px 5px 0;vertical-align:top}td:first-child{color:#666;white-space:nowrap}img{max-width:220px;margin:6px 6px 0 0;border-radius:8px}.s{color:#b42828;font-size:12px;margin-top:18px}</style></head><body>
      <h2>Disque Denúncia Pet — ${esc(d.protocolo)}</h2><table>${linhasDocumento(d).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>
      <div>${(d.fotos ?? []).map((f: string) => `<img src="${esc(f)}">`).join("")}</div><p class="s">DENÚNCIA ANÔNIMA — a identidade do denunciante não é registrada. Uso exclusivo do destinatário.</p>
      <script>setTimeout(()=>print(),600)</script></body></html>`);
    w.document.close();
  };

  const alertaPrazo = d && !d.primeira_resposta_em ? (Date.now() - Number(d.recebida_em)) / 36e5 : null;
  const celular = modo === "celular";
  const blocoDenunciante = d ? (
    <div style={{ marginBottom: 16 }}>
      {!d.id_denunciante ? <p className="cdp-sub">Sem código do denunciante nesta denúncia (anterior ao anti-trote).</p> : (<>
        <div className="cdp-sub" style={{ marginBottom: 8 }}>Denunciante <b>#{String(d.id_denunciante).slice(0, 8).toUpperCase()}</b> (código cifrado — ninguém sabe quem é) · {outras.length + 1} denúncia(s) no total</div>
        {d.analise?.suspeita ? <div className="cdp-alerta atraso" style={{ marginTop: 0, marginBottom: 8 }}>⚠ Possível trote/repetida: {(d.analise.motivos ?? []).join(" · ")}</div> : null}
        {!outras.length ? <p className="cdp-sub">Primeira denúncia desta pessoa.</p> : outras.map((o) => {
          const e = etapaDaDenuncia(o);
          return (
            <button key={o.id} className="cdp-cartao" style={{ borderLeftColor: COR_ETAPA[e] }} onClick={() => { if ((denuncias ?? []).some((x) => String(x.id) === String(o.id))) { setIdSel(String(o.id)); setAba("atendimento"); setLadoAberto(false); } }}>
              <div className="cdp-linha"><b>{rotuloTipoDenuncia(o.tipo).split(" /")[0]}</b><span className="cdp-sub">{dataHora(o.recebida_em)}</span></div>
              <div className="cdp-linha"><span className="cdp-sub">{o.protocolo} · {o.municipio}/{o.uf}</span><span className="cdp-pill" style={{ background: COR_ETAPA[e] + "22", color: COR_ETAPA[e] }}>{o.status === "descartada" ? "Descartada" : ROTULOS_ETAPA[e]}</span></div>
            </button>
          );
        })}
      </>)}
    </div>
  ) : null;
  const blocoDestinos = d ? (<>
    <div className="cdp-rot">DESTINOS ESCOLHIDOS</div>
    <div className="cdp-chips" style={{ marginBottom: 16 }}>
      {(d.destinos_escolhidos ?? []).length ? (d.destinos_escolhidos ?? []).map((id: string) => {
        const p = pucs.find((x) => String(x.id) === String(id));
        return <span key={id} className="cdp-pill" style={{ background: tipoPuc(p) === "orgao" ? "#2563EB22" : "#06B19722", color: tipoPuc(p) === "orgao" ? "#4f86f7" : "#06B197" }}>{p?.sigla || p?.nome || id}</span>;
      }) : <span className="cdp-sub">A central decide (quem denunciou não escolheu)</span>}
    </div>
  </>) : null;
  const blocoTramite = d ? (<>
    <div className="cdp-rot">TRÂMITE</div>
    <LinhaTempo itens={historicoDe(d, tramitesDen).slice(-6)} />
    {alertaPrazo != null && et !== "concluida" ? (
      <div className={`cdp-alerta ${alertaPrazo > PRAZO_HORAS ? "atraso" : ""}`}>⚠ Sem resposta há {alertaPrazo < 1 ? `${Math.round(alertaPrazo * 60)} min` : `${Math.floor(alertaPrazo)} h`} · prazo de 1ª resposta: {PRAZO_HORAS} h</div>
    ) : null}
  </>) : null;
  const ladoConteudo = d ? (<>
    <div className="cdp-abas-mini">
      <button className={abaLado === "local" ? "on" : ""} onClick={() => setAbaLado("local")}>Local</button>
      <button className={abaLado === "historico" ? "on" : ""} onClick={() => setAbaLado("historico")}>Histórico do denunciante{outras.length ? ` (${outras.length})` : ""}</button>
    </div>
    {abaLado === "local" ? (<>
      <Mapa d={d} altura={150} />
      <div style={{ margin: "8px 0 16px", fontSize: 13 }}>{d.endereco}{d.bairro ? ` · ${d.bairro}` : ""}</div>
    </>) : blocoDenunciante}
    {blocoDestinos}
    {blocoTramite}
  </>) : null;
  const relato = d ? (
    <div className="cdp-relato">
      <div className="cdp-rot">RELATO</div>
      <p>{d.descricao}</p>
      <div className="cdp-sub" style={{ marginBottom: 8 }}>
        {rotuloEspecieDenuncia(d.especie, d.especie_outra)}{d.quantidade ? ` (${d.quantidade})` : ""} · {d.frequencia === "agora" ? "acontecendo agora" : d.frequencia === "frequente" ? "acontece com frequência" : "aconteceu uma vez"}
        {d.responsavel ? ` · responsável: ${d.responsavel}` : ""}
      </div>
      {(d.fotos ?? []).length ? <div className="cdp-fotos">{(d.fotos ?? []).map((f: string) => /\.(mp4|webm|mov)(\?|$)/i.test(f)
        ? <video key={f} src={f} controls className="cdp-foto" /> : <a key={f} href={f} target="_blank" rel="noreferrer"><img src={f} alt="" className="cdp-foto" /></a>)}</div> : null}
    </div>
  ) : null;
  const abas = (celular
    ? [["atendimento", "Conversa"], ["relato", "Relato"], ["local", "Local"], ["denunciante", `Denunciante${outras.length ? ` (${outras.length})` : ""}`], ["tramites", `Trâmites (${tramitesDen.length})`]]
    : [["atendimento", "Atendimento"], ["tramites", `Trâmites (${tramitesDen.length})`], ["local", "Local"], ["historico", "Histórico"]]) as [typeof aba, string][];

  return (
    <div ref={raiz} className={`cdp cdp-m-${modo} ${escuro ? "cdp-escuro" : ""}${cheia ? " cdp-cheia" : ""}`} style={{ ["--cdp-desconto" as any]: `${cheia ? 150 : desconto}px` }}>
      <style>{CSS_CENTRAL}</style>
      <div className="cdp-topo">
      <div className="cdp-kpis">
        {kpis.map(([t, v, s, c]) => (
          <div key={t} className="cdp-kpi" style={{ background: `linear-gradient(135deg, ${c}${escuro ? "33" : "1f"}, var(--cdp-card) 70%)` }}>
            <div className="cdp-sub">{t}</div><div className="cdp-kpi-v">{v}</div><div style={{ color: c, fontWeight: 700, fontSize: 12.5 }}>{s}</div>
          </div>
        ))}
      </div>
      <div className="cdp-topo-acoes">
        <button type="button" className="cdp-icone" onClick={alternarCheia} title={cheia ? "Sair da tela cheia (Esc)" : "Expandir (tela cheia)"} aria-label="Expandir">{cheia ? "🗗" : "⛶"}</button>
        <span className="cdp-icone cdp-quem" title={`${usuario ? usuario + " · " : ""}${titulo ?? "Central"} · ${puc ? `${ROTULOS_TIPO_PUC[tipoPuc(puc)]}: ${puc.nome}` : "Central PetGo (todas as denúncias)"}`}>👤</span>
        {aoFechar ? <button type="button" className="cdp-icone cdp-fechar" onClick={fechar} title="Fechar a central" aria-label="Fechar">✕</button> : null}
      </div>
      </div>

      <div ref={corpoRef} className="cdp-corpo" style={!celular && alturaCorpo ? { height: alturaCorpo } : undefined}>
        {/* ── FILA ── */}
        <section className="cdp-card cdp-fila" hidden={celular && verDetalhe}>
          <div className="cdp-linha"><h2>Denúncias</h2>{contar("recebida") ? <span className="cdp-pill" style={{ background: "#EA534A", color: "#fff" }}>{contar("recebida")} novas</span> : null}</div>
          <input className="cdp-input" placeholder="🔍 Buscar protocolo, bairro, palavra…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <div className="cdp-chips">
            {(["todas", ...ETAPAS_DENUNCIA] as const).map((f) => (
              <button key={f} className={`cdp-chip ${filtro === f ? "on" : ""}`} onClick={() => setFiltro(f)}>
                {f === "todas" ? `Todas ${todas.length}` : `${ROTULO_FILTRO[f]} ${contar(f)}`}
              </button>
            ))}
          </div>
          <div className="cdp-rolagem">
            {denuncias == null ? <p className="cdp-sub">Carregando…</p> : !lista.length ? <p className="cdp-sub">Nenhuma denúncia {filtro === "todas" ? "" : "nesta situação"}.</p> : lista.map((x) => {
              const e = etapa(x);
              return (
                <button key={x.id} className={`cdp-cartao ${String(x.id) === idSel ? "sel" : ""}`} style={{ borderLeftColor: urgente(x) ? "#EA534A" : e === "concluida" ? "#94A3B8" : "#F59E0B" }} onClick={() => { setIdSel(String(x.id)); setAba("atendimento"); setAviso(""); setVerDetalhe(true); setMenuMais(false); }}>
                  <div className="cdp-linha"><b>{rotuloTipoDenuncia(x.tipo).split(" /")[0]}</b><span className="cdp-sub">{quando(x.recebida_em)}</span></div>
                  <div className="cdp-sub cdp-corta">{x.descricao}</div>
                  <div className="cdp-linha"><span className="cdp-sub">📍 {x.bairro ? `${x.bairro}, ` : ""}{x.municipio}/{x.uf}</span>
                    <span className="cdp-pill" style={{ background: COR_ETAPA[e] + "22", color: COR_ETAPA[e] }}>{ROTULOS_ETAPA[e] === "Recebida" ? "Nova" : ROTULOS_ETAPA[e]}</span></div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── ATENDIMENTO ── */}
        <main className={`cdp-centro ${celular ? (verDetalhe ? "detalhe" : "escondido") : ""}`}>
          {!d ? <div className="cdp-card cdp-vazio">Escolha uma denúncia na fila.</div> : (<>
            <div className="cdp-card" style={{ padding: "16px 20px" }}>
              <div className="cdp-linha cdp-cab" style={{ alignItems: "flex-start", gap: 10 }}>
                {celular ? <button className="cdp-icone" style={{ width: 34, height: 34 }} onClick={() => { setVerDetalhe(false); setMenuMais(false); }} aria-label="Voltar para a fila">‹</button> : null}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cdp-fraco">{d.protocolo} · recebida {d.canal === "whatsapp" ? "pelo WhatsApp" : d.canal === "site" ? "pelo site" : "pelo app"} {quando(d.recebida_em)}{(tr?.assumido_por || d.assumido_por) ? ` · com ${tr?.assumido_por || d.assumido_por}` : ""}</div>
                  <h1 className="cdp-h1">{rotuloTipoDenuncia(d.tipo).split(" /")[0]} — {d.bairro ? `${d.bairro}, ` : ""}{d.municipio}/{d.uf}</h1>
                </div>
                {celular ? (
                  <div className="cdp-acoes" style={{ position: "relative", flexWrap: "nowrap" }}>
                    {et !== "concluida" ? <button className="cdp-btn cdp-btn-p" onClick={() => setEncaminhar(true)}>➜</button> : null}
                    <button className="cdp-btn" onClick={() => setMenuMais((v) => !v)} aria-label="Mais ações">⋯</button>
                    {menuMais ? (
                      <div className="cdp-menu" style={{ top: 42, bottom: "auto", left: "auto", right: 0 }}>
                        {et !== "concluida" ? <button onClick={() => { setMenuMais(false); void assumir(); }}>✓ Assumir</button> : null}
                        {et !== "concluida" ? <button onClick={() => { setMenuMais(false); setEncaminhar(true); }}>➜ Encaminhar</button> : null}
                        {et !== "concluida" ? <button onClick={() => { setMenuMais(false); void concluir(false); }}>Concluir</button> : null}
                        {!puc && et !== "concluida" ? <button onClick={() => { setMenuMais(false); void concluir(true); }}>Descartar</button> : null}
                        <button onClick={() => { setMenuMais(false); imprimir(); }}>🖨 PDF</button>
                      </div>
                    ) : null}
                  </div>
                ) : <div className="cdp-acoes">
                  {modo === "medio" ? <button className="cdp-btn" onClick={() => setLadoAberto(true)} title="Local, histórico do denunciante, destinos e trâmite">☰ Detalhes</button> : null}
                  <button className="cdp-btn" onClick={imprimir}>🖨 PDF</button>
                  {et !== "concluida" ? <button className="cdp-btn cdp-btn-suave" onClick={assumir}>✓ Assumir</button> : null}
                  {et !== "concluida" ? <button className="cdp-btn cdp-btn-p" onClick={() => setEncaminhar(true)}>➜ Encaminhar</button> : null}
                  {et !== "concluida" ? <button className="cdp-btn cdp-btn-ok" onClick={() => concluir(false)}>Concluir</button> : null}
                  {!puc && et !== "concluida" ? <button className="cdp-btn" onClick={() => concluir(true)} title="Informações insuficientes, repetida ou trote">Descartar</button> : null}
                </div>}
              </div>
              <div className="cdp-etapas">
                {ETAPAS_DENUNCIA.map((e, i) => {
                  const feito = ETAPAS_DENUNCIA.indexOf(et) >= i;
                  return (
                    <div key={e} className="cdp-etapa" style={{ flex: i < 3 ? 1 : "none" }}>
                      <span className="cdp-bola" style={{ background: feito ? "#6B46C1" : "var(--cdp-linha)", color: feito ? "#fff" : "var(--cdp-fraco)" }}>{ETAPAS_DENUNCIA.indexOf(et) > i ? "✓" : i + 1}</span>
                      <b style={{ color: feito ? "var(--cdp-txt)" : "var(--cdp-fraco)" }}>{ROTULOS_ETAPA[e]}</b>
                      {i < 3 ? <span className="cdp-traco" style={{ background: ETAPAS_DENUNCIA.indexOf(et) > i ? "#6B46C1" : "var(--cdp-linha)" }} /> : null}
                    </div>
                  );
                })}
              </div>
              {aviso ? <div className="cdp-aviso">{aviso}</div> : null}
            </div>

            <div className="cdp-card cdp-painel">
              <div className="cdp-abas">
                {abas.map(([k, r]) => (
                  <button key={k} className={aba === k ? "on" : ""} onClick={() => setAba(k)}>{r}</button>
                ))}
              </div>
              {aba === "atendimento" ? (<>
                {celular ? null : relato}
                <Conversa fonte={fonte} denuncia={d} aoResponder={marcarResposta} />
              </>) : aba === "relato" ? <div className="cdp-pad" style={{ padding: 0 }}>{relato}</div>
              : aba === "denunciante" ? <div className="cdp-pad">{blocoDenunciante}</div>
              : aba === "tramites" ? (
                <div className="cdp-pad">
                  {!tramitesDen.length ? <p className="cdp-sub">Ainda não foi encaminhada a nenhum ponto. Use “Encaminhar”.</p> : tramitesDen.sort((a, b) => Number(a.created_at) - Number(b.created_at)).map((t) => (
                    <div key={t.id} className="cdp-tramite">
                      <div className="cdp-linha"><b>{t.puc_nome}</b><span className="cdp-pill" style={{ background: COR_ETAPA[t.status as EtapaDenuncia] + "22", color: COR_ETAPA[t.status as EtapaDenuncia] }}>{ROTULOS_ETAPA[t.status as EtapaDenuncia]}</span></div>
                      <div className="cdp-sub">{ROTULOS_TIPO_PUC[t.tipo_puc as keyof typeof ROTULOS_TIPO_PUC] ?? "Órgão"} · de {t.origem_nome} · {dataHora(t.created_at)}{t.assumido_por ? ` · com ${t.assumido_por}` : ""}</div>
                      {t.nota ? <div className="cdp-nota">“{t.nota}”</div> : null}
                    </div>
                  ))}
                  {celular ? <div style={{ marginTop: 12 }}>{blocoTramite}</div> : null}
                </div>
              ) : aba === "local" ? (
                <div className="cdp-pad">
                  <Mapa d={d} altura={celular ? 240 : 340} />
                  <p style={{ marginTop: 10 }}>{d.endereco}{d.referencia ? ` — ${d.referencia}` : ""}<br /><span className="cdp-sub">{d.bairro ? `${d.bairro}, ` : ""}{d.municipio} — {nomeUf(d.uf)}</span></p>
                  {celular ? blocoDestinos : null}
                </div>
              ) : (
                <div className="cdp-pad">
                  {historicoDe(d, tramitesDen).map((h, i) => <div key={i} className="cdp-hist"><span className="cdp-fraco">{dataHora(h.em)}</span> <b>{h.quem}</b> — {h.texto}</div>)}
                </div>
              )}
            </div>
          </>)}
        </main>

        {/* ── LADO DIREITO (tela grande) ── */}
        {modo === "largo" ? <aside className="cdp-card cdp-lado">{ladoConteudo}</aside> : null}
      </div>

      {/* tela média: o lado direito abre num painel por cima */}
      {modo === "medio" && ladoAberto && d ? (
        <div className="cdp-modal" style={{ placeItems: "stretch end", padding: 0 }} onMouseDown={(e) => e.target === e.currentTarget && setLadoAberto(false)}>
          <aside className="cdp-card cdp-gaveta">
            <div className="cdp-linha" style={{ marginBottom: 10 }}><b>Detalhes · {d.protocolo}</b><button className="cdp-icone" style={{ width: 32, height: 32 }} onClick={() => setLadoAberto(false)}>✕</button></div>
            {ladoConteudo}
          </aside>
        </div>
      ) : null}

      {encaminhar && d ? <Encaminhar fonte={fonte} denuncia={d} pucs={pucs} jaTem={tramitesDen.map((t) => String(t.id_orgaos_denuncia))} meuTramite={tr}
        aoFechar={(msg) => { setEncaminhar(false); if (msg) { setAviso(msg); void marcarResposta(); } }} /> : null}
    </div>
  );
}

/** Mapa sem chave (Google Maps embed) pela coordenada ou pelo endereço. */
function Mapa({ d, altura }: { d: any; altura: number }) {
  const q = Number.isFinite(Number(d.latitude)) && d.latitude != null ? `${d.latitude},${d.longitude}` : `${d.endereco ?? ""}, ${d.bairro ?? ""}, ${d.municipio} - ${d.uf}`;
  return <iframe title="Mapa" className="cdp-mapa" style={{ height: altura }} loading="lazy" src={`https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`} />;
}

type Evento = { em: number; quem: string; texto: string; cor: string };
function historicoDe(d: any, tramites: any[]): Evento[] {
  const ev: Evento[] = [{ em: Number(d.recebida_em), quem: "Recebida", texto: `pelo ${d.canal === "whatsapp" ? "WhatsApp" : d.canal === "site" ? "site" : "app"}${(d.destinos_escolhidos ?? []).length ? " · com destino escolhido" : ""}`, cor: "#06B197" }];
  for (const t of tramites) for (const h of t.historico ?? []) ev.push({ em: Number(h.em), quem: ROTULOS_ETAPA[h.status as EtapaDenuncia] ?? h.status, texto: `${t.puc_nome}${h.texto ? ` — ${h.texto}` : ""}`, cor: COR_ETAPA[h.status as EtapaDenuncia] ?? "#94A3B8" });
  if (d.encerrada_em) ev.push({ em: Number(d.encerrada_em), quem: d.status === "descartada" ? "Descartada" : "Concluída", texto: d.observacoes_central || "pela central", cor: "#06B197" });
  return ev.filter((e) => e.em).sort((a, b) => a.em - b.em);
}
function LinhaTempo({ itens }: { itens: Evento[] }) {
  return <div>{itens.map((h, i) => (
    <div key={i} className="cdp-lt">
      <div className="cdp-lt-trilho"><span className="cdp-lt-bola" style={{ background: h.cor }} />{i < itens.length - 1 ? <span className="cdp-lt-fio" style={{ background: h.cor + "55" }} /> : null}</div>
      <div><b>{h.quem}</b> <span className="cdp-fraco">· {dataHora(h.em)}</span><div className="cdp-sub">{h.texto}</div></div>
    </div>
  ))}</div>;
}

