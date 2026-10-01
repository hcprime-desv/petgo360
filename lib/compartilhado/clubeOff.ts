// GERADO por "npm run sync:app" no painel (projetos/petGo360) para o site público (site/petGo), a partir de
// shared/compartilhado/clubeOff.ts — NÃO EDITAR AQUI: altere no painel e sincronize.

// ═══ COMPARTILHADO painel ⇄ app do parceiro ═══════════════════════════════
import { PREFIXO_QR } from "./qrcodes";
import type { Escrita, Plano, Problema } from "./escritas";

// ── status e transições (doc 05) ─────────────────────────────────────────
export const STATUS_COMPRA_CUPOM_OFF = ["pendente", "paga", "cancelada", "estornada", "expirada"] as const;
export const STATUS_CAMPANHA_CUPOM_OFF = ["rascunho", "ativa", "pausada", "esgotada", "encerrada"] as const;
export const STATUS_CUPOM_OFF = ["disponivel", "reservado", "adquirido", "utilizado", "expirado", "cancelado"] as const;
export const TIPOS_DESCONTO = ["percentual", "valor", "preco_fixo"] as const;
export const LIMITE_POR = ["cliente", "cpf", "pet"] as const;
type S<T extends readonly string[]> = T[number];

export const ROTULOS_STATUS_COMPRA_OFF: Record<string, string> = { pendente: "Aguardando pagamento", paga: "Paga", cancelada: "Cancelada", estornada: "Estornada", expirada: "Expirada" };
export const ROTULOS_STATUS_CAMPANHA_OFF: Record<string, string> = { rascunho: "Rascunho", ativa: "Ativa", pausada: "Pausada", esgotada: "Esgotada", encerrada: "Encerrada" };
export const ROTULOS_STATUS_CUPOM_OFF: Record<string, string> = { disponivel: "Disponível", reservado: "Reservado", adquirido: "Adquirido", utilizado: "Utilizado", expirado: "Expirado", cancelado: "Cancelado" };
export const ROTULOS_TIPO_DESCONTO: Record<string, string> = { percentual: "Percentual (%)", valor: "Valor (R$)", preco_fixo: "Preço fechado (R$)" };

export const TRANSICOES_COMPRAS_CUPONS_OFF: Record<S<typeof STATUS_COMPRA_CUPOM_OFF>, readonly S<typeof STATUS_COMPRA_CUPOM_OFF>[]> = {
  pendente: ["paga", "cancelada"],
  paga: ["estornada", "expirada"],
  cancelada: [],
  estornada: [],
  expirada: [],
};

export const TRANSICOES_CAMPANHAS_CUPONS_OFF: Record<S<typeof STATUS_CAMPANHA_CUPOM_OFF>, readonly S<typeof STATUS_CAMPANHA_CUPOM_OFF>[]> = {
  rascunho: ["ativa", "encerrada"],
  ativa: ["pausada", "esgotada", "encerrada"],
  pausada: ["ativa", "encerrada"],
  esgotada: ["encerrada"],
  encerrada: [],
};

// reservado: cliente escolheu e está pagando o valor_aquisicao (volta a
// disponivel se reservado_ate vencer).
export const TRANSICOES_CUPONS_OFF: Record<S<typeof STATUS_CUPOM_OFF>, readonly S<typeof STATUS_CUPOM_OFF>[]> = {
  disponivel: ["reservado", "adquirido", "expirado", "cancelado"],
  reservado: ["adquirido", "disponivel", "expirado"],
  adquirido: ["utilizado", "expirado", "cancelado"],
  utilizado: [],
  expirado: [],
  cancelado: [],
};

const podeTransitar = (mapa: Record<string, readonly string[]>, de: string, para: string) => de === para || (mapa[de] ?? []).includes(para);

// Clube OFF — PLANEJADORES puros (não gravam; o painel aplica por
// aplicarEscritas.ts, o app por features/parceiro/servico.ts).
//
// Compra de pacote: o parceiro compra da plataforma; só vira crédito
// quando paga. Confirmar = pagamento aprovado + transação de receita da
// plataforma + crédito de cupons com validade (pago_em + validade do pacote).
//
// Campanha: nasce em rascunho e só ATIVA por aqui — ativar gera os N cupons
// (código único, validade = o que vencer primeiro entre a campanha e a
// compra) e desconta do saldo da compra. Encerrar cancela os cupons ainda
// não adquiridos (os que já estão na carteira de clientes continuam
// valendo até vencer). O saldo usado não volta para a compra.

