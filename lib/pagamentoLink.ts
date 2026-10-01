// Link de pagamento (/pagar/<token>) — o link que o WhatsApp manda para o
// tutor pagar a reserva já montada pelo bot (sessão de checkout). Gateway
// SIMULADO por enquanto; regras em lib/compartilhado/pagamentos.ts (gerado do
// painel por "npm run sync:app"), as mesmas do app e do painel.
//
// Privacidade: a página só lê o que está ligado ao TOKEN da sessão (a
// reserva e os pagamentos dela) — nada de listar clientes, pets ou reservas.
import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { atualizar, criarComIdSequencial, filtrarOnce, getAllOnce, getDocOnce, tenantDocPath } from "@/lib/firebase/gen";
import {
  configPagamento, planejarAprovacaoPagamento, planejarCobranca, type ConfigPagamento, type DadosCartao, type FormaCheckout,
} from "@/lib/compartilhado/pagamentos";
import type { Escrita } from "@/lib/compartilhado/escritas";

export type Checkout = { sessao: any; reserva: any; pagamentos: any[]; cfg: ConfigPagamento; empresa: any | null };

const ms = (v: any) => (typeof v?.toDate === "function" ? v.toDate().getTime() : v ? new Date(v).getTime() : 0);

export async function carregarCheckout(token: string): Promise<Checkout | null> {
  if (!token || token.length < 32) return null;
  const [sessao] = await filtrarOnce("sessoes_checkout", "token", token);
  if (!sessao?.id_reservas) return null;
  const [reserva, pagamentos, configs, empresa] = await Promise.all([
    getDocOnce("reservas", String(sessao.id_reservas)),
    filtrarOnce("pagamentos", "id_reservas", String(sessao.id_reservas)),
    getAllOnce("configuracoes"),
    sessao.id_empresas ? getDocOnce("empresas", String(sessao.id_empresas)) : Promise.resolve(null),
  ]);
  if (!reserva) return null;
  return {
    sessao, reserva, empresa, pagamentos: pagamentos.sort((a, b) => ms(b.created_at) - ms(a.created_at)),
    cfg: configPagamento(configs, { id_empresas: reserva.id_empresas, id_unidades: reserva.id_unidades }),
  };
}

