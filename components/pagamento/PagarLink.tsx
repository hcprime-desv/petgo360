"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Copy, CreditCard, FlaskConical, Lock, QrCode } from "lucide-react";
import { carregarCheckout, pagar, simularPix, type Checkout } from "@/lib/pagamentoLink";
import {
  CARTOES_TESTE, ROTULOS_BANDEIRA, bandeiraDoCartao, brl, mascararCartao, mascararValidade, opcoesParcelamento, tempoRestante, textoParcela, type FormaCheckout,
} from "@/lib/compartilhado/pagamentos";

// Página do link de pagamento — GATEWAY SIMULADO (ambiente de teste, nada é
// cobrado de verdade). Pix com QR + copia e cola e "simular pagamento";
// cartão de crédito (parcelas) ou débito. Aprovado: mostra o voucher.
const dataHora = (v: any) => { const d = typeof v?.toDate === "function" ? v.toDate() : v ? new Date(v) : null; return d ? d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : ""; };
const ms = (v: any) => (typeof v?.toDate === "function" ? v.toDate().getTime() : v ? new Date(v).getTime() : 0);

export default function PagarLink({ token }: { token: string }) {
  const [c, setC] = useState<Checkout | null | undefined>(undefined);
  const [forma, setForma] = useState<FormaCheckout>("pix");
  const [parcelas, setParcelas] = useState(1);
  const [cartao, setCartao] = useState({ numero: "", nome: "", validade: "", cvv: "" });
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<{ texto: string; erro?: boolean } | null>(null);
  const [, tique] = useState(0);

  const recarregar = useCallback(async () => { try { setC(await carregarCheckout(token)); } catch { setC(null); } }, [token]);
  useEffect(() => { recarregar(); }, [recarregar]);
  useEffect(() => { const t = setInterval(() => tique((n) => n + 1), 1000); return () => clearInterval(t); }, []);
  // Pix: confere sozinho a cada 5 s (o banco confirma fora da página).
  const pixAberto = c?.pagamentos.find((p) => p.forma_pagamento === "pix" && p.status === "pendente" && ms(p.pix_expira_em) > Date.now()) ?? null;
  useEffect(() => { if (!pixAberto) return; const t = setInterval(recarregar, 5000); return () => clearInterval(t); }, [pixAberto, recarregar]);

  const tabela = useMemo(() => (c ? opcoesParcelamento(Number(c.reserva.valor_total), c.cfg) : []), [c]);
  const executar = async (f: () => Promise<any>) => {
    setOcupado(true); setMsg(null);
    try {
      const r = await f();
      if (r?.recusado) setMsg({ texto: `Pagamento recusado: ${r.motivo ?? ""} Tente outro cartão ou o Pix.`, erro: true });
    } catch (e: any) { setMsg({ texto: e?.message ?? "Não foi possível concluir.", erro: true }); }
    finally { setOcupado(false); await recarregar(); }
  };

  if (c === undefined) return <p>Carregando…</p>;
  if (c === null) return <div className="alerta alerta-erro">Link de pagamento inválido ou expirado. Peça um novo pelo WhatsApp do PetGo.</div>;
  const r = c.reserva;
  const resumo = (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="eyebrow">Pagamento da reserva</div>
      <h2 style={{ margin: "8px 0 4px" }}>{r.nome_pet} · {r.nome_servico}</h2>
      <p>{dataHora(r.inicio_em)} · {r.nome_empresa}{r.nome_unidade ? ` — ${r.nome_unidade}` : ""}<br />Protocolo {r.protocolo}</p>
      <div style={{ fontSize: 32, fontWeight: 900, color: "var(--o)", marginTop: 10 }}>{brl(r.valor_total)}</div>
      {Number(r.valor_desconto) ? <p>Desconto aplicado: {brl(r.valor_desconto)}</p> : null}
    </div>
  );

  if (r.status === "confirmada" || r.status === "em_atendimento" || r.status === "concluida") {
    return (
      <>
        <div className="alerta alerta-ok" role="status"><CheckCircle2 size={20} style={{ display: "inline", marginRight: 8, verticalAlign: "-4px" }} /><b>Pagamento aprovado!</b> Sua reserva está confirmada.</div>
        <div style={{ height: 16 }} />
        {resumo}
        <div className="card" style={{ textAlign: "center" }}>
          <h3>Seu voucher</h3>
          <div style={{ display: "inline-block", background: "#fff", padding: 14, borderRadius: 16 }}><QRCodeSVG value={r.qr_code || `petgo360://voucher/${r.codigo_voucher}`} size={200} fgColor="#07261C" /></div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 3, marginTop: 8 }}>{r.codigo_voucher}</div>
          <p>Mostre este QR Code (ou o código) na chegada. Ele também aparece no app PetGo360, em Reservas.</p>
        </div>
      </>
    );
  }
  const vencido = c.sessao.status !== "aberta" || ms(c.sessao.expira_em) < Date.now();
  if (r.status !== "aguardando_pagamento" || vencido) {
    return <div className="alerta alerta-erro">{vencido && r.status === "aguardando_pagamento" ? "O prazo para pagar acabou e o horário voltou para a agenda. Peça um novo link pelo WhatsApp." : "Esta reserva não está mais aguardando pagamento."}</div>;
  }

  const opcao = tabela.find((o) => o.parcelas === parcelas) ?? tabela[0];
  const bandeira = bandeiraDoCartao(cartao.numero);
  return (
    <>
      <div className="alerta" style={{ background: "#fff8e6", border: "1px solid #f5d28a", marginBottom: 16 }}><FlaskConical size={18} style={{ display: "inline", marginRight: 8, verticalAlign: "-3px" }} />Ambiente de teste: o pagamento é simulado e nada é cobrado de verdade.</div>
      {resumo}
      <p style={{ marginTop: -6 }}>Horário guardado para você por mais <b>{tempoRestante(c.sessao.expira_em)}</b>.</p>
      <div className="chips" role="tablist">
        {([["pix", "Pix"], ["cartao_credito", "Crédito"], ["cartao_debito", "Débito"]] as const).map(([f, t]) => (
          <button key={f} type="button" className={`chip${forma === f ? " ativo" : ""}`} onClick={() => { setForma(f); setParcelas(1); setMsg(null); }} role="tab" aria-selected={forma === f}>{t}</button>
        ))}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        {forma === "pix" ? (
          pixAberto ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "inline-block", background: "#fff", padding: 14, borderRadius: 16 }}><QRCodeSVG value={pixAberto.copia_cola_pix} size={220} fgColor="#07261C" /></div>
              <p>Pix de <b>{brl(pixAberto.valor)}</b> · vence em {tempoRestante(pixAberto.pix_expira_em)}</p>
              <textarea readOnly value={pixAberto.copia_cola_pix} rows={3} style={{ width: "100%", fontSize: 12, borderRadius: 12, padding: 10, border: "1px solid var(--linha)" }} />
              <div className="acoes" style={{ justifyContent: "center", marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" className="btn btn-contorno btn-sm" onClick={() => { navigator.clipboard?.writeText(pixAberto.copia_cola_pix); setMsg({ texto: "Código Pix copiado. Cole no app do seu banco." }); }}><Copy size={16} /> Copiar código</button>
                <button type="button" className="btn btn-verde btn-sm" disabled={ocupado} onClick={() => executar(() => simularPix(c, pixAberto))}>Simular pagamento (teste)</button>
              </div>
              <p style={{ fontSize: 13 }}>Pague pelo app do seu banco: leia o QR Code ou cole o código. A confirmação aparece aqui sozinha.</p>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <p>Gere o QR Code e pague pelo app do seu banco. Aprovação na hora.</p>
              <button type="button" className="btn btn-primario" disabled={ocupado} onClick={() => executar(() => pagar(c, "pix"))}><QrCode size={18} /> Gerar Pix de {brl(r.valor_total)}</button>
            </div>
          )
        ) : (
          <form className="form-grade" onSubmit={(e) => { e.preventDefault(); executar(() => pagar(c, forma, { parcelas: forma === "cartao_credito" ? parcelas : 1, cartao })); }}>
            <div className="campo" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="cc-num">Número do cartão{bandeira ? ` · ${ROTULOS_BANDEIRA[bandeira]}` : ""}</label>
              <input id="cc-num" inputMode="numeric" autoComplete="cc-number" value={cartao.numero} onChange={(e) => setCartao({ ...cartao, numero: mascararCartao(e.target.value) })} placeholder="0000 0000 0000 0000" />
            </div>
            <div className="campo" style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="cc-nome">Nome como está no cartão</label>
              <input id="cc-nome" autoComplete="cc-name" value={cartao.nome} onChange={(e) => setCartao({ ...cartao, nome: e.target.value.toUpperCase() })} />
            </div>
            <div className="campo"><label htmlFor="cc-val">Validade</label><input id="cc-val" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" value={cartao.validade} onChange={(e) => setCartao({ ...cartao, validade: mascararValidade(e.target.value) })} /></div>
            <div className="campo"><label htmlFor="cc-cvv">CVV</label><input id="cc-cvv" inputMode="numeric" autoComplete="cc-csc" type="password" maxLength={4} value={cartao.cvv} onChange={(e) => setCartao({ ...cartao, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} /></div>
            {forma === "cartao_credito" ? (
              <div className="campo" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="cc-parc">Parcelas</label>
                <select id="cc-parc" value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))}>{tabela.map((o) => <option key={o.parcelas} value={o.parcelas}>{textoParcela(o)}</option>)}</select>
              </div>
            ) : null}
            <div style={{ gridColumn: "1 / -1" }}>
              <button type="submit" className="btn btn-primario" disabled={ocupado}><Lock size={16} /> Pagar {brl(forma === "cartao_credito" && opcao ? opcao.total : r.valor_total)}</button>
              <p style={{ fontSize: 13, marginTop: 8 }}><CreditCard size={14} style={{ display: "inline", verticalAlign: "-2px" }} /> Seu cartão não é guardado: só a bandeira e os 4 últimos números ficam no comprovante.</p>
              <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: "pointer", fontSize: 14 }}>Cartões de teste</summary>
                <ul style={{ fontSize: 13, paddingLeft: 18 }}>
                  {CARTOES_TESTE.map((t) => <li key={t.numero}><button type="button" className="chip" style={{ marginTop: 6 }} onClick={() => setCartao({ numero: t.numero, nome: "PAULO PAIVA", validade: "12/30", cvv: "123" })}>{t.numero}</button> {t.descricao}</li>)}
                </ul>
              </details>
            </div>
          </form>
        )}
        {msg ? <div className={`alerta ${msg.erro ? "alerta-erro" : "alerta-ok"}`} style={{ marginTop: 14 }}>{msg.texto}</div> : null}
      </div>
      <p style={{ marginTop: 18, fontSize: 14 }}>Prefere o app? <Link href="/petgo360">Conheça o PetGo360</Link> — lá você reserva, paga e ainda junta pontos.</p>
    </>
  );
}