const paraDate = (v: any): Date => (typeof v?.toDate === "function" ? v.toDate() : v instanceof Date ? v : new Date(v));

function exigir(mapa: any, de: string, para: string, rotulo: string) {
  if (de === para || !podeTransitar(mapa, de, para)) throw new Error(`Não é possível "${rotulo}" com status "${de}".`);
}

export function planejarConfirmacaoCompra(
  compra: Record<string, any>,
  // `cobranca`: pagamento feito pelo checkout (pagamentos.ts) — o que foi
  // cobrado (com juros, se parcelou) e o custo do gateway, que numa venda da
  // própria plataforma é dela.
  ctx: { pacote: { validade_dias: number; nome?: string } | null; pagamentoPendente?: { id: string; status: string } | null; agora?: Date; forma?: string; cobranca?: { valorCobrado: number; custoGateway: number; taxaAntecipacao: number; juros: number; forma: string; parcelas: number; codigo?: string | null } | null },
): Plano {
  exigir(TRANSICOES_COMPRAS_CUPONS_OFF, compra.status, "paga", "Confirmar pagamento");
  if (!ctx.pacote) throw new Error("Pacote da compra não encontrado.");
  const agora = ctx.agora ?? new Date();
  const expira = new Date(agora.getTime() + ctx.pacote.validade_dias * 86400000);
  expira.setHours(23, 59, 0, 0);
  const escritas: Escrita[] = [];
  let idPagamento: string;
  if (ctx.pagamentoPendente && ["pendente", "processando"].includes(ctx.pagamentoPendente.status)) {
    idPagamento = ctx.pagamentoPendente.id;
    escritas.push({ tipo: "atualizar", colecao: "pagamentos", id: idPagamento, dados: { status: "aprovado", pago_em: agora } });
  } else {
    idPagamento = "$ref:pagamento";
    escritas.push({
      tipo: "criar", colecao: "pagamentos", ref: "pagamento",
      dados: { id_compras_cupons_off: String(compra.id), id_empresas: compra.id_empresas, id_reservas: null, id_cupons_off: null, id_assinaturas: null, id_clientes: null, provedor: "manual", forma_pagamento: ctx.forma || "boleto", parcelas: 1, valor: compra.valor_total, status: "aprovado", pago_em: agora },
    });
  }
  escritas.push({
    tipo: "criar", colecao: "transacoes",
    dados: ctx.cobranca
      ? {
        id_pagamentos: idPagamento, id_reservas: null, id_empresas: compra.id_empresas, id_clientes: null, tipo: "compra_cupom_off",
        valor_bruto: ctx.cobranca.valorCobrado, valor_taxa_gateway: ctx.cobranca.custoGateway, valor_taxa_antecipacao: ctx.cobranca.taxaAntecipacao, valor_juros: ctx.cobranca.juros,
        valor_comissao: 0, valor_desconto: 0, valor_liquido_parceiro: 0, forma_pagamento: ctx.cobranca.forma, parcelas: ctx.cobranca.parcelas, codigo_externo: ctx.cobranca.codigo ?? null, status: "confirmada",
      }
      : { id_pagamentos: idPagamento, id_reservas: null, id_empresas: compra.id_empresas, id_clientes: null, tipo: "compra_cupom_off", valor_bruto: compra.valor_total, valor_taxa_gateway: 0, valor_comissao: 0, valor_desconto: 0, valor_liquido_parceiro: 0, status: "confirmada" },
  });
  // A compra por último: usa o id do pagamento criado acima.
  escritas.push({
    tipo: "atualizar", colecao: "compras_cupons_off", id: String(compra.id),
    dados: { status: "paga", pago_em: agora, expira_em: expira, id_pagamentos: idPagamento, quantidade_disponivel: compra.quantidade_cupons, quantidade_utilizada: 0 },
  });
  return { patch: {}, escritas, descricao: `Pagamento confirmado: compra OFF #${compra.id} (${compra.quantidade_cupons} cupons, válidos até ${expira.toLocaleDateString("pt-BR")})` };
}

