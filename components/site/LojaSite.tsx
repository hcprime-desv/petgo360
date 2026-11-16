"use client";
// LOJA NO SITE (dono, 15/11/2026): o tutor entra com a MESMA conta do app (e-mail ou celular + senha) e compra assinaturas,
// recursos e serviços pelo GATEWAY da plataforma (Pix) — sem comissão das lojas Apple/Google. O site só grava o PEDIDO em
// `pedidos_loja`; o back-end petall360 cobra, ATIVA (o app reconhece na hora) e dá os pontos do cashback.
// Regras em lib/compartilhado/lojaCanais.ts.
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Copy, Loader2, LogOut, ShoppingBag } from "lucide-react";
import { filtrarOnce, getAllOnce, getDocOn, getDocOnce, gravarComId } from "@/lib/firebase/gen";
import { conferirSenha, normalizarEmail } from "@/lib/admin/senhas";
import { COLECAO_PEDIDOS_LOJA, STATUS_PEDIDO_LOJA, itensDaLoja, planejarPedidoLoja, precoItem, sobConsultaItem } from "@/lib/compartilhado/lojaCanais";

const brl = (v: any) => `R$ ${(Number(v) || 0).toFixed(2).replace(".", ",")}`;
const dt = (v: any) => (v ? new Date(Number(v)).toLocaleDateString("pt-BR") : "");
const CHAVE = "petgo-loja-sessao";
const GRUPOS: [string, string, (m: any) => boolean][] = [
  ["Assinaturas", "Backup na nuvem e Clube PetGo", (m) => m.tipo === "assinatura"],
  ["Recursos da conta", "Para quem tem o Backup na nuvem", (m) => m.tipo === "recurso"],
  ["Serviços de parceiros", "Plano de saúde, funeral, seguro, telemedicina", (m) => m.tipo === "servico"],
];

export default function LojaSite() {
  const [sessao, setSessao] = useState<{ id: string; nome: string } | null>(null);
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem(CHAVE) || "null"); if (s?.id && s.ate > Date.now()) setSessao(s); } catch { /* sem sessão */ } }, []);
  const sair = () => { try { localStorage.removeItem(CHAVE); } catch { /* ok */ } setSessao(null); };
  return sessao ? <Loja sessao={sessao} sair={sair} /> : <Entrar aoEntrar={setSessao} />;
}

function Entrar({ aoEntrar }: { aoEntrar: (s: any) => void }) {
  const [login, setLogin] = useState(""); const [senha, setSenha] = useState(""); const [erro, setErro] = useState(""); const [ok, setOk] = useState(false);
  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setErro(""); setOk(true);
    try {
      let lista: any[] = [];
      if (login.includes("@")) lista = await filtrarOnce("clientes", "email", normalizarEmail(login));
      else { let d = login.replace(/\D/g, ""); if (d.startsWith("55") && d.length > 11) d = d.slice(2); if (d.length === 11) lista = await filtrarOnce("clientes", "whatsapp", `55${d}`); }
      const c = lista.find((x) => x.senha_hash);
      if (!c || !(await conferirSenha(senha, c))) { setErro("E-mail/celular ou senha incorretos. Use os mesmos dados do app PetGo360."); return; }
      if (c.status && c.status !== "ativo") { setErro("Conta inativa. Fale com o suporte do PetGo360."); return; }
      const s = { id: String(c.id), nome: String(c.nome ?? "").split(" ")[0], ate: Date.now() + 6 * 3600_000 };
      try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch { /* ok */ }
      aoEntrar(s);
    } finally { setOk(false); }
  }
  return (
    <form className="parc-cartao" onSubmit={enviar}>
      <ShoppingBag size={34} aria-hidden />
      <h2>Loja PetGo360</h2>
      <p className="parc-sub">Entre com a sua conta do app para contratar o Backup na nuvem, o Clube PetGo, recursos e serviços — e ganhar pontos.</p>
      <label>E-mail ou celular<input value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" required /></label>
      <label>Senha<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required /></label>
      {erro ? <p className="parc-erro" role="alert">{erro}</p> : null}
      <button className="btn btn-primary" disabled={ok}>{ok ? "Entrando…" : "Entrar"}</button>
      <p className="parc-sub">Ainda não tem conta? Baixe o app PetGo360 (grátis) e crie a sua.</p>
    </form>
  );
}

