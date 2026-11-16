// GERADO por "npm run sync:app" no painel (projetos/petGo360) para o site público (site/petGo), a partir de
// shared/compartilhado/clubePetgo.ts — NÃO EDITAR AQUI: altere no painel e sincronize.

// CLUBE PETGO E PONTOS (dono, 15/11/2026). TS puro (sync:app → app e site; cópia no back-end petall360 em
// src/produtos/petgo360/clube/regras.ts).
//
// • PONTOS — só para quem ASSINA (Backup na nuvem ou o Clube). Ganha por eventos que o SERVIDOR confere (o app não credita nada):
//   cada mês de assinatura paga, plano anual, amigo indicado que assina, vacina validada pelo veterinário pelo QR, boas-vindas do
//   Clube. Membro do Clube ganha em DOBRO. Os pontos valem 12 meses (os mais antigos são usados primeiro) e NÃO valem dinheiro:
//   só trocam por itens DENTRO da plataforma.
// • TROCAS (`recompensas_pontos`): itens da plataforma (meses de Backup, combos) ou CUPONS em parceiros PetGo do Guia — o desconto
//   é BANCADO PELO PARCEIRO.
// • CLUBE PETGO — assinatura SEPARADA (recurso `clube_petgo`, módulo "clube"): todo mês o membro pega os cupons do mês
//   (`ofertas_clube` dos parceiros da cidade/estado) e ganha pontos em dobro.
// • CUPOM (`cupons_petgo`): código PG-XXXXXX, uso único, com validade. SÓ VALE NUM PAGAMENTO FEITO PELA PLATAFORMA (dono,
//   15/11/2026: "tudo tem que passar por ela" — o PetGo ganha uma taxa em cada transação).
// • PAGAR NO PARCEIRO (`cobrancas_parceiros`): o PARCEIRO cria a cobrança no site ({url_site}/parceiro, código + PIN) → QR/código
//   PGC-XXXXXX → o TUTOR paga no app (Pix do gateway da plataforma), escolhendo o cupom daquele parceiro e quantos pontos usar →
//   o back-end confirma: cupom "utilizado", pontos debitados, pontos da compra creditados, TAXA da plataforma e REPASSE ao parceiro.
//   Desconto do CUPOM = bancado pelo parceiro; desconto dos PONTOS = bancado pelo PetGo (sai da taxa).
// • Tudo que mexe em pontos/cupons/pagamentos é PEDIDO (`pedidos_clube`) atendido pelo back-end petall360.

export const RECURSO_CLUBE = "clube_petgo";
export const COLECOES_CLUBE = {
  movimentos: "pontos_movimentos", recompensas: "recompensas_pontos", ofertas: "ofertas_clube", cupons: "cupons_petgo",
  pedidos: "pedidos_clube", cobrancas: "cobrancas_parceiros",
} as const;
export const GRUPO_CLUBE = "clube";
const DIA = 86_400_000;

// ── regras de pontos (valores padrão; o painel ajusta em Configurações, grupo "clube", chave "pontos.<regra>") ──────────
export type RegraPontos = { chave: string; rotulo: string; pontos: number; como: string };
export const REGRAS_PONTOS: RegraPontos[] = [
  { chave: "assinatura_mes", rotulo: "Mês de assinatura pago", pontos: 100, como: "Todo mês que a sua assinatura (Backup ou Clube) é paga." },
  { chave: "assinatura_ano", rotulo: "Plano anual pago", pontos: 1500, como: "Ao pagar um plano anual." },
  { chave: "indicacao_assinante", rotulo: "Amigo indicado que assinou", pontos: 300, como: "Quando quem usou o seu código no cadastro assina pela primeira vez." },
  { chave: "vacina_validada", rotulo: "Vacina registrada ou validada pelo veterinário", pontos: 50, como: "Quando o veterinário registra ou valida uma vacina pelo QR Code." },
  { chave: "boas_vindas_clube", rotulo: "Boas-vindas do Clube PetGo", pontos: 200, como: "Ao entrar no Clube PetGo (uma vez por conta)." },
  { chave: "compra_parceiro", rotulo: "Cashback de compra paga pelo app num parceiro PetGo", pontos: 0, como: "O cashback da forma de pagamento (tabela de tarifas do gateway, ex.: 2% no Pix) volta em pontos." },
  { chave: "compra_canal", rotulo: "Compra no site ou no WhatsApp do PetGo", pontos: 0, como: "Assinaturas, combos e serviços comprados no site ou no WhatsApp: o cashback (tabela de tarifas do gateway) volta em pontos." },
  { chave: "estorno", rotulo: "Devolução de pontos", pontos: 0, como: "Pagamento não concluído: os pontos usados voltam." },
  { chave: "ajuste", rotulo: "Ajuste da central", pontos: 0, como: "Lançado pela equipe do PetGo360." },
];
export const regraPontos = (chave: any) => REGRAS_PONTOS.find((r) => r.chave === chave) ?? null;
export const VALIDADE_PONTOS_DIAS = 365;
export const LIMITE_PONTOS_DIA = 3000;
export const MULTIPLICADOR_CLUBE = 2;