export function planejarCancelamentoCompra(compra: Record<string, any>): Plano {
  exigir(TRANSICOES_COMPRAS_CUPONS_OFF, compra.status, "cancelada", "Cancelar");
  return { patch: { status: "cancelada" }, escritas: [], descricao: `Compra OFF #${compra.id} cancelada` };
}

export type AcaoCampanha = "ativar" | "pausar" | "encerrar";
export const ROTULO_ACAO_CAMPANHA: Record<AcaoCampanha, string> = { ativar: "Ativar", pausar: "Pausar", encerrar: "Encerrar" };
const DESTINO: Record<AcaoCampanha, string> = { ativar: "ativa", pausar: "pausada", encerrar: "encerrada" };

export function planejarCampanha(
  acao: AcaoCampanha,
  campanha: Record<string, any>,
  ctx: { compra?: Record<string, any> | null; codigos?: string[]; cuponsDisponiveis?: string[]; agora?: Date } = {},
): Plano {
  exigir(TRANSICOES_CAMPANHAS_CUPONS_OFF, campanha.status, DESTINO[acao], ROTULO_ACAO_CAMPANHA[acao]);
  const agora = ctx.agora ?? new Date();
  const escritas: Escrita[] = [];
  const patch: Record<string, any> = { status: DESTINO[acao] };

  // Reativar uma pausada não gera cupons de novo.
  if (acao === "ativar" && campanha.status === "rascunho") {
    const compra = ctx.compra;
    if (!compra) throw new Error("Compra de pacote OFF da campanha não encontrada.");
    if (compra.status !== "paga") throw new Error("A compra de pacote OFF ainda não foi paga.");
    const validadeCompra = paraDate(compra.expira_em);
    if (validadeCompra <= agora) throw new Error("Os cupons desta compra já venceram.");
    if (paraDate(campanha.fim_em) <= agora) throw new Error("O fim da campanha já passou.");
    const qtd = Number(campanha.quantidade) || 0;
    if (qtd > (Number(compra.quantidade_disponivel) || 0)) throw new Error(`Saldo insuficiente na compra: ${compra.quantidade_disponivel} cupom(ns) disponível(is), campanha pede ${qtd}.`);
    const codigos = ctx.codigos || [];
    if (codigos.length < qtd || new Set(codigos).size < qtd) throw new Error("Códigos insuficientes ou repetidos para gerar os cupons.");
    const expira = paraDate(campanha.fim_em) < validadeCompra ? paraDate(campanha.fim_em) : validadeCompra;
    for (let i = 0; i < qtd; i++) {
      escritas.push({
        tipo: "criar", colecao: "cupons_off",
        dados: { id_campanhas_cupons_off: String(campanha.id), id_empresas: campanha.id_empresas, id_clientes: null, id_pets: null, id_reservas: null, id_pagamentos: null, codigo: codigos[i], qr_code: `${PREFIXO_QR.cupom_off}${codigos[i]}`, reservado_ate: null, adquirido_em: null, utilizado_em: null, expira_em: expira, status: "disponivel" },
      });
    }
    escritas.push({ tipo: "atualizar", colecao: "compras_cupons_off", id: String(compra.id), dados: { quantidade_disponivel: (Number(compra.quantidade_disponivel) || 0) - qtd } });
    patch.quantidade_disponivel = qtd;
  }
  if (acao === "encerrar") {
    for (const id of ctx.cuponsDisponiveis || []) escritas.push({ tipo: "atualizar", colecao: "cupons_off", id, dados: { status: "cancelado" } });
    patch.quantidade_disponivel = 0;
  }
  const extra = acao === "ativar" && campanha.status === "rascunho" ? ` — ${campanha.quantidade} cupom(ns) gerado(s)` : acao === "encerrar" ? ` — ${(ctx.cuponsDisponiveis || []).length} cupom(ns) não adquirido(s) cancelado(s)` : "";
  return { patch, escritas, descricao: `${ROTULO_ACAO_CAMPANHA[acao]} campanha "${campanha.nome}"${extra}` };
}

// Código de cupom: 8 caracteres de um alfabeto sem ambíguos (0/O, 1/I),
// aleatório criptográfico — antifraude (doc 05), nunca sequencial.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function gerarCodigosCupom(qtd: number, prefixo = "OFF", aleatorio: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string[] {
  const set = new Set<string>();
  while (set.size < qtd) {
    const bytes = aleatorio(8);
    set.add(`${prefixo}-${Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("")}`);
  }
  return [...set];
}