function Loja({ sessao, sair }: { sessao: { id: string; nome: string }; sair: () => void }) {
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [cliente, setCliente] = useState<any | null>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [escolha, setEscolha] = useState<{ m: any; periodo: "mensal" | "anual"; idPet: string } | null>(null);
  const [idPedido, setIdPedido] = useState<string | null>(null);
  const [pedido, setPedido] = useState<any | null>(null);
  const [erro, setErro] = useState("");
  const carregar = useCallback(async () => {
    const [cat, c, ps, peds] = await Promise.all([getAllOnce("modulos_app"), getDocOnce("clientes", sessao.id), filtrarOnce("pets", "id_clientes", sessao.id), filtrarOnce(COLECAO_PEDIDOS_LOJA, "id_clientes", sessao.id)]);
    setCatalogo(itensDaLoja(cat)); setCliente(c ?? null); setPets(ps.filter((p: any) => p.status !== "inativo")); setPedidos(peds.sort((a: any, b: any) => Number(b.created_at) - Number(a.created_at)));
  }, [sessao]);
  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { setPedido(null); if (!idPedido) return; return getDocOn(COLECAO_PEDIDOS_LOJA, idPedido, setPedido); }, [idPedido]);
  useEffect(() => { if (pedido?.status === "ativo") carregar(); }, [pedido?.status, carregar]);

  const ativoAte = (m: any) => {
    const v = m.tipo === "servico" ? cliente?.servicos_ate?.[m.codigo] : Math.min(...(m.recursos ?? []).map((r: string) => Number(cliente?.recursos_ate?.[r]) || 0));
    return Number(v) > Date.now() ? Number(v) : 0;
  };
  async function comprar() {
    if (!escolha) return;
    setErro("");
    try {
      const dados = planejarPedidoLoja({ idClientes: sessao.id, modulo: escolha.m, periodo: escolha.periodo, idPet: escolha.idPet || null, canal: "site" });
      const id = `site_${sessao.id}_${Date.now()}`;
      await gravarComId(COLECAO_PEDIDOS_LOJA, id, { id, ...dados });
      setIdPedido(id); setEscolha(null);
    } catch (e: any) { setErro(e?.message || "Não foi possível fazer o pedido."); }
  }

  return (
    <div className="portal">
      <div className="portal-topo">
        <div><h2 style={{ margin: 0 }}>Olá, {sessao.nome}!</h2><span className="parc-sub">Compre aqui com Pix — ativa na hora no seu app e você ganha pontos.</span></div>
        <button className="parc-link" onClick={sair}><LogOut size={16} aria-hidden /> Sair</button>
      </div>

      {idPedido ? (
        <div className="parc-cartao parc-centro">
          {!pedido || pedido.status === "pedido" || pedido.status === "processando" ? (<><Loader2 className="parc-gira" size={36} aria-hidden /><p>Preparando o seu pedido…</p></>)
            : pedido.status === "aguardando_pagamento" ? (<>
              <h3>{pedido.nome_modulo}</h3><p className="parc-valor">{brl(pedido.valor)}</p>
              {pedido.qr_svg ? <div className="parc-qr" dangerouslySetInnerHTML={{ __html: pedido.qr_svg }} /> : <Loader2 className="parc-gira" size={30} aria-hidden />}
              {pedido.link_pagamento ? <a className="btn btn-primary" href={pedido.link_pagamento} target="_blank" rel="noreferrer">Pagar com cartão (crédito/débito) ou boleto</a> : null}
              {pedido.copia_cola_pix ? <button className="btn btn-primary" onClick={() => navigator.clipboard?.writeText(pedido.copia_cola_pix)}><Copy size={16} aria-hidden /> Copiar o Pix copia e cola</button> : <p>Gerando o Pix…</p>}
              <p className="parc-sub">{pedido.simulado ? "Ambiente de teste: o Pix é simulado e aprova sozinho em instantes. Não pague este código." : "Pague no app do seu banco. A confirmação chega aqui sozinha."}</p>
            </>)
              : pedido.status === "ativo" ? (<div className="parc-paga"><CheckCircle2 size={64} aria-hidden /><h2>Ativado!</h2><p>{pedido.nome_modulo} até {dt(pedido.ativo_ate)} — já aparece no seu app.</p><button className="btn btn-primary" onClick={() => setIdPedido(null)}>Voltar à loja</button></div>)
                : pedido.status === "solicitado" ? (<><h3>Pedido enviado</h3><p>A equipe do PetGo360 confere com o parceiro e fala com você. Quando aprovado, aparece no app.</p><button className="btn btn-primary" onClick={() => setIdPedido(null)}>Voltar à loja</button></>)
                  : (<><p className="parc-erro">{pedido.erro ?? STATUS_PEDIDO_LOJA[pedido.status as keyof typeof STATUS_PEDIDO_LOJA] ?? pedido.status}</p><button className="btn btn-primary" onClick={() => setIdPedido(null)}>Voltar</button></>)}
        </div>
      ) : (<>
        {GRUPOS.map(([titulo, sub, filtro]) => {
          const itens = catalogo.filter(filtro);
          if (!itens.length) return null;
          return (
            <section key={titulo}>
              <h3 style={{ marginBottom: 2 }}>{titulo}</h3><p className="parc-sub" style={{ marginBottom: 10 }}>{sub}</p>
              <div className="loja-grade">{itens.map((m) => {
                const ate = ativoAte(m);
                return (
                  <div key={m.id} className="loja-item">
                    <b>{m.nome}</b>
                    <p className="parc-sub">{m.descricao}</p>
                    {(m.inclui_recursos ?? []).length ? <p className="parc-ok">+ inclui no app: {(m.inclui_recursos as string[]).map((r) => r.replace(/_/g, " ")).join(", ")}</p> : null}
                    <p>{sobConsultaItem(m) ? "Preço sob consulta" : <>{precoItem(m, "mensal") ? `${brl(precoItem(m, "mensal"))}/mês` : ""}{precoItem(m, "anual") ? ` · ${brl(precoItem(m, "anual"))}/ano` : ""}</>}</p>
                    {Number(m.preco_loja_mensal) > precoItem(m, "mensal") && precoItem(m, "mensal") ? (
                      <p className="loja-economia"><s>no app {brl(m.preco_loja_mensal)}/mês</s> · aqui você economiza {Math.round((1 - precoItem(m, "mensal") / Number(m.preco_loja_mensal)) * 100)}%</p>
                    ) : null}
                    {ate ? <p className="parc-ok">Ativo até {dt(ate)}</p> : null}
                    <button className="btn btn-primary" onClick={() => setEscolha({ m, periodo: precoItem(m, "anual") ? "anual" : "mensal", idPet: pets[0] ? String(pets[0].id) : "" })}>{ate ? "Renovar" : sobConsultaItem(m) ? "Quero contratar" : "Comprar"}</button>
                  </div>
                );
              })}</div>
            </section>
          );
        })}
        {escolha ? (
          <div className="parc-cartao" role="dialog" aria-label={`Comprar ${escolha.m.nome}`}>
            <h3>{escolha.m.nome}</h3>
            {!sobConsultaItem(escolha.m) ? (
              <label>Período<select value={escolha.periodo} onChange={(e) => setEscolha({ ...escolha, periodo: e.target.value as any })}>
                {precoItem(escolha.m, "mensal") ? <option value="mensal">Mensal — {brl(precoItem(escolha.m, "mensal"))}</option> : null}
                {precoItem(escolha.m, "anual") ? <option value="anual">Anual — {brl(precoItem(escolha.m, "anual"))}</option> : null}
              </select></label>
            ) : null}
            {escolha.m.tipo === "servico" ? (pets.length ? (
              <label>Para qual pet<select value={escolha.idPet} onChange={(e) => setEscolha({ ...escolha, idPet: e.target.value })}>{pets.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
            ) : <p className="parc-erro">Os seus pets ainda não estão no backup da nuvem. Ative o Backup ou contrate pelo app.</p>) : null}
            {erro ? <p className="parc-erro">{erro}</p> : null}
            <div style={{ display: "flex", gap: 10 }}><button className="btn btn-primary" onClick={comprar}>{sobConsultaItem(escolha.m) ? "Enviar pedido" : "Pagar com Pix"}</button><button className="parc-link" onClick={() => setEscolha(null)}>Cancelar</button></div>
          </div>
        ) : null}
        <section>
          <h3>Seus pedidos</h3>
          {!pedidos.length ? <p className="parc-sub">Nenhum ainda.</p> : pedidos.slice(0, 15).map((p) => (
            <button key={p.id} className="parc-hist" onClick={() => setIdPedido(p.id)}><span>{p.nome_modulo ?? p.codigo_modulo}<small>{dt(p.created_at)} · {p.canal === "whatsapp" ? "WhatsApp" : "site"}</small></span>
              <span className={p.status === "ativo" ? "parc-ok" : ""}>{STATUS_PEDIDO_LOJA[p.status as keyof typeof STATUS_PEDIDO_LOJA] ?? p.status}{p.valor ? ` · ${brl(p.valor)}` : ""}</span></button>
          ))}
        </section>
      </>)}
    </div>
  );
}