export type ParametrosClube = { pontos: Record<string, number>; validadeDias: number; limiteDia: number; multiplicador: number; taxaTransacao: number; pontosPorReal: number; maxDescontoPontosPct: number; minutosCobranca: number };
/** Configurações do grupo "clube" → parâmetros (chave "pontos.<regra>", "validade_dias", "limite_dia", "multiplicador"). */
export function parametrosClube(configs: any[] | null | undefined): ParametrosClube {
  const m: Record<string, any> = {};
  for (const c of configs ?? []) if (c?.grupo === GRUPO_CLUBE && c?.status !== "inativo") m[String(c.chave)] = c.valor;
  const n = (v: any, p: number) => { const x = Number(String(v ?? "").replace(",", ".")); return isFinite(x) && String(v ?? "").trim() !== "" ? x : p; };
  return {
    pontos: Object.fromEntries(REGRAS_PONTOS.map((r) => [r.chave, n(m[`pontos.${r.chave}`], r.pontos)])),
    validadeDias: n(m.validade_dias, VALIDADE_PONTOS_DIAS), limiteDia: n(m.limite_dia, LIMITE_PONTOS_DIA), multiplicador: n(m.multiplicador, MULTIPLICADOR_CLUBE),
    // pagamentos nos parceiros: taxa da plataforma (%; o parceiro pode ter a própria em `taxa_transacao`), quantos pontos valem R$ 1
    // de desconto, até quantos % da conta podem ser pagos com pontos e quanto tempo a cobrança fica aberta
    taxaTransacao: n(m.taxa_transacao, 5), pontosPorReal: n(m.pontos_por_real_desconto, 100), maxDescontoPontosPct: n(m.max_desconto_pontos_pct, 50), minutosCobranca: n(m.minutos_cobranca, 30),
  };
}

// ── quem participa ─────────────────────────────────────────────────────────
const ms = (v: any): number => (typeof v === "number" ? v : typeof v?.toMillis === "function" ? v.toMillis() : v ? new Date(v).getTime() || 0 : 0);
const nivel99 = (c: any) => String(c?.nivel ?? "") === "99";
export const membroClube = (c: any, agora = Date.now()) => nivel99(c) || ms(c?.recursos_ate?.[RECURSO_CLUBE]) > agora;
/** Ganha e troca pontos: assinante do Backup ou do Clube. */
export const participaPontos = (c: any, agora = Date.now()) => nivel99(c) || ms(c?.recursos_ate?.backup_nuvem) > agora || membroClube(c, agora);