// ── campanha montada pelo parceiro ───────────────────────────────────────
// Regras entre campos da campanha (o schema do painel usa as mesmas).
export function problemasCampanha(d: Record<string, any>): Problema[] {
  const p: Problema[] = [];
  if (d.tipo_desconto === "preco_fixo" && (d.preco_promocional == null || d.preco_promocional === "")) p.push({ campo: "preco_promocional", mensagem: "Informe o preço promocional" });
  if (d.tipo_desconto === "percentual" && Number(d.valor_desconto) > 100) p.push({ campo: "valor_desconto", mensagem: "Percentual máximo 100" });
  return p;
}

// Texto curto do benefício da campanha.
export function beneficioCampanha(c: Record<string, any>): string {
  const brl = (v: any) => `R$ ${(Number(v) || 0).toFixed(2).replace(".", ",")}`;
  return c?.tipo_desconto === "preco_fixo" ? `por ${brl(c.preco_promocional)}` : c?.tipo_desconto === "percentual" ? `${Number(c.valor_desconto) || 0}% OFF` : `${brl(c?.valor_desconto)} OFF`;
}

// Rascunho de campanha criado pelo parceiro (app/portal): confere o saldo da
// compra e o serviço, e devolve o documento pronto — sempre em rascunho e
// sem cupons (só "Ativar" gera).
export function planejarRascunhoCampanha(p: {
  idEmpresa: string;
  compra: Record<string, any> | null;
  servicoParceiro: Record<string, any> | null;
  dados: {
    nome: string; descricao?: string; tipo_desconto: string; valor_desconto?: any; preco_promocional?: any; valor_aquisicao?: any;
    quantidade: any; inicio_em: Date; fim_em: Date; canais?: string[]; limite_por_cliente?: any; limite_por?: string; destaque?: boolean;
  };
  agora?: Date;
}): Record<string, any> {
  const agora = p.agora ?? new Date();
  const d = p.dados;
  const { compra, servicoParceiro: sp } = p;
  if (!compra || String(compra.id_empresas) !== String(p.idEmpresa)) throw new Error("Escolha uma compra de pacote OFF da sua empresa.");
  if (compra.status !== "paga") throw new Error("A compra de pacote OFF ainda não foi paga.");
  if (compra.expira_em && paraDate(compra.expira_em) <= agora) throw new Error("Os cupons desta compra já venceram.");
  if (!sp || String(sp.id_empresas) !== String(p.idEmpresa)) throw new Error("Escolha um serviço da sua empresa.");
  if (sp.status !== "ativo") throw new Error("O serviço escolhido está inativo.");
  if (sp.aceita_clube_off === false) throw new Error("Este serviço não aceita Clube OFF.");
  if (String(d.nome ?? "").trim().length < 2) throw new Error("Informe o nome da campanha.");
  if (!(TIPOS_DESCONTO as readonly string[]).includes(d.tipo_desconto)) throw new Error("Escolha a mecânica do desconto.");
  const qtd = Number(d.quantidade);
  if (!Number.isInteger(qtd) || qtd < 1) throw new Error("Informe quantos cupons gerar.");
  if (qtd > (Number(compra.quantidade_disponivel) || 0)) throw new Error(`Saldo insuficiente na compra: ${compra.quantidade_disponivel} cupom(ns) disponível(is).`);
  if (!(d.inicio_em instanceof Date) || isNaN(d.inicio_em.getTime()) || !(d.fim_em instanceof Date) || isNaN(d.fim_em.getTime())) throw new Error("Informe início e fim da campanha.");
  if (d.fim_em <= d.inicio_em) throw new Error("O fim deve ser depois do início.");
  if (d.fim_em <= agora) throw new Error("O fim da campanha já passou.");
  const canais = d.canais?.length ? d.canais : ["site", "app", "whatsapp"];
  const valorDesconto = d.tipo_desconto === "preco_fixo" ? 0 : Number(d.valor_desconto) || 0;
  if (d.tipo_desconto !== "preco_fixo" && valorDesconto <= 0) throw new Error("Informe o desconto.");
  if (d.tipo_desconto === "preco_fixo" && !(d.preco_promocional !== "" && d.preco_promocional != null && Number(d.preco_promocional) >= 0)) throw new Error("Informe o preço promocional");
  const registro = {
    id_empresas: String(p.idEmpresa), id_unidades: sp.id_unidades ? String(sp.id_unidades) : null,
    id_compras_cupons_off: String(compra.id), id_servicos: String(sp.id_servicos), id_servicos_parceiros: String(sp.id),
    nome: String(d.nome).trim(), descricao: String(d.descricao ?? "").trim(),
    tipo_desconto: d.tipo_desconto, valor_desconto: valorDesconto,
    preco_promocional: d.tipo_desconto === "preco_fixo" ? Number(d.preco_promocional) : null,
    valor_aquisicao: Number(d.valor_aquisicao) || 0,
    quantidade: qtd, quantidade_disponivel: 0,
    inicio_em: d.inicio_em, fim_em: d.fim_em, canais,
    limite_por_cliente: Math.max(1, Number(d.limite_por_cliente) || 1), limite_por: d.limite_por || "cliente",
    destaque: !!d.destaque, status: "rascunho",
  };
  const problemas = problemasCampanha(registro);
  if (problemas.length) throw new Error(problemas[0].mensagem);
  return registro;
}

