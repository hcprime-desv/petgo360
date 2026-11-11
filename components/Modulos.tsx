"use client";

// Módulos e serviços — lidos AO VIVO do catálogo `modulos_app` (painel →
// Módulos). Sem catálogo no banco, mostra o padrão do lançamento.
import { useEffect, useState } from "react";
import { HeartPulse, PawPrint, Puzzle, ShieldCheck } from "lucide-react";
import { getAll } from "@/lib/firebase/gen";
import { CATALOGO_PADRAO, GRATIS, ROTULOS_CATEGORIA_SERVICO, ROTULOS_RECURSO, precoDoModulo, sobConsulta, type RecursoApp } from "@/lib/compartilhado/carteiraDigital";

const brl = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export default function Modulos() {
  const [modulos, setModulos] = useState<any[]>(CATALOGO_PADRAO);
  useEffect(() => {
    try {
      return getAll("modulos_app", (docs) => { const ativos = docs.filter((m) => m.status !== "inativo"); if (ativos.length) setModulos(ativos); });
    } catch { return undefined; }
  }, []);
  const ordem = (a: any, b: any) => (a.ordem ?? 99) - (b.ordem ?? 99);
  const recursos = modulos.filter((m) => m.tipo !== "servico").sort(ordem);
  const servicos = modulos.filter((m) => m.tipo === "servico").sort(ordem);
  const Cartao = ({ m }: { m: any }) => {
    const mensal = precoDoModulo(m, "mensal"), anual = precoDoModulo(m, "anual");
    return (
      <div className={`card8${m.destaque ? " destaque" : ""}`}>
        <span className={`icon-circ ${m.tipo === "servico" ? "verde" : m.destaque ? "laranja" : "azul"}`}>{m.tipo === "servico" ? <ShieldCheck size={22} /> : <Puzzle size={22} />}</span>
        <h3>{m.nome}</h3>
        {m.tipo === "servico" ? <p className="chamada-card">{[ROTULOS_CATEGORIA_SERVICO[m.categoria] ?? "Serviço", m.parceiro].filter(Boolean).join(" · ")}</p> : null}
        <p>{m.descricao}</p>
        {m.tipo !== "servico" && (m.recursos ?? []).length > 1 ? (
          <ul className="lista-check" style={{ marginTop: 0, marginBottom: 10, fontSize: 13 }}>{(m.recursos as RecursoApp[]).map((r) => <li key={r}>{ROTULOS_RECURSO[r]}</li>)}</ul>
        ) : null}
        <p className="preco-linha">{sobConsulta(m) ? "Preço sob consulta" : [mensal ? `${brl(mensal)}/mês` : "", anual ? `${brl(anual)}/ano` : ""].filter(Boolean).join(" ou ")}</p>
      </div>
    );
  };
  return (
    <>
      <div className="grade-numeros" style={{ gridTemplateColumns: "1fr", marginBottom: 18 }}>
        <div className="card"><span className="icon-circ verde"><PawPrint size={22} /></span><div><strong>Grátis para sempre</strong><span>{GRATIS.descricao}.</span></div></div>
      </div>
      <div className="cards8 auto">{recursos.map((m) => <Cartao key={m.codigo ?? m.id} m={m} />)}</div>
      <div className="section-head" style={{ marginTop: 40 }}>
        <div><div className="eyebrow">Proteção</div><h2>Saúde, funeral e <span className="destaque">seguro pet</span></h2></div>
        <p>Contrate pelo app com parceiros especializados. Com o serviço ativo, a carteira do seu pet ganha o botão de acionamento 24h.</p>
      </div>
      <div className="cards8 auto">{servicos.map((m) => <Cartao key={m.codigo ?? m.id} m={m} />)}</div>
      <p className="texto-mut" style={{ marginTop: 18, fontSize: 14 }}><HeartPulse size={15} style={{ display: "inline", verticalAlign: "-2px" }} /> Qualquer módulo contratado inclui o backup na nuvem: troque de celular sem perder nada.</p>
    </>
  );
}