// ── saldo (FIFO com validade) ──────────────────────────────────────────────
export type Movimento = { id?: string; id_clientes: string; tipo: "credito" | "debito"; regra: string; pontos: number; descricao: string; ref: string; expira_em: number | null; created_at: number };
export type Saldo = { saldo: number; aExpirar30d: number; proximaExpiracao: number | null; ganhos12m: number };
export function saldoPontos(movimentos: any[] | null | undefined, agora = Date.now()): Saldo {
  const ord = [...(movimentos ?? [])].sort((a, b) => ms(a.created_at) - ms(b.created_at));
  const lotes: { resta: number; expira: number }[] = [];
  let ganhos12m = 0;
  for (const m of ord) {
    const p = Math.max(0, Math.round(Number(m.pontos) || 0));
    if (m.tipo === "credito") {
      lotes.push({ resta: p, expira: ms(m.expira_em) || Infinity });
      if (ms(m.created_at) > agora - 365 * DIA) ganhos12m += p;
    } else {
      let falta = p; const quando = ms(m.created_at);
      for (const l of lotes) { if (falta <= 0) break; if (l.expira <= quando || l.resta <= 0) continue; const u = Math.min(l.resta, falta); l.resta -= u; falta -= u; }
    }
  }
  const vivos = lotes.filter((l) => l.resta > 0 && l.expira > agora);
  const saldo = vivos.reduce((a, l) => a + l.resta, 0);
  const aExpirar30d = vivos.filter((l) => l.expira <= agora + 30 * DIA).reduce((a, l) => a + l.resta, 0);
  const proximaExpiracao = vivos.length ? Math.min(...vivos.map((l) => l.expira)) : null;
  return { saldo, aExpirar30d, proximaExpiracao: proximaExpiracao === Infinity ? null : proximaExpiracao, ganhos12m };
}

/** Crédito de pontos (id = regra + referência → nunca credita duas vezes o mesmo evento). null = não credita (com o motivo). */
export function planejarCredito(p: { cliente: any; regra: string; ref: string; descricao: string; params: ParametrosClube; creditadoHoje: number; pontos?: number; agora?: number }): { movimento: Movimento & { id: string } } | { motivo: string } {
  const agora = p.agora ?? Date.now();
  if (!p.cliente?.id) return { motivo: "sem tutor" };
  if (p.regra !== "ajuste" && !participaPontos(p.cliente, agora)) return { motivo: "não assina" };
  const base = p.pontos ?? p.params.pontos[p.regra] ?? 0;
  const dobro = p.regra !== "ajuste" && membroClube(p.cliente, agora) && !nivel99(p.cliente) ? p.params.multiplicador : 1;
  let pontos = Math.round(base * dobro);
  if (pontos <= 0) return { motivo: "regra sem pontos" };
  if (p.regra !== "ajuste") pontos = Math.min(pontos, Math.max(0, p.params.limiteDia - p.creditadoHoje));
  if (pontos <= 0) return { motivo: "limite diário" };
  return {
    movimento: {
      id: `${p.regra}_${String(p.ref).replace(/[^\w-]/g, "_")}`, id_clientes: String(p.cliente.id), tipo: "credito", regra: p.regra, pontos,
      descricao: p.descricao + (dobro > 1 ? " (em dobro — Clube PetGo)" : ""), ref: String(p.ref), expira_em: agora + p.params.validadeDias * DIA, created_at: agora,
    },
  };
}

// ── recompensas (catálogo de trocas) ───────────────────────────────────────
// Trocas por ITENS DIGITAIS do app (meses de Backup/combos) SAÍRAM (dono, 15/11/2026 — regra das lojas): só cupons em parceiros.
export const TIPOS_RECOMPENSA = [{ valor: "cupom", rotulo: "Cupom em parceiro PetGo" }] as const;
export const TIPOS_DESCONTO_CUPOM = [{ valor: "percentual", rotulo: "% de desconto" }, { valor: "valor", rotulo: "R$ de desconto" }, { valor: "brinde", rotulo: "Brinde / serviço grátis" }] as const;
export const textoDesconto = (r: any) =>
  r?.desconto_tipo === "percentual" ? `${Number(r.desconto_valor) || 0}% de desconto` : r?.desconto_tipo === "valor" ? `R$ ${(Number(r.desconto_valor) || 0).toFixed(2).replace(".", ",")} de desconto` : String(r?.brinde ?? "Brinde");

