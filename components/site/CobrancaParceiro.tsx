"use client";
// PAGAR NO PARCEIRO — tela do BALCÃO do parceiro PetGo (dono, 15/11/2026: "tudo tem que passar pela plataforma"). O parceiro
// informa o código e o PIN dele, o valor e a descrição; o back-end petall360 confere o PIN e devolve o código PGC-… e o QR. O tutor
// aponta a câmera do celular (abre o app PetGo360), usa cupom/pontos e paga por Pix pelo gateway da plataforma — aqui aparece PAGA.
// Regras em lib/compartilhado/clubePetgo.ts. Nada de dado do tutor além do primeiro nome.
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, QrCode, Store } from "lucide-react";
import { getDocOn, gravarComId } from "@/lib/firebase/gen";
import { COLECOES_CLUBE, ROTULOS_STATUS_COBRANCA } from "@/lib/compartilhado/clubePetgo";

const brl = (v: any) => `R$ ${(Number(v) || 0).toFixed(2).replace(".", ",")}`;
const CHAVE_SESSAO = "petgo-parceiro-sessao";
const CHAVE_HIST = "petgo-parceiro-cobrancas";
const ler = (k: string) => { try { return JSON.parse(sessionStorage.getItem(k) || localStorage.getItem(k) || "null"); } catch { return null; } };

function useCobranca(id: string | null) {
  const [doc, setDoc] = useState<any | null>(null);
  useEffect(() => { setDoc(null); if (!id) return; return getDocOn(COLECOES_CLUBE.cobrancas, id, setDoc); }, [id]);
  return doc;
}

