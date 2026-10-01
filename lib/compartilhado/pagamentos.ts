// GERADO por "npm run sync:app" no painel (projetos/petGo360) para o site público (site/petGo), a partir de
// shared/compartilhado/pagamentos.ts — NÃO EDITAR AQUI: altere no painel e sincronize.

// ═══ COMPARTILHADO painel ⇄ apps ⇄ site ═══════════════════════════════════
// Pagamento da reserva — hoje com o GATEWAY SIMULADO (provedor "simulado"):
// tudo acontece dentro da plataforma, sem sandbox. As telas, o split e as
// gravações já são os definitivos; para ligar um gateway de verdade (ex.:
// Asaas) troca-se só quem cobra (o executor de cada lado) e a aprovação passa
// a vir do webhook no backend, chamando o MESMO planejarAprovacaoPagamento.
//
// Regras de negócio (decisão do dono, 30/09/2026):
// - Parcelado no crédito: até `parcelas_sem_juros` o cliente não paga juros
//   (o parceiro absorve a taxa); acima disso o cliente paga os juros (tabela
//   Price), que entram para o parceiro e compensam a taxa maior.
// - A taxa do gateway (e a de antecipação) sai do PARCEIRO; a comissão da
//   plataforma fica inteira e incide sobre o preço sem juros + o desconto
//   bancado pela plataforma.
// - Crédito parcelado é antecipado: o parceiro recebe tudo no repasse do
//   período, com a taxa de antecipação descontada.
//
// Dinheiro sempre em CENTAVOS nas contas (sem erro de ponto flutuante); o
// líquido do parceiro é o que sobra — a soma bate sempre com o que o cliente
// pagou, centavo por centavo.
//
// Cartão: o número NUNCA é gravado — só bandeira e os 4 últimos dígitos.

import type { Escrita, Problema } from "./escritas";
import { valorEfetivo } from "./parametros";
import { qrDoVoucher } from "./qrcodes";
import { planejarConfirmacaoCompra } from "./clubeOff";

export const PROVEDOR_SIMULADO = "simulado";
export const FORMAS_CHECKOUT = ["pix", "cartao_credito", "cartao_debito"] as const;
export type FormaCheckout = (typeof FORMAS_CHECKOUT)[number];
export const ROTULOS_FORMA: Record<string, string> = { pix: "Pix", cartao_credito: "Cartão de crédito", cartao_debito: "Cartão de débito", boleto: "Boleto", outro: "Outro" };