/** Troca: confere tudo e devolve o débito e o pedido concluído (o back-end grava e entrega o item). */
export function planejarTroca(p: { cliente: any; recompensa: any; movimentos: any[]; trocasDoMes: number; idPedido: string; agora?: number }) {
  const agora = p.agora ?? Date.now();
  const r = p.recompensa;
  if (!r || r.status !== "ativo") throw new Error("Esta recompensa não está disponível.");
  if (r.tipo !== "cupom") throw new Error("Esta troca não está mais disponível (só cupons em parceiros).");
  if (!participaPontos(p.cliente, agora)) throw new Error("Os pontos são para assinantes. Assine o Backup ou o Clube PetGo.");
  if (r.so_clube === "sim" && !membroClube(p.cliente, agora)) throw new Error("Esta troca é exclusiva do Clube PetGo.");
  const custo = Math.round(Number(r.custo_pontos) || 0);
  if (custo <= 0) throw new Error("Recompensa sem custo em pontos.");
  if (r.estoque !== null && r.estoque !== undefined && r.estoque !== "" && Number(r.estoque) <= 0) throw new Error("Esgotado. Escolha outra recompensa.");
  if (Number(r.limite_mes) > 0 && p.trocasDoMes >= Number(r.limite_mes)) throw new Error(`Você já trocou ${r.limite_mes}x esta recompensa neste mês.`);
  const { saldo } = saldoPontos(p.movimentos, agora);
  if (saldo < custo) throw new Error(`Faltam ${custo - saldo} pontos para esta troca.`);
  return {
    debito: { id: `troca_${p.idPedido}`, id_clientes: String(p.cliente.id), tipo: "debito", regra: "troca", pontos: custo, descricao: `Troca: ${r.titulo}`, ref: p.idPedido, expira_em: null, created_at: agora } as Movimento & { id: string },
    custo,
  };
}

/** Item da plataforma: estende os recursos do módulo por N dias (como a ativação de uma assinatura). */
export function planejarBonusPlataforma(cliente: any, modulo: any, dias: number, agora = Date.now()) {
  const recursos = { ...(cliente?.recursos_ate ?? {}) } as Record<string, number>;
  const lista: string[] = modulo?.recursos ?? [];
  if (!lista.length) throw new Error("Módulo sem recursos para liberar.");
  const atual = Math.max(0, ...lista.map((x) => ms(recursos[x])));
  const fim = Math.max(agora, atual) + Math.max(1, dias) * DIA;
  for (const x of lista) recursos[x] = Math.max(ms(recursos[x]), fim);
  return { patchCliente: { recursos_ate: recursos }, fim };
}

// ── cupons ─────────────────────────────────────────────────────────────────
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const codigoCupom = (bytes: Uint8Array | number[]) => "PG-" + Array.from(bytes).slice(0, 6).map((b) => ALFABETO[b % ALFABETO.length]).join("");
export const normalizarCodigoCupom = (t: any) => String(t ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^PG/, "PG-").slice(0, 9);
export type SituacaoCupom = "disponivel" | "utilizado" | "expirado" | "cancelado";
export const situacaoCupom = (c: any, agora = Date.now()): SituacaoCupom =>
  c?.status === "utilizado" ? "utilizado" : c?.status === "cancelado" ? "cancelado" : ms(c?.valido_ate) && ms(c.valido_ate) < agora ? "expirado" : "disponivel";
export const ROTULOS_SITUACAO_CUPOM: Record<SituacaoCupom, string> = { disponivel: "Disponível", utilizado: "Utilizado", expirado: "Expirado", cancelado: "Cancelado" };

/** Cupom a partir de uma recompensa (troca) ou de uma oferta do Clube. Os dados do parceiro vão junto (o site mostra sem ler o parceiro). */
export function planejarCupom(p: { cliente: any; origem: "pontos" | "clube"; item: any; parceiro: any; codigo: string; ref: string; agora?: number }) {
  const agora = p.agora ?? Date.now();
  const dias = Math.max(1, Number(p.item?.validade_dias) || 30);
  return {
    codigo: p.codigo, id_clientes: String(p.cliente.id), nome_tutor: String(p.cliente.nome ?? "").split(" ")[0], origem: p.origem, ref: p.ref,
    id_parceiros_indicacao: String(p.parceiro?.id ?? p.item?.id_parceiros_indicacao ?? ""), nome_parceiro: String(p.parceiro?.nome ?? ""),
    endereco_parceiro: String(p.parceiro?.endereco ?? ""), titulo: String(p.item?.titulo ?? ""), regras: String(p.item?.regras ?? ""),
    desconto_tipo: p.item?.desconto_tipo ?? "percentual", desconto_valor: Number(p.item?.desconto_valor) || 0, brinde: String(p.item?.brinde ?? ""),
    status: "disponivel", valido_ate: agora + dias * DIA, usado_em: null, created_at: agora,
  };
}