export default function CobrancaParceiro({ codigoFixo }: { codigoFixo?: string } = {}) {
  const [codigoParceiro, setCodigoParceiro] = useState(codigoFixo ?? "");
  const [pin, setPin] = useState("");
  const [entrou, setEntrou] = useState(false);
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [historico, setHistorico] = useState<string[]>([]);
  const [erro, setErro] = useState("");
  const cob = useCobranca(id);

  useEffect(() => {
    const s = ler(CHAVE_SESSAO); if (s?.codigo && (!codigoFixo || s.codigo === codigoFixo)) { setCodigoParceiro(s.codigo); setPin(s.pin ?? ""); setEntrou(true); }
    try { setHistorico(JSON.parse(localStorage.getItem(CHAVE_HIST) || "[]")); } catch { /* sem histórico */ }
  }, []);

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!codigoParceiro.trim() || !/^\d{4,8}$/.test(pin)) { setErro("Informe o código do parceiro e o PIN (4 a 8 números)."); return; }
    try { sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify({ codigo: codigoParceiro.trim().toUpperCase(), pin })); } catch { /* ok */ }
    setErro(""); setEntrou(true);
  }
  async function gerar(e: React.FormEvent) {
    e.preventDefault(); setErro("");
    const novo = `site_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      await gravarComId(COLECOES_CLUBE.cobrancas, novo, { id: novo, status: "nova", codigo_parceiro: codigoParceiro.trim().toUpperCase(), pin, valor_texto: valor, descricao, created_at: Date.now() });
      setId(novo);
      const h = [novo, ...historico].slice(0, 15); setHistorico(h);
      try { localStorage.setItem(CHAVE_HIST, JSON.stringify(h)); } catch { /* ok */ }
    } catch { setErro("Não foi possível criar a cobrança. Tente de novo."); }
  }
  const nova = () => { setId(null); setValor(""); setDescricao(""); };

  if (!entrou) return (
    <form className="parc-cartao" onSubmit={entrar}>
      <Store size={34} aria-hidden />
      <h2>Parceiro PetGo — cobrar pelo app</h2>
      <p className="parc-sub">Cupons e pontos do PetGo360 só valem com o pagamento pelo app. Entre com o código e o PIN de cobrança do seu cadastro.</p>
      {codigoFixo ? <p className="parc-sub">Parceiro <b>{codigoFixo}</b> — digite o PIN de cobrança do balcão.</p> : <label>Código do parceiro<input value={codigoParceiro} onChange={(e) => setCodigoParceiro(e.target.value.toUpperCase())} placeholder="Ex.: AMIGOFIEL" autoComplete="username" /></label>}
      <label>PIN de cobrança<input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} inputMode="numeric" type="password" placeholder="••••" autoComplete="current-password" /></label>
      {erro ? <p className="parc-erro" role="alert">{erro}</p> : null}
      <button className="btn btn-primary" type="submit">Entrar</button>
    </form>
  );

  return (
    <div className="parc-grade">
      <div className="parc-cartao">
        {!id ? (
          <form onSubmit={gerar} style={{ display: "grid", gap: 12 }}>
            <h2><QrCode size={22} aria-hidden /> Nova cobrança — {codigoParceiro}</h2>
            <label>Valor (R$)<input value={valor} onChange={(e) => setValor(e.target.value.replace(/[^\d,]/g, ""))} inputMode="decimal" placeholder="Ex.: 120,00" required /></label>
            <label>Descrição (opcional)<input value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={120} placeholder="Ex.: Banho e tosa — porte médio" /></label>
            {erro ? <p className="parc-erro" role="alert">{erro}</p> : null}
            <button className="btn btn-primary" type="submit">Gerar cobrança</button>
            <button type="button" className="parc-link" onClick={() => { try { sessionStorage.removeItem(CHAVE_SESSAO); } catch { /* ok */ } setEntrou(false); setPin(""); }}>Sair</button>
          </form>
        ) : !cob || cob.status === "nova" ? (
          <div className="parc-centro"><Loader2 className="parc-gira" size={36} aria-hidden /><p>Gerando a cobrança…</p></div>
        ) : cob.status === "recusada" ? (
          <div className="parc-centro"><p className="parc-erro">{cob.erro}</p><button className="btn btn-primary" onClick={nova}>Tentar de novo</button></div>
        ) : cob.status === "paga" ? (
          <div className="parc-centro parc-paga">
            <CheckCircle2 size={72} aria-hidden />
            <h2>PAGA</h2>
            <p className="parc-valor">{brl(cob.valor_pago)}</p>
            <p>{cob.nome_cliente ? `Cliente: ${cob.nome_cliente}` : ""}{cob.descricao ? ` · ${cob.descricao}` : ""}</p>
            <p className="parc-sub">Valor {brl(cob.valor)}{cob.desconto_cupom ? ` · cupom −${brl(cob.desconto_cupom)}` : ""}{cob.desconto_pontos ? ` · pontos −${brl(cob.desconto_pontos)} (pagos pelo PetGo)` : ""}</p>
            <p><b>Você recebe {brl(cob.valor_repasse)}</b> (taxa da plataforma {brl(cob.taxa)})</p>
            <button className="btn btn-primary" onClick={nova}>Nova cobrança</button>
          </div>
        ) : (
          <div className="parc-centro">
            <p className="parc-sub">{cob.nome_parceiro}{cob.descricao ? ` · ${cob.descricao}` : ""}</p>
            <p className="parc-valor">{brl(cob.valor)}</p>
            {cob.qr_svg ? <div className="parc-qr" dangerouslySetInnerHTML={{ __html: cob.qr_svg }} /> : null}
            <p className="parc-codigo">{cob.codigo}</p>
            <p>{cob.status === "aguardando_pagamento" ? "O cliente está pagando pelo Pix…" : "Peça ao cliente para apontar a câmera do celular para o QR (abre o app PetGo360) ou digitar o código em “Pagar no parceiro”."}</p>
            <p className="parc-sub">{ROTULOS_STATUS_COBRANCA[cob.status] ?? cob.status} · vale até {new Date(Number(cob.expira_em)).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
            <button type="button" className="parc-link" onClick={nova}>Cancelar e criar outra</button>
          </div>
        )}
      </div>
      <div className="parc-cartao">
        <h3>Cobranças deste computador</h3>
        {!historico.length ? <p className="parc-sub">Nenhuma ainda.</p> : historico.map((h) => <LinhaHistorico key={h} id={h} onAbrir={() => setId(h)} />)}
      </div>
    </div>
  );
}

function LinhaHistorico({ id, onAbrir }: { id: string; onAbrir: () => void }) {
  const c = useCobranca(id);
  if (!c || c.status === "nova") return null;
  return (
    <button type="button" className="parc-hist" onClick={onAbrir}>
      <span>{c.codigo ?? "—"}<small>{c.descricao}</small></span>
      <span className={c.status === "paga" ? "parc-ok" : ""}>{ROTULOS_STATUS_COBRANCA[c.status] ?? c.status} · {brl(c.status === "paga" ? c.valor_pago : c.valor)}</span>
    </button>
  );
}