const cent = (v: any) => Math.round((Number(v) || 0) * 100);
const reais = (c: number) => Math.round(c) / 100;
export const brl = (v: any) => `R$ ${(Number(v) || 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

// ── Configuração (Sistema → Configurações, grupo "pagamentos") ───────────
export type ConfigPagamento = {
  taxaPix: number; taxaDebito: number; taxaCredito: number; taxaCreditoParcelado: number;
  taxaAntecipacaoMensal: number; jurosMensalCliente: number;
  parcelasSemJuros: number; parcelasMaximas: number; parcelaMinima: number;
  minutosPix: number; minutosSessao: number; minutosBloqueio: number;
};
export function configPagamento(registros: any[], escopo: { id_empresas?: string | null; id_unidades?: string | null } = {}): ConfigPagamento {
  const v = (chave: string) => valorEfetivo(chave, registros, escopo);
  return {
    taxaPix: v("taxa_gateway_pix"), taxaDebito: v("taxa_gateway_debito"), taxaCredito: v("taxa_gateway_cartao"), taxaCreditoParcelado: v("taxa_gateway_credito_parcelado"),
    taxaAntecipacaoMensal: v("taxa_antecipacao_mensal"), jurosMensalCliente: v("juros_parcelamento_mensal"),
    parcelasSemJuros: Math.max(1, Math.floor(v("parcelas_sem_juros"))), parcelasMaximas: Math.max(1, Math.floor(v("parcelas_maximas"))), parcelaMinima: v("valor_minimo_parcela"),
    minutosPix: v("minutos_validade_pix"), minutosSessao: v("minutos_sessao_checkout"), minutosBloqueio: v("minutos_bloqueio_disponibilidade"),
  };
}

// ── Parcelamento ─────────────────────────────────────────────────────────
export type OpcaoParcela = { parcelas: number; valorParcela: number; total: number; comJuros: boolean; juros: number };
export function opcoesParcelamento(valor: number, cfg: ConfigPagamento): OpcaoParcela[] {
  const c = cent(valor);
  const saida: OpcaoParcela[] = [];
  for (let n = 1; n <= cfg.parcelasMaximas; n++) {
    let parcela: number, total: number;
    const comJuros = n > cfg.parcelasSemJuros && cfg.jurosMensalCliente > 0;
    if (!comJuros) { parcela = Math.round(c / n); total = c; }
    else {
      const i = cfg.jurosMensalCliente / 100;
      parcela = Math.round((c * i) / (1 - Math.pow(1 + i, -n)));
      total = parcela * n;
    }
    if (n > 1 && parcela < cent(cfg.parcelaMinima)) break;
    saida.push({ parcelas: n, valorParcela: reais(parcela), total: reais(total), comJuros, juros: reais(total - c) });
  }
  return saida;
}
export const textoParcela = (o: OpcaoParcela) => o.parcelas === 1 ? `À vista — ${brl(o.total)}` : `${o.parcelas}× de ${brl(o.valorParcela)}${o.comJuros ? ` (total ${brl(o.total)})` : " sem juros"}`;

// ── Split ────────────────────────────────────────────────────────────────
export type Split = {
  forma: string; parcelas: number;
  valorBase: number;          // preço da reserva (sem juros)
  valorCobrado: number;       // o que o cliente paga (com juros, se houver)
  juros: number;              // cobrado − base (vai para o parceiro)
  descontoPlataforma: number; // cupom da plataforma, devolvido ao parceiro
  comissaoPct: number; comissao: number;
  taxaGatewayPct: number; taxaGateway: number; taxaAntecipacao: number; custoGateway: number;
  liquidoParceiro: number;    // cobrado + desconto da plataforma − custos do gateway − comissão
  receitaPlataforma: number;  // comissão − desconto bancado
};
export function taxaDaForma(forma: string, parcelas: number, cfg: ConfigPagamento): number {
  if (forma === "pix") return cfg.taxaPix;
  if (forma === "cartao_debito") return cfg.taxaDebito;
  return parcelas > 1 ? cfg.taxaCreditoParcelado : cfg.taxaCredito;
}
export function calcularSplit(p: { valorBase: number; forma: string; parcelas?: number; descontoPlataforma?: number; comissaoPct: number; cfg: ConfigPagamento }): Split {
  const parcelas = p.forma === "cartao_credito" ? Math.max(1, Math.floor(p.parcelas ?? 1)) : 1;
  const base = cent(p.valorBase), desconto = cent(p.descontoPlataforma ?? 0);
  let cobrado = base;
  if (parcelas > 1) {
    const opcao = opcoesParcelamento(p.valorBase, p.cfg).find((o) => o.parcelas === parcelas);
    if (!opcao) throw new Error(`Parcelamento em ${parcelas}× não disponível para ${brl(p.valorBase)}.`);
    cobrado = cent(opcao.total);
  }
  const taxaPct = taxaDaForma(p.forma, parcelas, p.cfg);
  const taxa = Math.round((cobrado * taxaPct) / 100);
  // Antecipação: cada parcela k é antecipada k meses → média (n+1)/2 meses.
  const antecipacao = parcelas > 1 ? Math.round((cobrado * p.cfg.taxaAntecipacaoMensal * (parcelas + 1)) / 2 / 100) : 0;
  const comissao = Math.round(((base + desconto) * (Number(p.comissaoPct) || 0)) / 100);
  const liquido = cobrado + desconto - taxa - antecipacao - comissao;
  return {
    forma: p.forma, parcelas, valorBase: reais(base), valorCobrado: reais(cobrado), juros: reais(cobrado - base), descontoPlataforma: reais(desconto),
    comissaoPct: Number(p.comissaoPct) || 0, comissao: reais(comissao), taxaGatewayPct: taxaPct, taxaGateway: reais(taxa), taxaAntecipacao: reais(antecipacao),
    custoGateway: reais(taxa + antecipacao), liquidoParceiro: reais(liquido), receitaPlataforma: reais(comissao - desconto),
  };
}
// O cliente paga = gateway + plataforma + parceiro (sempre, por construção).
export const splitConfere = (s: Split) => cent(s.valorCobrado) === cent(s.custoGateway) + cent(s.receitaPlataforma) + cent(s.liquidoParceiro);

// ── Pix: "copia e cola" no padrão BR Code (EMV) do Banco Central ────────
// Chave SIMULADA (EVP zerada): um app de banco recusa — ninguém paga de verdade.
export const CHAVE_PIX_SIMULADA = "00000000-0000-0000-0000-000000000000";
const tlv = (id: string, v: string) => `${id}${String(v.length).padStart(2, "0")}${v}`;
const semAcento = (s: string) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 ]/g, "").toUpperCase();
export function crc16(texto: string): string {
  let crc = 0xffff;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
export function gerarPixCopiaECola(p: { chave: string; nome: string; cidade: string; valor: number; txid: string }): string {
  const txid = String(p.txid).replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const corpo = "000201" + "010212"
    + tlv("26", tlv("00", "br.gov.bcb.pix") + tlv("01", p.chave))
    + "52040000" + "5303986" + tlv("54", (Math.round(p.valor * 100) / 100).toFixed(2)) + "5802BR"
    + tlv("59", semAcento(p.nome).slice(0, 25) || "PETGO 360") + tlv("60", semAcento(p.cidade).slice(0, 15) || "MANAUS")
    + tlv("62", tlv("05", txid)) + "6304";
  return corpo + crc16(corpo);
}

// ── Cartão ───────────────────────────────────────────────────────────────
export const soDigitos = (v: any) => String(v ?? "").replace(/\D/g, "");
export function luhn(numero: string): boolean {
  const d = soDigitos(numero);
  if (d.length < 13 || d.length > 19) return false;
  let soma = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
    soma += n;
  }
  return soma % 10 === 0;
}
export function bandeiraDoCartao(numero: string): string | null {
  const d = soDigitos(numero);
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(d)) return "elo";
  if (/^(606282|3841)/.test(d)) return "hipercard";
  if (/^3[47]/.test(d)) return "amex";
  if (/^4/.test(d)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d)) return "mastercard";
  return null;
}
// Máscaras enquanto digita (app e site).
export const mascararCartao = (v: any) => soDigitos(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
export const mascararValidade = (v: any) => { const d = soDigitos(v).slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };
export const ROTULOS_BANDEIRA: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", elo: "Elo", amex: "American Express", hipercard: "Hipercard" };
export type DadosCartao = { numero: string; nome: string; validade: string; cvv: string };
export function problemasCartao(c: DadosCartao, agora = new Date()): Problema[] {
  const p: Problema[] = [];
  const bandeira = bandeiraDoCartao(c.numero);
  if (!luhn(c.numero) || !bandeira) p.push({ campo: "numero", mensagem: "Número do cartão inválido." });
  if (String(c.nome ?? "").trim().length < 3) p.push({ campo: "nome", mensagem: "Informe o nome como está no cartão." });
  const m = String(c.validade ?? "").match(/^(\d{2})\s*\/\s*(\d{2}|\d{4})$/);
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) p.push({ campo: "validade", mensagem: "Validade inválida (MM/AA)." });
  else {
    const ano = m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2]);
    if (new Date(ano, Number(m[1]), 1) <= agora) p.push({ campo: "validade", mensagem: "Cartão vencido." });
  }
  if (!new RegExp(bandeira === "amex" ? "^\\d{4}$" : "^\\d{3}$").test(String(c.cvv ?? ""))) p.push({ campo: "cvv", mensagem: "CVV inválido." });
  return p;
}
// Cartões de teste do gateway simulado (mesma ideia dos sandboxes): qualquer
// outro número válido é aprovado.
export const CARTOES_TESTE: { numero: string; resultado: "aprovado" | "recusado"; descricao: string }[] = [
  { numero: "4111 1111 1111 1111", resultado: "aprovado", descricao: "Visa — aprovado" },
  { numero: "5555 5555 5555 4444", resultado: "aprovado", descricao: "Mastercard — aprovado" },
  { numero: "4000 0000 0000 0002", resultado: "recusado", descricao: "Recusado — saldo ou limite insuficiente" },
  { numero: "4000 0000 0000 0069", resultado: "recusado", descricao: "Recusado — cartão bloqueado" },
  { numero: "4000 0000 0000 0119", resultado: "recusado", descricao: "Recusado — falha na comunicação com o banco" },
];
export function decisaoSimuladaCartao(numero: string): { aprovado: boolean; motivo: string | null } {
  const d = soDigitos(numero);
  if (d.endsWith("0002")) return { aprovado: false, motivo: "Saldo ou limite insuficiente." };
  if (d.endsWith("0069")) return { aprovado: false, motivo: "Cartão bloqueado pelo banco emissor." };
  if (d.endsWith("0119")) return { aprovado: false, motivo: "Falha na comunicação com o banco. Tente de novo." };
  return { aprovado: true, motivo: null };
}

// ── Preço e benefícios da reserva ────────────────────────────────────────
// Horário com oferta usa o valor do horário; senão, o preço do porte do pet.
export function precoDaReserva(sp: { valor_base?: any; precos_por_porte?: { porte: string; valor: any }[] }, porte: string | null | undefined, slot: { id_ofertas?: any; valor?: any }): number {
  if (slot.id_ofertas && Number(slot.valor) > 0) return Number(slot.valor);
  const doPorte = (sp.precos_por_porte ?? []).find((x) => x.porte === porte);
  return Number(doPorte ? doPorte.valor : sp.valor_base) || Number(slot.valor) || 0;
}
export type Beneficio = { tipo: "cupom_off" | "cupom"; id: string; codigo: string; desconto: number; bancadoPelaPlataforma: boolean; descricao: string };
const descontoPorTipo = (tipo: string, valorDesconto: any, preco: any, valor: number) => {
  const d = tipo === "percentual" ? (valor * (Number(valorDesconto) || 0)) / 100 : tipo === "preco_fixo" ? valor - (Number(preco) || 0) : Number(valorDesconto) || 0;
  return reais(Math.max(0, Math.min(cent(valor), Math.round(d * 100))));
};
// Cupom OFF da carteira do tutor (já "adquirido"), da campanha deste serviço.
export function beneficioCupomOff(p: { cupom: Record<string, any>; campanha: Record<string, any>; idCliente: string; idServicoParceiro: string; valor: number; agora?: Date }): Beneficio {
  const agora = p.agora ?? new Date();
  const { cupom, campanha } = p;
  if (String(cupom.id_clientes) !== String(p.idCliente) || cupom.status !== "adquirido") throw new Error("Este cupom não está disponível na sua carteira.");
  if (cupom.expira_em && toDate(cupom.expira_em) < agora) throw new Error("Este cupom venceu.");
  if (String(campanha.id_servicos_parceiros) !== String(p.idServicoParceiro)) throw new Error("Este cupom é de outro serviço.");
  const desconto = descontoPorTipo(campanha.tipo_desconto, campanha.valor_desconto, campanha.preco_promocional, p.valor);
  return { tipo: "cupom_off", id: String(cupom.id), codigo: String(cupom.codigo), desconto, bancadoPelaPlataforma: false, descricao: campanha.nome ?? "Cupom OFF" };
}
// Cupom digitado (promocional ou da troca de pontos).
export function beneficioCupom(p: { cupom: Record<string, any> | null; idCliente: string; empresa: string; unidade: string; servicoParceiro: string; valor: number; usosDoCliente: number; agora?: Date }): Beneficio {
  const agora = p.agora ?? new Date();
  const c = p.cupom;
  if (!c || c.status !== "ativo") throw new Error("Cupom inválido ou encerrado.");
  if ((c.inicio_em && toDate(c.inicio_em) > agora) || (c.fim_em && toDate(c.fim_em) < agora)) throw new Error("Cupom fora do período de validade.");
  if (c.id_clientes && String(c.id_clientes) !== String(p.idCliente)) throw new Error("Este cupom é de outro cliente.");
  if (c.id_empresas && String(c.id_empresas) !== String(p.empresa)) throw new Error("Este cupom não vale neste parceiro.");
  if (c.id_unidades && String(c.id_unidades) !== String(p.unidade)) throw new Error("Este cupom não vale nesta unidade.");
  if (c.id_servicos_parceiros && String(c.id_servicos_parceiros) !== String(p.servicoParceiro)) throw new Error("Este cupom não vale neste serviço.");
  if (Number(c.valor_minimo) > 0 && p.valor < Number(c.valor_minimo)) throw new Error(`Compra mínima de ${brl(c.valor_minimo)} para este cupom.`);
  if (Number(c.limite_utilizacoes) > 0 && Number(c.quantidade_utilizada) >= Number(c.limite_utilizacoes)) throw new Error("Os usos deste cupom acabaram.");
  if (p.usosDoCliente >= (Number(c.limite_por_cliente) || 1)) throw new Error("Você já usou este cupom.");
  const desconto = descontoPorTipo(c.tipo_desconto, c.valor_desconto, null, p.valor);
  return { tipo: "cupom", id: String(c.id), codigo: String(c.codigo), desconto, bancadoPelaPlataforma: !c.id_empresas, descricao: `Cupom ${c.codigo}` };
}
function toDate(v: any): Date { return typeof v?.toDate === "function" ? v.toDate() : v instanceof Date ? v : new Date(v); }

// ── 1) Abrir o checkout: segura o horário e cria a reserva ───────────────
// A primeira escrita (ajustar_slot com deltaDisponivel −1) é a que garante a
// vaga: o executor faz em transação e RECUSA se o horário acabou.
export function planejarCheckoutReserva(p: {
  cliente: Record<string, any>; pet: Record<string, any>; slot: Record<string, any>;
  servicoParceiro: Record<string, any>; servico: Record<string, any>; empresa: Record<string, any>; unidade: Record<string, any>;
  endereco?: Record<string, any> | null; beneficio?: Beneficio | null; origem: "app" | "web" | "whatsapp" | "portal_parceiro";
  cfg: ConfigPagamento; agora?: Date; protocolo: string; codigoVoucher: string; token: string;
}): { escritas: Escrita[]; resumo: { valorServico: number; desconto: number; taxa: number; total: number } } {
  const agora = p.agora ?? new Date();
  const { slot, servicoParceiro: sp, servico, empresa, unidade, pet, cliente } = p;
  if (String(pet.id_clientes) !== String(cliente.id)) throw new Error("Este pet não é deste tutor.");
  if (empresa.status !== "ativo" || empresa.aceita_pagamento_online === false) throw new Error("Este parceiro não está recebendo reservas pelo app agora.");
  if (sp.status !== "ativo") throw new Error("Este serviço não está disponível.");
  if (String(slot.id_servicos_parceiros) !== String(sp.id)) throw new Error("Horário de outro serviço.");
  if (slot.status !== "disponivel" || !(Number(slot.quantidade_disponivel) > 0)) throw new Error("Esse horário não está mais disponível. Escolha outro.");
  if (toDate(slot.inicio_em) <= agora) throw new Error("Esse horário já passou.");
  const precisaEndereco = servico.tipo_execucao === "domicilio" || servico.tipo_execucao === "transporte";
  if (precisaEndereco && !(p.endereco && Number(p.endereco.latitude) && Number(p.endereco.longitude))) throw new Error("Escolha o endereço (com localização) para o atendimento.");

  const valorServico = precoDaReserva(sp, pet.porte, slot);
  const desconto = Math.min(valorServico, p.beneficio?.desconto ?? 0);
  const taxa = servico.tipo_execucao === "domicilio" ? Number(sp.taxa_deslocamento) || 0 : 0;
  const total = reais(cent(valorServico) - cent(desconto) + cent(taxa));
  const expiraSessao = new Date(agora.getTime() + p.cfg.minutosSessao * 60000);
  const expiraBloqueio = new Date(agora.getTime() + p.cfg.minutosBloqueio * 60000);
  const idCupomOff = p.beneficio?.tipo === "cupom_off" ? p.beneficio.id : null;
  const idCupom = p.beneficio?.tipo === "cupom" ? p.beneficio.id : null;
  const escritas: Escrita[] = [
    { tipo: "ajustar_slot", id: String(slot.id), deltaReservada: 0, deltaDisponivel: -1 },
    {
      tipo: "criar", colecao: "sessoes_checkout", ref: "sessao",
      dados: {
        id_clientes: String(cliente.id), id_pets: String(pet.id), id_empresas: String(empresa.id), id_unidades: String(unidade.id), id_servicos: String(servico.id),
        id_servicos_parceiros: String(sp.id), id_ofertas: slot.id_ofertas ?? null, id_disponibilidades: String(slot.id), id_cupons: idCupom, id_cupons_off: idCupomOff,
        id_conversas: null, id_pagamentos: null, id_reservas: null, token: p.token, origem: p.origem, expira_em: expiraSessao, status: "aberta",
      },
    },
    {
      tipo: "criar", colecao: "reservas", ref: "reserva",
      dados: {
        protocolo: p.protocolo, id_clientes: String(cliente.id), id_pets: String(pet.id), id_empresas: String(empresa.id), id_unidades: String(unidade.id),
        id_servicos: String(servico.id), id_servicos_parceiros: String(sp.id), id_ofertas: slot.id_ofertas ?? null, id_disponibilidades: String(slot.id),
        id_profissionais: slot.id_profissionais ?? null, id_sessoes_checkout: "$ref:sessao", id_cupons: idCupom, id_cupons_off: idCupomOff, id_assinaturas: null, id_vantagens: null,
        id_enderecos: p.endereco ? String(p.endereco.id) : null,
        nome_cliente: cliente.nome ?? "", nome_pet: pet.nome ?? "", nome_servico: sp.nome ?? servico.nome ?? "", nome_empresa: empresa.nome_fantasia ?? "", nome_unidade: unidade.nome ?? "",
        inicio_em: toDate(slot.inicio_em), fim_em: toDate(slot.fim_em), valor_servico: valorServico, valor_desconto: desconto, valor_taxa: taxa, valor_transporte: 0, valor_total: total,
        origem: p.origem, status: "aguardando_pagamento", pagamento_status: "pendente", codigo_voucher: p.codigoVoucher, qr_code: qrDoVoucher(p.codigoVoucher),
        checkin_em: null, concluida_em: null, cancelada_em: null, cancelado_por: null, motivo_cancelamento: null, observacoes: null,
      },
    },
    { tipo: "atualizar", colecao: "sessoes_checkout", id: "$ref:sessao", dados: { id_reservas: "$ref:reserva" } },
    {
      tipo: "criar", colecao: "bloqueios_disponibilidades", ref: "bloqueio",
      dados: { id_disponibilidades: String(slot.id), id_sessoes_checkout: "$ref:sessao", id_reservas: "$ref:reserva", id_clientes: String(cliente.id), quantidade: 1, bloqueado_em: agora, expira_em: expiraBloqueio, status: "ativo" },
    },
  ];
  return { escritas, resumo: { valorServico, desconto, taxa, total } };
}

// ── 2) Cobrar: cria o pagamento (Pix pendente; cartão já com a resposta) ─
// Duas origens com o mesmo checkout: a RESERVA do tutor (split com o
// parceiro) e a COMPRA DE PACOTE Clube OFF pelo parceiro (venda da própria
// plataforma: não há split; o custo do gateway é da plataforma).
export type OrigemCobranca =
  | { tipo: "reserva"; reserva: Record<string, any> }
  | { tipo: "compra_cupom_off"; compra: Record<string, any> };

// Venda da plataforma (pacote OFF): o parceiro é o comprador.
export function calcularVendaPlataforma(p: { valorBase: number; forma: string; parcelas?: number; cfg: ConfigPagamento }): Split {
  const s = calcularSplit({ ...p, descontoPlataforma: 0, comissaoPct: 0 });
  return { ...s, comissao: 0, liquidoParceiro: 0, receitaPlataforma: reais(cent(s.valorCobrado) - cent(s.custoGateway)) };
}

export function planejarCobranca(p: {
  origem: OrigemCobranca; forma: FormaCheckout; parcelas?: number; cfg: ConfigPagamento; comissaoPct?: number;
  cartao?: DadosCartao | null; agora?: Date; codigoTransacao: string; nomeRecebedor?: string; cidade?: string;
}): { escritas: Escrita[]; split: Split; aprovado: boolean; recusado: boolean; motivo: string | null; copiaECola: string | null; expiraEm: Date | null } {
  const agora = p.agora ?? new Date();
  if (!(FORMAS_CHECKOUT as readonly string[]).includes(p.forma)) throw new Error("Forma de pagamento inválida.");
  let split: Split, base: Record<string, any>;
  const depois = (aprovado: boolean, recusado: boolean): Escrita[] => {
    if (p.origem.tipo !== "reserva") return [];
    const r = p.origem.reserva;
    return [
      ...(r.id_sessoes_checkout ? [{ tipo: "atualizar", colecao: "sessoes_checkout", id: String(r.id_sessoes_checkout), dados: { id_pagamentos: "$ref:pagamento" } } as Escrita] : []),
      { tipo: "atualizar", colecao: "reservas", id: String(r.id), dados: { pagamento_status: aprovado ? "processando" : recusado ? "recusado" : "pendente" } },
    ];
  };
  if (p.origem.tipo === "reserva") {
    const r = p.origem.reserva;
    if (r.status !== "aguardando_pagamento") throw new Error(`Esta reserva está "${r.status}" — não aceita pagamento.`);
    split = calcularSplit({ valorBase: Number(r.valor_total), forma: p.forma, parcelas: p.parcelas, descontoPlataforma: 0, comissaoPct: p.comissaoPct ?? 0, cfg: p.cfg });
    base = { id_reservas: String(r.id), id_compras_cupons_off: null, id_clientes: String(r.id_clientes), id_empresas: String(r.id_empresas), id_sessoes_checkout: r.id_sessoes_checkout ?? null };
  } else {
    const c = p.origem.compra;
    if (c.status !== "pendente") throw new Error(`Esta compra está "${c.status}" — não aceita pagamento.`);
    split = calcularVendaPlataforma({ valorBase: Number(c.valor_total), forma: p.forma, parcelas: p.parcelas, cfg: p.cfg });
    base = { id_reservas: null, id_compras_cupons_off: String(c.id), id_clientes: null, id_empresas: String(c.id_empresas), id_sessoes_checkout: null };
  }
  base = {
    ...base, id_cupons_off: null, id_assinaturas: null, provedor: PROVEDOR_SIMULADO, forma_pagamento: p.forma, parcelas: split.parcelas, valor: split.valorCobrado,
    codigo_transacao: p.codigoTransacao, motivo_recusa: null, pago_em: null, expirado_em: null,
  };
  if (p.forma === "pix") {
    const copia = gerarPixCopiaECola({ chave: CHAVE_PIX_SIMULADA, nome: p.nomeRecebedor ?? "PETGO 360", cidade: p.cidade ?? "MANAUS", valor: split.valorCobrado, txid: p.codigoTransacao });
    const expiraEm = new Date(agora.getTime() + p.cfg.minutosPix * 60000);
    return {
      escritas: [
        { tipo: "criar", colecao: "pagamentos", ref: "pagamento", dados: { ...base, status: "pendente", qr_code_pix: copia, copia_cola_pix: copia, cartao_bandeira: null, cartao_final: null, pix_expira_em: expiraEm } },
        ...depois(false, false),
      ],
      split, aprovado: false, recusado: false, motivo: null, copiaECola: copia, expiraEm,
    };
  }
  const cartao = p.cartao;
  if (!cartao) throw new Error("Informe os dados do cartão.");
  const problemas = problemasCartao(cartao, agora);
  if (problemas.length) throw new Error(problemas[0].mensagem);
  const decisao = decisaoSimuladaCartao(cartao.numero);
  const d = soDigitos(cartao.numero);
  return {
    escritas: [
      {
        tipo: "criar", colecao: "pagamentos", ref: "pagamento",
        dados: { ...base, status: decisao.aprovado ? "processando" : "recusado", motivo_recusa: decisao.motivo, qr_code_pix: null, copia_cola_pix: null, cartao_bandeira: bandeiraDoCartao(d), cartao_final: d.slice(-4), pix_expira_em: null },
      },
      ...depois(decisao.aprovado, !decisao.aprovado),
    ],
    split, aprovado: decisao.aprovado, recusado: !decisao.aprovado, motivo: decisao.motivo, copiaECola: null, expiraEm: null,
  };
}

// ── Compra de pacote Clube OFF pelo parceiro ─────────────────────────────
export function planejarNovaCompraPacote(p: { pacote: Record<string, any>; idEmpresa: string }): Escrita {
  const pk = p.pacote;
  if (pk.status !== "ativo") throw new Error("Este pacote não está à venda.");
  return {
    tipo: "criar", colecao: "compras_cupons_off", ref: "compra",
    dados: {
      id_empresas: String(p.idEmpresa), id_pacotes_cupons_off: String(pk.id), id_pagamentos: null, quantidade_cupons: Number(pk.quantidade_cupons),
      valor_unitario: Number(pk.valor_unitario), valor_total: Number(pk.valor_pacote), quantidade_disponivel: 0, quantidade_utilizada: 0, status: "pendente", pago_em: null, expira_em: null,
    },
  };
}
export function planejarAprovacaoCompraOff(p: { pagamento: Record<string, any>; compra: Record<string, any>; pacote: Record<string, any> | null; cfg: ConfigPagamento; agora?: Date }): { escritas: Escrita[]; split: Split; descricao: string } {
  const pg = p.pagamento, agora = p.agora ?? new Date();
  if (pg.status === "aprovado") throw new Error("Este pagamento já foi aprovado.");
  if (!["pendente", "processando"].includes(pg.status)) throw new Error(`Pagamento "${pg.status}" não pode ser aprovado.`);
  if (pg.forma_pagamento === "pix" && pg.pix_expira_em && toDate(pg.pix_expira_em) < agora) throw new Error("Este Pix venceu. Gere um novo.");
  const split = calcularVendaPlataforma({ valorBase: Number(p.compra.valor_total), forma: pg.forma_pagamento, parcelas: pg.parcelas, cfg: p.cfg });
  if (Math.abs(split.valorCobrado - Number(pg.valor)) > 0.009) throw new Error("O valor do pagamento não confere com a compra.");
  const plano = planejarConfirmacaoCompra(p.compra, {
    pacote: p.pacote ? { validade_dias: Number(p.pacote.validade_dias), nome: p.pacote.nome } : null, pagamentoPendente: { id: String(pg.id), status: pg.status }, agora,
    cobranca: { valorCobrado: split.valorCobrado, custoGateway: split.custoGateway, taxaAntecipacao: split.taxaAntecipacao, juros: split.juros, forma: split.forma, parcelas: split.parcelas, codigo: pg.codigo_transacao ?? null },
  });
  return { escritas: plano.escritas, split, descricao: `${plano.descricao} — ${ROTULOS_FORMA[split.forma] ?? split.forma}${split.parcelas > 1 ? ` ${split.parcelas}×` : ""} (${PROVEDOR_SIMULADO}), receita líquida ${brl(split.receitaPlataforma)}` };
}

// ── Condições comerciais de um parceiro (painel → Empresas) ──────────────
// Valor efetivo de cada parâmetro para a empresa e de onde veio: exceção da
// empresa, regra da plataforma ou o padrão do sistema.
export const CHAVES_CONDICOES_PARCEIRO = [
  "taxa_gateway_pix", "taxa_gateway_debito", "taxa_gateway_cartao", "taxa_gateway_credito_parcelado", "taxa_antecipacao_mensal",
  "juros_parcelamento_mensal", "parcelas_sem_juros", "parcelas_maximas", "valor_minimo_parcela", "dias_repasse",
] as const;
export function origemDoParametro(chave: string, registros: any[], idEmpresa: string): { valor: number; origem: "empresa" | "plataforma" | "padrao"; registro: any | null } {
  const daChave = registros.filter((r) => r.chave === chave);
  const daEmpresa = daChave.find((r) => !r.id_unidades && String(r.id_empresas) === String(idEmpresa));
  const daPlataforma = daChave.find((r) => !r.id_empresas && !r.id_unidades);
  const valor = valorEfetivo(chave, registros, { id_empresas: idEmpresa });
  return { valor, origem: daEmpresa ? "empresa" : daPlataforma ? "plataforma" : "padrao", registro: daEmpresa ?? null };
}

// ── 3) Aprovar (hoje: "simular pagamento" / cartão aprovado; depois: webhook) ─
// Faz exatamente o que o webhook fará: pagamento aprovado, split no razão,
// reserva confirmada, vaga ocupada, bloqueio e sessão convertidos, cupom
// consumido e a execução criada (hotel, domicílio, transporte).
export function planejarAprovacaoPagamento(p: {
  pagamento: Record<string, any>; reserva: Record<string, any>; empresa: Record<string, any>; servico: Record<string, any>;
  sessao?: Record<string, any> | null; bloqueio?: Record<string, any> | null; cupomOff?: Record<string, any> | null; cupom?: Record<string, any> | null;
  unidade?: Record<string, any> | null; endereco?: Record<string, any> | null; servicoParceiro?: Record<string, any> | null;
  cfg: ConfigPagamento; agora?: Date;
}): { escritas: Escrita[]; split: Split; descricao: string } {
  const agora = p.agora ?? new Date();
  const { pagamento: pg, reserva: r, empresa, servico } = p;
  if (pg.status === "aprovado") throw new Error("Este pagamento já foi aprovado.");
  if (!["pendente", "processando"].includes(pg.status)) throw new Error(`Pagamento "${pg.status}" não pode ser aprovado.`);
  if (pg.forma_pagamento === "pix" && pg.pix_expira_em && toDate(pg.pix_expira_em) < agora) throw new Error("Este Pix venceu. Gere um novo.");
  if (r.status !== "aguardando_pagamento") throw new Error(`A reserva está "${r.status}" — o pagamento não pode confirmá-la.`);
  const descontoPlataforma = p.cupom && !p.cupom.id_empresas ? Number(r.valor_desconto) || 0 : 0;
  const split = calcularSplit({ valorBase: Number(r.valor_total), forma: pg.forma_pagamento, parcelas: pg.parcelas, descontoPlataforma, comissaoPct: Number(empresa.percentual_comissao) || 0, cfg: p.cfg });
  if (Math.abs(split.valorCobrado - Number(pg.valor)) > 0.009) throw new Error("O valor do pagamento não confere com a reserva.");
  const idR = String(r.id);
  const escritas: Escrita[] = [
    { tipo: "atualizar", colecao: "pagamentos", id: String(pg.id), dados: { status: "aprovado", pago_em: agora } },
    {
      tipo: "criar", colecao: "transacoes",
      dados: {
        id_pagamentos: String(pg.id), id_reservas: idR, id_empresas: String(r.id_empresas), id_clientes: String(r.id_clientes), tipo: "pagamento",
        valor_bruto: split.valorCobrado, valor_taxa_gateway: split.custoGateway, valor_taxa_antecipacao: split.taxaAntecipacao, valor_juros: split.juros,
        valor_comissao: split.comissao, valor_desconto: split.descontoPlataforma, valor_liquido_parceiro: split.liquidoParceiro,
        forma_pagamento: split.forma, parcelas: split.parcelas, codigo_externo: pg.codigo_transacao ?? null, status: "confirmada",
      },
    },
    { tipo: "atualizar", colecao: "reservas", id: idR, dados: { status: "confirmada", pagamento_status: "aprovado" } },
  ];
  if (r.id_disponibilidades) escritas.push({ tipo: "ajustar_slot", id: String(r.id_disponibilidades), deltaReservada: 1, deltaDisponivel: 0 });
  if (p.bloqueio && p.bloqueio.status === "ativo") escritas.push({ tipo: "atualizar", colecao: "bloqueios_disponibilidades", id: String(p.bloqueio.id), dados: { status: "convertido" } });
  if (p.sessao && p.sessao.status === "aberta") escritas.push({ tipo: "atualizar", colecao: "sessoes_checkout", id: String(p.sessao.id), dados: { status: "convertida" } });
  if (p.cupomOff) escritas.push({ tipo: "atualizar", colecao: "cupons_off", id: String(p.cupomOff.id), dados: { status: "utilizado", id_reservas: idR, utilizado_em: agora } });
  if (p.cupom) {
    escritas.push({ tipo: "atualizar", colecao: "cupons", id: String(p.cupom.id), dados: { quantidade_utilizada: (Number(p.cupom.quantidade_utilizada) || 0) + 1 } });
    escritas.push({ tipo: "criar", colecao: "cupons_utilizacoes", dados: { id_cupons: String(p.cupom.id), id_clientes: String(r.id_clientes), id_pets: r.id_pets ?? null, id_reservas: idR, valor_desconto: Number(r.valor_desconto) || 0, utilizado_em: agora } });
  }
  // Execução conforme o serviço (servicos.tipo_execucao).
  const inicio = toDate(r.inicio_em), fim = toDate(r.fim_em);
  const comum = { id_reservas: idR, id_clientes: String(r.id_clientes), id_pets: String(r.id_pets), id_empresas: String(r.id_empresas) };
  if (servico.tipo_execucao === "hospedagem") {
    const diarias = Math.max(1, Math.round((fim.getTime() - inicio.getTime()) / 86400000));
    const creche = /creche/i.test(`${servico.slug ?? ""} ${servico.nome ?? ""}`);
    escritas.push({
      tipo: "criar", colecao: "hospedagens",
      dados: { ...comum, id_unidades: String(r.id_unidades), id_acomodacoes: null, modalidade: creche ? "creche" : "hotel", checkin_previsto_em: inicio, checkout_previsto_em: fim, checkin_em: null, checkout_em: null, quantidade_diarias: creche ? 1 : diarias, valor_diaria: reais(Math.round(cent(r.valor_total) / (creche ? 1 : diarias))), valor_total: Number(r.valor_total), observacoes: null, status: "reservada" },
    });
  } else if (servico.tipo_execucao === "domicilio" && p.endereco) {
    escritas.push({
      tipo: "criar", colecao: "atendimentos_domiciliares",
      dados: { ...comum, id_unidades: String(r.id_unidades), id_profissionais: r.id_profissionais ?? null, id_enderecos: String(p.endereco.id), agendado_em: inicio, latitude: Number(p.endereco.latitude), longitude: Number(p.endereco.longitude), distancia_km: 0, valor_servico: Number(r.valor_servico), valor_deslocamento: Number(r.valor_taxa) || 0, status: "agendado" },
    });
  } else if (servico.tipo_execucao === "transporte" && p.endereco && p.unidade) {
    const end = p.endereco, u = p.unidade;
    escritas.push({
      tipo: "criar", colecao: "transportes",
      dados: {
        ...comum, id_reservas_principal: null, id_unidades: String(r.id_unidades), id_veiculos: null, id_usuarios_parceiros: null, tipo: "ida_volta",
        origem_endereco: [end.logradouro, end.numero, end.bairro].filter(Boolean).join(", "), origem_latitude: Number(end.latitude), origem_longitude: Number(end.longitude),
        destino_endereco: [u.logradouro, u.numero, u.bairro].filter(Boolean).join(", ") || u.nome || "", destino_latitude: Number(u.latitude) || 0, destino_longitude: Number(u.longitude) || 0,
        distancia_km: 0, buscar_em: inicio, retornar_em: fim, valor: Number(r.valor_total), status: "agendado",
      },
    });
  }
  const descricao = `Pagamento ${ROTULOS_FORMA[split.forma] ?? split.forma}${split.parcelas > 1 ? ` ${split.parcelas}×` : ""} aprovado (${PROVEDOR_SIMULADO}): reserva ${r.protocolo ?? idR} confirmada — parceiro ${brl(split.liquidoParceiro)}, plataforma ${brl(split.receitaPlataforma)}, gateway ${brl(split.custoGateway)}`;
  return { escritas, split, descricao };
}

// ── 4) Recusar (cartão recusado, ou "simular recusa" do Pix no painel) ───
// A reserva continua aguardando pagamento: o tutor pode tentar outra forma
// até a sessão vencer.
export function planejarRecusaPagamento(pagamento: Record<string, any>, reserva: Record<string, any> | null, motivo: string): Escrita[] {
  if (!["pendente", "processando"].includes(pagamento.status)) throw new Error(`Pagamento "${pagamento.status}" não pode ser recusado.`);
  return [
    { tipo: "atualizar", colecao: "pagamentos", id: String(pagamento.id), dados: { status: "recusado", motivo_recusa: motivo || "Recusado." } },
    ...(reserva && reserva.status === "aguardando_pagamento" ? [{ tipo: "atualizar", colecao: "reservas", id: String(reserva.id), dados: { pagamento_status: "recusado" } } as Escrita] : []),
  ];
}

// Tempo restante (mm:ss) de um Pix / sessão.
export function tempoRestante(expira: any, agora = new Date()): string {
  const ms = Math.max(0, toDate(expira).getTime() - agora.getTime());
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