// ── Clube: cupons do mês ───────────────────────────────────────────────────
export const mesDe = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
/** Ofertas do Clube para o membro (ativas, do estado dele ou de todo o país). */
export const ofertasDoMembro = (ofertas: any[] | null | undefined, uf: string | null) =>
  (ofertas ?? []).filter((o) => o?.status === "ativo" && (!o.uf || !uf || String(o.uf).toUpperCase() === String(uf).toUpperCase()));
/** Id fixo do cupom do mês (não repete): clube_<tutor>_<oferta>_<AAAA-MM>_<n>. */
export const idCupomClube = (idCliente: string, idOferta: string, mes: string, n = 1) => `clube_${idCliente}_${idOferta}_${mes}_${n}`;

// ── PAGAR NO PARCEIRO (cobrança do parceiro paga pela plataforma) ─────────
export const codigoCobranca = (bytes: Uint8Array | number[]) => "PGC-" + Array.from(bytes).slice(0, 6).map((b) => ALFABETO[b % ALFABETO.length]).join("");
export const normalizarCodigoCobranca = (t: any) => { const d = String(t ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^PGC/, ""); return d ? `PGC-${d.slice(0, 6)}` : ""; };
/** Link que a CÂMERA do celular abre direto no app (QR da cobrança). */
export const linkAppCobranca = (codigo: string) => `petgo360://pagar?codigo=${encodeURIComponent(codigo)}`;
export const STATUS_COBRANCA = ["aberta", "aguardando_pagamento", "paga", "cancelada", "expirada"] as const;
export const ROTULOS_STATUS_COBRANCA: Record<string, string> = { aberta: "Aguardando o cliente", aguardando_pagamento: "Pagando (Pix)", paga: "PAGA", cancelada: "Cancelada", expirada: "Expirada" };
const centavos = (v: number) => Math.round(v * 100) / 100;

/** O parceiro cria a cobrança (site, com o PIN dele). */
export function planejarCobranca(p: { parceiro: any; pin: any; valor: any; descricao: any; codigo: string; params: ParametrosClube; agora?: number }) {
  const agora = p.agora ?? Date.now();
  if (!p.parceiro || p.parceiro.status !== "ativo") throw new Error("Parceiro não encontrado ou inativo.");
  if (!String(p.parceiro.pin_cupom ?? "").trim() || String(p.pin ?? "").trim() !== String(p.parceiro.pin_cupom).trim()) throw new Error("Código ou PIN do parceiro incorreto.");
  const valor = centavos(Number(String(p.valor ?? "").replace(/\./g, "").replace(",", ".")));
  if (!(valor >= 1) || valor > 50000) throw new Error("Informe o valor (de R$ 1,00 a R$ 50.000,00).");
  return {
    codigo: p.codigo, id_parceiros_indicacao: String(p.parceiro.id), nome_parceiro: String(p.parceiro.nome ?? ""), valor, descricao: String(p.descricao ?? "").trim().slice(0, 120),
    taxa_pct: Number(p.parceiro.taxa_transacao) >= 0 && String(p.parceiro.taxa_transacao ?? "") !== "" ? Number(p.parceiro.taxa_transacao) : p.params.taxaTransacao,
    taxa_pct_parceiro: Number(p.parceiro.taxa_transacao) >= 0 && String(p.parceiro.taxa_transacao ?? "") !== "" ? Number(p.parceiro.taxa_transacao) : null,
    status: "aberta", expira_em: agora + p.params.minutosCobranca * 60_000, id_clientes: null, created_at: agora,
  };
}

export type ContaCobranca = { valor: number; descontoCupom: number; pontosUsados: number; descontoPontos: number; valorPago: number; taxa: number; repasse: number; pontosGanhos: number; custoGateway: number; cashback: number; margem: number };
/** Tarifa da forma de pagamento (tabela da aba do gateway — @hc/nucleo/compartilhado/gateway; aqui só os números). */
export type TarifaForma = { custo_pct: number; custo_fixo: number; tarifa_pct: number; tarifa_fixa: number; cashback_pct: number };
/** Fecha a conta: cupom (do parceiro) primeiro, depois os pontos (até o teto); TARIFA da plataforma sobre o valor depois do cupom
 *  (a do parceiro, se ele tiver uma própria, senão a da tabela do gateway); CUSTO do gateway sobre o que passou pelo Pix; CASHBACK
 *  do cliente em pontos; repasse ao parceiro e a MARGEM do PetGo (tarifa − custo − cashback − desconto pago com pontos). */