// Ações da campanha por status (mesmas do painel).
export function acoesCampanha(status: string): AcaoCampanha[] {
  const a: AcaoCampanha[] = [];
  if (status === "rascunho" || status === "pausada") a.push("ativar");
  if (status === "ativa") a.push("pausar");
  if (["ativa", "pausada", "esgotada", "rascunho"].includes(status)) a.push("encerrar");
  return a;
}

// ── o TUTOR pega um cupom OFF ────────────────────────────────────────────
// Campanhas que o app mostra: ativas, publicadas no app, no período e com saldo.
export function campanhasNoApp(campanhas: any[], agora = new Date()): any[] {
  const t = agora.getTime();
  return campanhas.filter((c) => c.status === "ativa" && (c.canais ?? []).includes("app") && paraDate(c.inicio_em).getTime() <= t && paraDate(c.fim_em).getTime() > t && Number(c.quantidade_disponivel) > 0);
}
// Pegar (grátis): o cupom sai de "disponível" para "adquirido" pelo tutor e a
// campanha perde uma unidade (esgota no zero). Cupom com valor de aquisição
// exige pagamento — fica para o backend.
export function planejarAquisicaoCupomOff(p: {
  campanha: Record<string, any>; cupom: Record<string, any> | null; cliente: Record<string, any>; idPet?: string | null;
  meusDaCampanha: any[]; // cupons desta campanha que o tutor já tem (qualquer status, fora cancelado)
  agora?: Date;
}): { patchCupom: Record<string, any>; patchCampanha: Record<string, any> } {
  const agora = p.agora ?? new Date();
  const c = p.campanha;
  if (!campanhasNoApp([c], agora).length) throw new Error("Esta campanha não está mais disponível.");
  if (Number(c.valor_aquisicao) > 0) throw new Error("Este cupom é pago — a compra pelo app chega em breve. Peça pelo WhatsApp do PetGo.");
  const limite = Math.max(1, Number(c.limite_por_cliente) || 1);
  const contam = p.meusDaCampanha.filter((x) => x.status !== "cancelado" && (c.limite_por !== "pet" || !p.idPet || String(x.id_pets) === String(p.idPet)));
  if (contam.length >= limite) throw new Error(limite === 1 ? "Você já pegou este cupom." : `Limite de ${limite} cupons por ${c.limite_por === "pet" ? "pet" : "cliente"}.`);
  if (c.limite_por === "pet" && !p.idPet) throw new Error("Escolha para qual pet é o cupom.");
  if (!p.cupom || p.cupom.status !== "disponivel" || String(p.cupom.id_campanhas_cupons_off) !== String(c.id)) throw new Error("Os cupons desta campanha acabaram.");
  const restante = Math.max(0, (Number(c.quantidade_disponivel) || 0) - 1);
  return {
    patchCupom: { status: "adquirido", id_clientes: String(p.cliente.id), id_pets: p.idPet ?? null, adquirido_em: agora },
    patchCampanha: { quantidade_disponivel: restante, ...(restante === 0 ? { status: "esgotada" } : {}) },
  };
}
export const cuponsVisiveisDoTutor = (cupons: any[]) => cupons.filter((x) => ["adquirido", "utilizado", "expirado"].includes(x.status));