// ── executor (mesmo contrato do painel: $ref e vaga em transação) ─────────
const REF = "$ref:";
async function moverVaga(id: string, deltaReservada: number, deltaDisponivel: number) {
  const ref = doc(db, tenantDocPath("disponibilidades", id));
  await runTransaction(db, async (t) => {
    const snap = await t.get(ref);
    if (!snap.exists()) return;
    const s: any = snap.data();
    if (deltaDisponivel < 0 && ((Number(s.quantidade_disponivel) || 0) + deltaDisponivel < 0 || s.status !== "disponivel")) throw new Error("Esse horário acabou de ser reservado.");
    const capacidade = Number(s.capacidade) || 1;
    const reservada = Math.max(0, (Number(s.quantidade_reservada) || 0) + deltaReservada);
    const disponivel = Math.min(capacidade - reservada, Math.max(0, (Number(s.quantidade_disponivel) || 0) + deltaDisponivel));
    let status = s.status;
    if (s.status !== "indisponivel" && s.status !== "cancelado") status = reservada >= capacidade ? "esgotado" : disponivel === 0 ? "bloqueado" : "disponivel";
    t.update(ref, { quantidade_reservada: reservada, quantidade_disponivel: disponivel, status, updated_at: new Date() });
  });
}
async function executar(escritas: Escrita[]): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};
  const resolver = (v: any) => (typeof v === "string" && v.startsWith(REF) ? ids[v.slice(REF.length)] ?? null : v);
  const dados = (d: Record<string, any>) => Object.fromEntries(Object.entries(d).map(([k, v]) => [k, resolver(v)]));
  for (const e of escritas) {
    if (e.tipo === "ajustar_slot") await moverVaga(e.id, e.deltaReservada, e.deltaDisponivel);
    else if (e.tipo === "atualizar") await atualizar(e.colecao, String(resolver(e.id)), dados(e.dados));
    else {
      const id = await criarComIdSequencial(e.colecao, dados(e.dados));
      if (e.ref) ids[e.ref] = id;
    }
  }
  return ids;
}
async function auditar(colecao: string, id: string, descricao: string, idEmpresa: string | null) {
  try {
    await criarComIdSequencial("auditoria", {
      id_usuarios: null, id_usuarios_parceiros: null, id_login: null, usuario_nome: "Link de pagamento (site)", id_empresas: idEmpresa,
      colecao, id_documento: id, acao: "mudanca_status", descricao, dados_anteriores: null, dados_novos: null, ip: null, origem: "site",
    });
  } catch { /* a gravação principal já foi feita */ }
}
const codigo = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n))).map((b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");

function exigirAberto(c: Checkout) {
  if (c.reserva.status !== "aguardando_pagamento") throw new Error("Esta reserva não está aguardando pagamento.");
  if (c.sessao.status !== "aberta" || ms(c.sessao.expira_em) < Date.now()) throw new Error("O prazo deste link acabou. Peça um novo pelo WhatsApp.");
}

export async function pagar(c: Checkout, forma: FormaCheckout, opcoes: { parcelas?: number; cartao?: DadosCartao | null } = {}) {
  exigirAberto(c);
  const cob = planejarCobranca({
    origem: { tipo: "reserva", reserva: c.reserva }, forma, parcelas: opcoes.parcelas, cartao: opcoes.cartao ?? null, cfg: c.cfg,
    comissaoPct: Number(c.empresa?.percentual_comissao) || 0, codigoTransacao: `SIM-${forma === "pix" ? "PIX" : "CARD"}-${codigo(10)}`, nomeRecebedor: "PETGO 360",
  });
  const ids = await executar(cob.escritas);
  await auditar("pagamentos", ids.pagamento, `Pagamento ${forma}${cob.split.parcelas > 1 ? ` ${cob.split.parcelas}×` : ""} de ${cob.split.valorCobrado.toFixed(2)} pelo link (simulado)${cob.recusado ? ` recusado: ${cob.motivo}` : ""}`, String(c.reserva.id_empresas));
  if (cob.aprovado) await aprovar(ids.pagamento);
  return cob;
}

async function aprovar(idPagamento: string) {
  const pagamento = await getDocOnce("pagamentos", idPagamento);
  const reserva = pagamento ? await getDocOnce("reservas", String(pagamento.id_reservas)) : null;
  if (!pagamento || !reserva) throw new Error("Pagamento não encontrado.");
  const um = (col: string, id: any) => (id ? getDocOnce(col, String(id)) : Promise.resolve(null));
  const [empresa, servico, unidade, sessao, cupomOff, cupom, endereco, bloqueios, configs] = await Promise.all([
    um("empresas", reserva.id_empresas), um("servicos", reserva.id_servicos), um("unidades", reserva.id_unidades), um("sessoes_checkout", reserva.id_sessoes_checkout),
    um("cupons_off", reserva.id_cupons_off), um("cupons", reserva.id_cupons), um("enderecos", reserva.id_enderecos),
    filtrarOnce("bloqueios_disponibilidades", "id_reservas", String(reserva.id)), getAllOnce("configuracoes"),
  ]);
  const plano = planejarAprovacaoPagamento({
    pagamento, reserva, empresa: empresa ?? {}, servico: servico ?? {}, unidade, sessao, cupomOff, cupom, endereco,
    bloqueio: bloqueios.find((b) => b.status === "ativo") ?? null, cfg: configPagamento(configs, { id_empresas: reserva.id_empresas, id_unidades: reserva.id_unidades }),
  });
  await executar(plano.escritas);
  await auditar("pagamentos", idPagamento, plano.descricao, String(reserva.id_empresas));
}

// Ambiente de teste: faz o papel do banco confirmando o Pix.
export async function simularPix(c: Checkout, pagamento: any) {
  exigirAberto(c);
  if (String(pagamento.id_reservas) !== String(c.reserva.id)) throw new Error("Pagamento de outra reserva.");
  await aprovar(String(pagamento.id));
}