export function calcularCobranca(p: { cobranca: any; cupom?: any | null; pontosPedidos?: number; saldo: number; params: ParametrosClube; tarifa?: TarifaForma | null; agora?: number }): ContaCobranca {
  const agora = p.agora ?? Date.now();
  const c = p.cobranca;
  if (!c || c.status !== "aberta") throw new Error(c?.status === "paga" ? "Esta cobrança já foi paga." : "Esta cobrança não está mais aberta. Peça uma nova ao parceiro.");
  if (Number(c.expira_em) < agora) throw new Error("Esta cobrança venceu. Peça uma nova ao parceiro.");
  const valor = centavos(Number(c.valor) || 0);
  let descontoCupom = 0;
  if (p.cupom) {
    if (situacaoCupom(p.cupom, agora) !== "disponivel") throw new Error("Este cupom não está disponível.");
    if (String(p.cupom.id_parceiros_indicacao) !== String(c.id_parceiros_indicacao)) throw new Error("Este cupom é de outro parceiro.");
    descontoCupom = p.cupom.desconto_tipo === "percentual" ? centavos(valor * (Number(p.cupom.desconto_valor) || 0) / 100) : p.cupom.desconto_tipo === "valor" ? Math.min(valor, Number(p.cupom.desconto_valor) || 0) : 0;
  }
  const aposCupom = centavos(valor - descontoCupom);
  const porReal = Math.max(1, p.params.pontosPorReal);
  const tetoReais = centavos(aposCupom * Math.max(0, Math.min(100, p.params.maxDescontoPontosPct)) / 100);
  const pedidos = Math.max(0, Math.floor(Number(p.pontosPedidos) || 0));
  if (pedidos > p.saldo) throw new Error(`Você tem ${p.saldo} pontos.`);
  const descontoPontos = Math.min(tetoReais, Math.floor(pedidos / porReal * 100) / 100);
  const pontosUsados = Math.round(descontoPontos * porReal);
  const valorPago = centavos(aposCupom - descontoPontos);
  if (valorPago < 0.01) throw new Error("O valor a pagar ficou zerado. Use menos pontos.");
  const tf = p.tarifa ?? null;
  const pctTarifa = c.taxa_pct_parceiro !== null && c.taxa_pct_parceiro !== undefined && c.taxa_pct_parceiro !== "" ? Number(c.taxa_pct_parceiro) : tf ? Number(tf.tarifa_pct) : Number(c.taxa_pct) || 0;
  const taxa = centavos(aposCupom * pctTarifa / 100 + (tf ? Number(tf.tarifa_fixa) || 0 : 0));
  const custoGateway = tf ? centavos(valorPago * (Number(tf.custo_pct) || 0) / 100 + (Number(tf.custo_fixo) || 0)) : 0;
  const cashback = tf ? centavos(valorPago * (Number(tf.cashback_pct) || 0) / 100) : 0;
  const pontosGanhos = tf ? Math.round(cashback * porReal) : Math.floor(valorPago);
  return { valor, descontoCupom, pontosUsados, descontoPontos, valorPago, taxa, repasse: centavos(aposCupom - taxa), pontosGanhos, custoGateway, cashback, margem: centavos(taxa - custoGateway - cashback - descontoPontos) };
}

// ── preços do Clube (módulo "clube" no catálogo) ───────────────────────────
export const MODULO_CLUBE_PADRAO = {
  codigo: "clube", nome: "Clube PetGo", tipo: "assinatura", recursos: [RECURSO_CLUBE], preco_mensal: 9.9, preco_anual: 99, dias_gratis: 0,
  produto_loja_mensal: "petgo360_clube_mensal", produto_loja_anual: "petgo360_clube_anual", ordem: 2, icone: "crown-outline",
  descricao: "Cupons de desconto todo mês nos parceiros PetGo da sua cidade (banho, consulta, ração...), pontos em dobro e cupons exclusivos.",
};
