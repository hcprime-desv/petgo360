// CÓPIA de packages/nucleo/src/compartilhado/gateway.ts (o site não usa @hc/* — repositório próprio; FORA de lib/compartilhado, que o sync:app limpa). Mudou lá, copie aqui.
// GATEWAY DE PAGAMENTO (dono, 15/11/2026) — contrato entre os PAINÉIS (aba "Pagamentos (gateway)" em Configurações →
// Parâmetros), as APLICAÇÕES e o back-end comum de pagamentos **bank-manager** (D:\desv\producao\hc\projetos\back-end\bank-manager:
// um processo por aplicação, como no cerbero360; atualizou o bank-manager → atualiza para todas: PetGo360, ViaMob360...).
// TS puro, sem import (o bank-manager tem uma CÓPIA em src/contrato.ts).
//
//  • `gateway_config/atual` (no tenant): o que NÃO é segredo — ambiente ativo (sandbox | producao), provedor, endereços, IDs e
//    as formas de pagamento. Os dois ambientes ficam configurados; trocar para produção é só mudar `ambiente`.
//  • SEGREDOS (chave da API, token do webhook) NUNCA ficam no banco (as regras são abertas): o painel grava um comando em
//    `gateway_comandos` e o bank-manager guarda o segredo no servidor e APAGA o comando. O painel mostra só o final (…1234).
//  • `gateway_status/atual`: sinal de vida do bank-manager (ambiente, provedor, segredos presentes, último erro).
//  • COBRANÇA: a aplicação cria `pagamentos` com `provedor: "gateway"` e `status: "pendente"` (valor, descrição, pagador); o
//    bank-manager cria a cobrança no gateway e devolve `copia_cola_pix`, `qr_code_pix`, `link_pagamento`, `id_gateway`; o
//    webhook do gateway marca `status: "aprovado" | "recusado" | "estornado"` (+ `pago_em`). Quem usa o pagamento (ex.: o Clube
//    do PetGo360) só ESCUTA o status.
//  • WEBHOOK SEM IP FIXO ("túnel" pelo Firebase, como o WhatsApp): o gateway chama o receptor público URL_RECEPTOR_WEBHOOK
//    (PHP no p2pcorp.com.br), que grava em `bankFila` (RAIZ); o bank-manager só ESCUTA a fila — nenhuma porta aberta.
//  • REPASSES aos recebedores (parceiros do PetGo, motoristas do ViaMob...): prazo por forma de pagamento (D+0, D+1, 7 dias...),
//    modo SOLICITADO (o recebedor pede no portal) ou AUTOMÁTICO (cai sozinho na conta dele), mínimo e tarifa do saque.
//    Conta corrente em `lancamentos_recebedores`; pedidos de saque em `saques_recebedores`; o envio do dinheiro é uma
//    `transferencias/{id}` que o bank-manager executa no gateway (Pix para a chave do recebedor).

export const COLECOES_GATEWAY = { config: "gateway_config", comandos: "gateway_comandos", status: "gateway_status" } as const;
export const ID_CONFIG_GATEWAY = "atual";
export const AMBIENTES_GATEWAY = [{ valor: "sandbox", rotulo: "Sandbox (teste — nada é cobrado de verdade)" }, { valor: "producao", rotulo: "Produção (cobra de verdade)" }] as const;
export type AmbienteGateway = "sandbox" | "producao";

export type ProvedorGateway = { id: string; nome: string; urlSandbox: string; urlProducao: string; site: string; formas: string[]; ajuda: string };
export const PROVEDORES_GATEWAY: ProvedorGateway[] = [
  { id: "simulado", nome: "Simulado (sem gateway — aprova sozinho)", urlSandbox: "", urlProducao: "", site: "", formas: ["pix"], ajuda: "Para desenvolvimento: o Pix é falso e aprova sozinho em alguns segundos. Nunca use em produção." },
  { id: "asaas", nome: "Asaas", urlSandbox: "https://sandbox.asaas.com/api/v3", urlProducao: "https://api.asaas.com/v3", site: "https://www.asaas.com", formas: ["pix", "cartao", "boleto"], ajuda: "Chave da API: Asaas → Integrações → Chave de API (uma no sandbox, outra na produção). Split por carteira (walletId) do parceiro." },
  { id: "mercadopago", nome: "Mercado Pago", urlSandbox: "https://api.mercadopago.com", urlProducao: "https://api.mercadopago.com", site: "https://www.mercadopago.com.br/developers", formas: ["pix", "cartao", "boleto"], ajuda: "Access token: Suas integrações → Credenciais (de TESTE no sandbox, de PRODUÇÃO na produção). O endereço é o mesmo." },
  { id: "depara", nome: "Outro gateway (DE-PARA configurável — sem código)", urlSandbox: "", urlProducao: "", site: "", formas: ["pix", "boleto"], ajuda: "Gateway universal: configure abaixo para onde vai cada campo nosso (fixo) na API do parceiro, onde ler a resposta e a tabela de status. Trocar de gateway = trocar o de-para. Cartão com captura no app usa adaptador próprio." },
  { id: "pagarme", nome: "Pagar.me", urlSandbox: "https://api.pagar.me/core/v5", urlProducao: "https://api.pagar.me/core/v5", site: "https://docs.pagar.me", formas: ["pix", "cartao", "boleto"], ajuda: "Chave secreta: sk_test_… no sandbox e sk_… na produção. O endereço é o mesmo." },
];
export const provedorGateway = (id: any) => PROVEDORES_GATEWAY.find((p) => p.id === id) ?? PROVEDORES_GATEWAY[0];

// ── TARIFAS (dono, 15/11/2026): por forma de pagamento — o que PAGAMOS ao banco/gateway (custo), a TARIFA que cobramos (do
// parceiro/lojista, sobre o valor) e o CASHBACK devolvido ao cliente (em pontos, dentro da plataforma). Margem = tarifa − custo −
// cashback. Ex.: Pix: custo 0,03%, tarifa 5%, cashback 2% → margem 2,97%.
export const FORMAS_PAGAMENTO = [
  { id: "pix", rotulo: "Pix" }, { id: "credito_vista", rotulo: "Cartão de crédito à vista" }, { id: "credito_parcelado", rotulo: "Cartão de crédito parcelado" },
  { id: "debito", rotulo: "Cartão de débito" }, { id: "boleto", rotulo: "Boleto" }, { id: "link", rotulo: "Link de pagamento" },
] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number]["id"];
export type Tarifa = { custo_pct: number; custo_fixo: number; tarifa_pct: number; tarifa_fixa: number; cashback_pct: number; ativo: boolean; prazo_repasse_dias: number };
export const PRAZOS_REPASSE = [{ valor: 0, rotulo: "No mesmo dia (D+0)" }, { valor: 1, rotulo: "D+1" }, { valor: 2, rotulo: "D+2" }, { valor: 7, rotulo: "7 dias" }, { valor: 14, rotulo: "14 dias" }, { valor: 30, rotulo: "30 dias" }] as const;
export const TARIFAS_PADRAO: Record<FormaPagamento, Tarifa> = {
  pix: { custo_pct: 0.03, custo_fixo: 0, tarifa_pct: 5, tarifa_fixa: 0, cashback_pct: 2, ativo: true, prazo_repasse_dias: 1 },
  credito_vista: { custo_pct: 3.49, custo_fixo: 0.49, tarifa_pct: 5, tarifa_fixa: 0, cashback_pct: 2, ativo: false, prazo_repasse_dias: 30 },
  credito_parcelado: { custo_pct: 4.99, custo_fixo: 0.49, tarifa_pct: 6, tarifa_fixa: 0, cashback_pct: 1, ativo: false, prazo_repasse_dias: 30 },
  debito: { custo_pct: 1.99, custo_fixo: 0.35, tarifa_pct: 5, tarifa_fixa: 0, cashback_pct: 2, ativo: false, prazo_repasse_dias: 2 },
  boleto: { custo_pct: 0, custo_fixo: 1.99, tarifa_pct: 5, tarifa_fixa: 0, cashback_pct: 1, ativo: false, prazo_repasse_dias: 2 },
  link: { custo_pct: 3.49, custo_fixo: 0.49, tarifa_pct: 6, tarifa_fixa: 0, cashback_pct: 1, ativo: false, prazo_repasse_dias: 30 },
};
const cent = (v: number) => Math.round(v * 100) / 100;
export type ContaTarifa = { valor: number; custo: number; tarifa: number; cashback: number; margem: number; repasse: number; margemPct: number };
/** Divide uma transação: custo do gateway (sobre o valor transacionado), tarifa e cashback; repasse = valor − tarifa. */
export function calcularTarifa(t: Tarifa, valor: number): ContaTarifa {
  const v = cent(Math.max(0, Number(valor) || 0));
  const custo = cent(v * (Number(t.custo_pct) || 0) / 100 + (Number(t.custo_fixo) || 0));
  const tarifa = cent(v * (Number(t.tarifa_pct) || 0) / 100 + (Number(t.tarifa_fixa) || 0));
  const cashback = cent(v * (Number(t.cashback_pct) || 0) / 100);
  const margem = cent(tarifa - custo - cashback);
  return { valor: v, custo, tarifa, cashback, margem, repasse: cent(v - tarifa), margemPct: v ? Math.round((margem / v) * 10000) / 100 : 0 };
}
export const tarifaDe = (c: { tarifas?: Partial<Record<string, Partial<Tarifa>>> } | null | undefined, forma: FormaPagamento): Tarifa => ({ ...TARIFAS_PADRAO[forma], ...((c?.tarifas ?? {})[forma] ?? {}) });

export type AmbienteConfig = { url_api: string; id_conta: string; chave_final: string; webhook_final: string; chave_pix: string };
export type ConfigGateway = {
  ambiente: AmbienteGateway; provedor: string; sandbox: AmbienteConfig; producao: AmbienteConfig;
  formas: { pix: boolean; cartao: boolean; boleto: boolean }; parcelas_max: number; juros_parcela_pct: number;
  pix_validade_min: number; split_parceiros: boolean; url_bank_manager: string; atualizado_em: number | null; atualizado_por: string;
  tarifas: Record<FormaPagamento, Tarifa>;
  de_para: DeParaGateway | null;
  repasse: ConfigRepasse;
};
export type ConfigRepasse = { modo: "solicitado" | "automatico"; minimo: number; tarifa_saque: number; id_gateway?: string }; // id_gateway: quem faz o Pix de saída
export const MODOS_REPASSE = [{ valor: "solicitado", rotulo: "Solicitado pelo recebedor (no portal)" }, { valor: "automatico", rotulo: "Automático para a conta do recebedor (quando libera)" }] as const;
const amb = (url = ""): AmbienteConfig => ({ url_api: url, id_conta: "", chave_final: "", webhook_final: "", chave_pix: "" });
export const CONFIG_GATEWAY_PADRAO: ConfigGateway = {
  ambiente: "sandbox", provedor: "simulado", sandbox: amb(), producao: amb(),
  formas: { pix: true, cartao: false, boleto: false }, parcelas_max: 1, juros_parcela_pct: 0, pix_validade_min: 30,
  split_parceiros: false, url_bank_manager: "", atualizado_em: null, atualizado_por: "", tarifas: TARIFAS_PADRAO, de_para: null,
  repasse: { modo: "solicitado", minimo: 20, tarifa_saque: 0 },
};
/** Config gravada (ou nada) → config completa com os padrões. */
export function lerConfigGateway(d: any): ConfigGateway {
  const c = d ?? {};
  return {
    ...CONFIG_GATEWAY_PADRAO, ...c,
    sandbox: { ...amb(provedorGateway(c.provedor).urlSandbox), ...(c.sandbox ?? {}) },
    producao: { ...amb(provedorGateway(c.provedor).urlProducao), ...(c.producao ?? {}) },
    formas: { ...CONFIG_GATEWAY_PADRAO.formas, ...(c.formas ?? {}) },
    repasse: { ...CONFIG_GATEWAY_PADRAO.repasse, ...(c.repasse ?? {}) },
    tarifas: Object.fromEntries(FORMAS_PAGAMENTO.map((f) => [f.id, { ...TARIFAS_PADRAO[f.id], ...((c.tarifas ?? {})[f.id] ?? {}) }])) as Record<FormaPagamento, Tarifa>,
  };
}
/** Simulado = sem gateway real (provedor "simulado" ou nada configurado). */
export const gatewaySimulado = (c: ConfigGateway | null | undefined) => !c || c.provedor === "simulado";
/** O que falta para o ambiente ativo funcionar (vazio = pronto). */
export function pendenciasGateway(c: ConfigGateway): string[] {
  if (gatewaySimulado(c)) return c.ambiente === "producao" ? ["Em produção, escolha um provedor real (o Simulado não cobra)."] : [];
  const a = c[c.ambiente];
  const p: string[] = [];
  if (!a.url_api) p.push(`Endereço da API (${c.ambiente}).`);
  if (!a.chave_final) p.push(`Chave da API (${c.ambiente}) — envie pelo botão "Salvar chave".`);
  if (!FORMAS_PAGAMENTO.some((f) => tarifaDe(c, f.id).ativo)) p.push("Ligue ao menos uma forma de pagamento.");
  return p;
}
/** Receptor PÚBLICO dos webhooks (PHP no p2pcorp.com.br → fila `bankFila` no Firebase; o bank-manager escuta a fila). */
export const URL_RECEPTOR_WEBHOOK = "https://hyperchannel.com.br/webhook/bankhook_p2p.php"; // web-hook novo no endereço antigo (16/11/2026): o tenant decide o projeto Firebase
export const COLECAO_FILA_WEBHOOK = "bankFila";
/** Endereço do webhook para cadastrar no painel do gateway (token na query quando o gateway não manda cabeçalho). */
/** Endereço do RECEPTOR dos webhooks de pagamento deste ambiente (dono, 16/11/2026): configurável em Meios de Pagamento →
 *  Situação (`gateway_config/atual.url_receptor_webhook`) — muda de servidor/domínio sem build; vazio = o padrão da P2P. */
export const urlReceptorWebhook = (atual?: any) => {
  const u = String(atual?.url_receptor_webhook ?? "").trim();
  return /^https:\/\/\S+$/i.test(u) ? u : URL_RECEPTOR_WEBHOOK;
};
export const urlWebhookGateway = (c: ConfigGateway & { id?: string }, tenant: string, receptor?: string) =>
  `${receptor || URL_RECEPTOR_WEBHOOK}?tenant=${encodeURIComponent(tenant)}&provedor=${encodeURIComponent(c.provedor)}${c.id ? `&gateway=${encodeURIComponent(c.id)}` : ""}`;
export const finalSegredo = (v: string) => (String(v ?? "").length >= 4 ? "…" + String(v).slice(-4) : "");

// ── VÁRIOS GATEWAYS E REGRAS DE COBRANÇA (dono, 16/11/2026) ─────────────────────────────────────────────────────────────
// Menu próprio "Pagamentos" (fora dos Parâmetros). Cada parceiro de pagamento é um CADASTRO em `gateway_cadastros/{id}` (provedor,
// sandbox/produção, formas, TARIFAS próprias — segredos no cofre do bank-manager por gateway). As REGRAS (em `gateway_config/atual`,
// campo `regras`) dizem qual gateway atende cada FORMA de pagamento e cada TIPO DE VENDA, com um gateway RESERVA se o principal não
// atender. Sem cadastros, a configuração antiga de `gateway_config/atual` vale como o gateway "principal" (nada se perde).
export const COLECAO_GATEWAYS = "gateway_cadastros";
export const ID_GATEWAY_PRINCIPAL = "principal";
export type GatewayCadastro = ConfigGateway & { id: string; nome: string; ativo: boolean; ordem: number };
export const TIPOS_VENDA = [
  { valor: "*", rotulo: "Todos os tipos de venda" },
  { valor: "assinatura", rotulo: "Assinaturas e combos" },
  { valor: "loja", rotulo: "Loja (site e WhatsApp)" },
  { valor: "clube", rotulo: "Clube" },
  { valor: "parceiro", rotulo: "Pagamento no parceiro" },
  { valor: "operadora", rotulo: "Serviços de operadoras (planos, seguros)" },
  { valor: "outros", rotulo: "Outros" },
] as const;
export type TipoVenda = (typeof TIPOS_VENDA)[number]["valor"];
/** Tipo de venda de um pagamento: o campo `tipo_venda` ou, sem ele, deduzido do `tipo` que a aplicação grava. */
export const tipoVendaDoPagamento = (p: any): string =>
  String(p?.tipo_venda || ({ compra_loja: "loja", pagamento_parceiro: "parceiro", assinatura: "assinatura", combo: "assinatura", clube: "clube", servico: "operadora", operadora: "operadora" } as Record<string, string>)[String(p?.tipo ?? "")] || "outros");
export type RegraGateway = { id: string; forma: FormaPagamento | "*"; tipo_venda: string; id_gateway: string; id_gateway_reserva: string; ativo: boolean };
/** Os gateways cadastrados (ativos ou não), em ordem; sem cadastro, o antigo `gateway_config/atual` vira o "principal". */
export function lerGateways(cadastros: any[] | null | undefined, configAtual: any): GatewayCadastro[] {
  const lista = (cadastros ?? []).filter((d) => d && d.id);
  if (!lista.length) {
    const c = lerConfigGateway(configAtual);
    return [{ ...c, id: ID_GATEWAY_PRINCIPAL, nome: provedorGateway(c.provedor).nome, ativo: true, ordem: 0 }];
  }
  return lista.map((d, i) => ({ ...lerConfigGateway(d), id: String(d.id), nome: String(d.nome || provedorGateway(d.provedor).nome), ativo: d.ativo !== false, ordem: Number(d.ordem ?? i) || 0 }))
    .sort((a, b) => a.ordem - b.ordem);
}
export const lerRegras = (atual: any): RegraGateway[] =>
  (Array.isArray(atual?.regras) ? atual.regras : []).filter((r: any) => r && r.id_gateway)
    .map((r: any, i: number) => ({ id: String(r.id || `r${i + 1}`), forma: r.forma || "*", tipo_venda: r.tipo_venda || "*", id_gateway: String(r.id_gateway), id_gateway_reserva: String(r.id_gateway_reserva || ""), ativo: r.ativo !== false }));
/** O gateway atende esta forma? (cadastro ativo e a tarifa da forma ligada) */
export const gatewayAtende = (g: GatewayCadastro | null | undefined, forma: FormaPagamento) => !!g && g.ativo && tarifaDe(g, forma).ativo && formaSuportada(g, forma);
/** O bank-manager sabe cobrar esta forma por este gateway? Simulado: todas. De-para: o Pix e as formas descritas em
 *  `de_para.formas`. Adaptadores fixos (Asaas, Mercado Pago, Pagar.me): só o Pix — outra forma, use o de-para. */
export function formaSuportada(g: { provedor: string; de_para?: DeParaGateway | null } | null | undefined, forma: FormaPagamento): boolean {
  if (!g) return false;
  if (g.provedor === "simulado") return true;
  if (g.provedor === "depara") return forma === "pix" || !!g.de_para?.formas?.[forma];
  return forma === "pix";
}
/** QUAL GATEWAY cobra: a regra mais específica (tipo de venda exato vale mais que "todos"; forma exata, mais que "todas") cujo
 *  gateway atende a forma; se não, a reserva dela; sem regra que sirva, o 1º gateway ativo (pela ordem) que atende a forma. */
export function escolherGateway(gateways: GatewayCadastro[], regras: RegraGateway[], forma: FormaPagamento, tipoVenda: string):
  { gateway: GatewayCadastro | null; reserva: GatewayCadastro | null; regra: RegraGateway | null; motivo: string } {
  const achar = (id: string) => gateways.find((g) => g.id === id) ?? null;
  const nota = (r: RegraGateway) => (r.tipo_venda === tipoVenda ? 2 : 0) + (r.forma === forma ? 1 : 0);
  const servem = regras.filter((r) => r.ativo && (r.forma === forma || r.forma === "*") && (r.tipo_venda === tipoVenda || r.tipo_venda === "*")).sort((a, b) => nota(b) - nota(a));
  for (const r of servem) {
    const g = achar(r.id_gateway), res = achar(r.id_gateway_reserva);
    if (gatewayAtende(g, forma)) return { gateway: g, reserva: gatewayAtende(res, forma) ? res : null, regra: r, motivo: "regra" };
    if (gatewayAtende(res, forma)) return { gateway: res, reserva: null, regra: r, motivo: "reserva" };
  }
  const g = gateways.find((x) => gatewayAtende(x, forma)) ?? null;
  return { gateway: g, reserva: null, regra: null, motivo: g ? "padrao" : `Nenhum gateway ativo atende ${FORMAS_PAGAMENTO.find((f) => f.id === forma)?.rotulo ?? forma}.` };
}
/** Tarifa que vale para a cobrança: a do gateway escolhido para a forma e o tipo de venda. */
export function tarifaDaCobranca(gateways: GatewayCadastro[], regras: RegraGateway[], forma: FormaPagamento, tipoVenda: string): Tarifa {
  const g = escolherGateway(gateways, regras, forma, tipoVenda).gateway;
  return g ? tarifaDe(g, forma) : TARIFAS_PADRAO[forma];
}
/** Gateway que faz os REPASSES (Pix de saída): o escolhido em `repasse.id_gateway` ou o que atende Pix. */
export const gatewayDoRepasse = (gateways: GatewayCadastro[], regras: RegraGateway[], repasse: ConfigRepasse | null | undefined) =>
  gateways.find((g) => g.id === repasse?.id_gateway && g.ativo) ?? escolherGateway(gateways, regras, "pix", "*").gateway;

// ── DE-PARA (gateway universal — dono, 15/11/2026) ─────────────────────────────────────────────────────────────────────
// Do NOSSO lado os dados são FIXOS; o de-para diz como cada gateway os recebe e devolve. Trocar de gateway = trocar o de-para
// (sem mexer em código). Marcadores nos textos: {{valor}} (reais), {{valor_centavos}}, {{descricao}}, {{id_externo}},
// {{vencimento}} (AAAA-MM-DD), {{expira_iso}}, {{validade_min}}, {{validade_s}}, {{pagador.nome}}, {{pagador.documento}},
// {{pagador.email}}, {{pagador.telefone}}, {{chave}} (chave da API), {{id_conta}} e a resposta de um passo anterior pelo nome
// ({{cliente.id}}). Texto que é SÓ um marcador mantém o tipo (número continua número).
export type PassoDePara = { nome: string; metodo: "GET" | "POST" | "PUT" | "PATCH"; caminho: string; corpo?: any; cabecalhos?: Record<string, string> };
export type StatusNosso = "pendente" | "aprovado" | "recusado" | "estornado" | "expirado";
/** Onde ler o retorno: id (obrigatório), Pix (copia e cola, QR), link de pagamento/checkout, boleto (linha e PDF), validade. */
export type SaidaDePara = { id: string; copia_cola?: string; qr_base64?: string; link?: string; expira?: string; linha_digitavel?: string; boleto_url?: string };
export type DeParaGateway = {
  nome: string;
  auth: { tipo: "bearer" | "header" | "basic" | "query"; nome?: string };     // header: nome do cabeçalho; query: nome do parâmetro
  criar: PassoDePara[];                                                          // chamadas em ordem para criar a cobrança Pix
  saida: SaidaDePara;                                                            // caminhos na resposta (passo.campo)
  /** QUALQUER MEIO DE PAGAMENTO (16/11/2026): envio e retorno de cada forma (crédito, débito, boleto, link...). A forma sem
   *  entrada aqui não é oferecida por este gateway; o Pix usa `formas.pix` se existir, senão `criar`/`saida` acima.
   *  Marcadores extras: {{forma}}, {{parcelas}}. */
  formas?: Partial<Record<FormaPagamento, { criar: PassoDePara[]; saida: SaidaDePara }>>;
  consultar?: { metodo: "GET" | "POST"; caminho: string; status: string };      // {{id}} = id no gateway; status = caminho
  status: Record<string, StatusNosso>;                                           // valor do gateway → o nosso
  webhook: { id: string; status: string; token_cabecalho?: string; token_query?: string };
  teste?: { metodo: "GET" | "POST"; caminho: string };
  /** Repasse (Pix de saída para o recebedor). Marcadores: {{valor}}, {{valor_centavos}}, {{chave_pix}}, {{chave_pix_tipo}},
   *  {{titular}}, {{documento_titular}}, {{banco}}, {{agencia}}, {{conta}}, {{id_externo}}. id = caminho do id na resposta. */
  transferir?: { metodo: "POST" | "PUT"; caminho: string; corpo?: any; id: string };
};

/** Lê um caminho "a.b.0.c" num objeto. */
export function lerCaminho(obj: any, caminho: string | undefined): any {
  if (!caminho) return undefined;
  return String(caminho).split(".").reduce((o, k) => (o === null || o === undefined ? undefined : o[k]), obj);
}
/** Preenche os marcadores {{...}} de um modelo (texto, objeto ou lista) com o contexto. */
export function preencher(modelo: any, ctx: Record<string, any>): any {
  if (typeof modelo === "string") {
    const so = /^\{\{\s*([\w.]+)\s*\}\}$/.exec(modelo);
    if (so) return lerCaminho(ctx, so[1]);
    return modelo.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, k) => { const v = lerCaminho(ctx, k); return v === undefined || v === null ? "" : String(v); });
  }
  if (Array.isArray(modelo)) return modelo.map((x) => preencher(x, ctx));
  if (modelo && typeof modelo === "object") {
    const o: Record<string, any> = {};
    for (const [k, v] of Object.entries(modelo)) { const p = preencher(v, ctx); if (p !== undefined && p !== "") o[k] = p; }
    return o;
  }
  return modelo;
}
/** O que falta num de-para (vazio = ok). */
export function problemasDePara(d: DeParaGateway | null | undefined): string[] {
  if (!d) return ["Escolha um modelo ou cole o de-para."];
  const p: string[] = [];
  if (!d.criar?.length) p.push("Falta ao menos um passo em \"criar\".");
  if (!d.saida?.id || !d.saida?.copia_cola) p.push("Diga onde ler o id e o Pix copia e cola (saida.id e saida.copia_cola).");
  for (const [f, x] of Object.entries(d.formas ?? {})) {
    if (!x?.criar?.length) p.push(`formas.${f}: falta ao menos um passo em "criar".`);
    if (!x?.saida?.id) p.push(`formas.${f}: diga onde ler o id (saida.id).`);
    if (f !== "pix" && x?.saida && !x.saida.link && !x.saida.linha_digitavel && !x.saida.boleto_url) p.push(`formas.${f}: diga onde ler o link de pagamento ou o boleto (saida.link / linha_digitavel / boleto_url).`);
  }
  if (!d.status || !Object.values(d.status).includes("aprovado")) p.push("A tabela de status precisa dizer qual valor é \"aprovado\".");
  if (!d.webhook?.id || !d.webhook?.status) p.push("Diga onde o webhook traz o id e o status.");
  return p;
}
/** Contexto fixo do nosso lado para uma cobrança. */
export function contextoCobranca(n: { idExterno: string; valor: number; descricao: string; validadeMin: number; pagador: { nome: string; documento: string; email: string; telefone: string }; forma?: string; parcelas?: number }, chave: string, idConta: string, agora = Date.now()) {
  const exp = new Date(agora + n.validadeMin * 60_000);
  return {
    forma: n.forma ?? "pix", parcelas: n.parcelas ?? 1,
    valor: Math.round(n.valor * 100) / 100, valor_centavos: Math.round(n.valor * 100), descricao: n.descricao, id_externo: n.idExterno,
    vencimento: new Date(agora + 86_400_000).toISOString().slice(0, 10), expira_iso: exp.toISOString(), validade_min: n.validadeMin, validade_s: n.validadeMin * 60,
    pagador: { ...n.pagador, documento: String(n.pagador.documento ?? "").replace(/\D/g, ""), telefone: String(n.pagador.telefone ?? "").replace(/\D/g, "") }, chave, id_conta: idConta,
  };
}

/** Modelos prontos (carregar e ajustar). PagaFácil = gateway FICTÍCIO de exemplo (para testar a tela e a carga). */
export const MODELOS_DE_PARA: Record<string, DeParaGateway> = {
  pagafacil: {
    nome: "PagaFácil Pagamentos (FICTÍCIO — exemplo)",
    auth: { tipo: "bearer" },
    criar: [{ nome: "cobranca", metodo: "POST", caminho: "/v1/pix/cobrancas", corpo: { referencia: "{{id_externo}}", valor_centavos: "{{valor_centavos}}", descricao: "{{descricao}}", expira_em: "{{expira_iso}}", pagador: { nome: "{{pagador.nome}}", cpf: "{{pagador.documento}}", email: "{{pagador.email}}" } } }],
    saida: { id: "cobranca.id", copia_cola: "cobranca.pix.copia_e_cola", qr_base64: "cobranca.pix.qr_png_base64", link: "cobranca.link", expira: "cobranca.expira_em" },
    consultar: { metodo: "GET", caminho: "/v1/pix/cobrancas/{{id}}", status: "situacao" },
    status: { PENDENTE: "pendente", PAGA: "aprovado", CANCELADA: "recusado", DEVOLVIDA: "estornado", EXPIRADA: "expirado" },
    webhook: { id: "cobranca.id", status: "cobranca.situacao", token_cabecalho: "x-pagafacil-token" },
    teste: { metodo: "GET", caminho: "/v1/conta" },
    transferir: { metodo: "POST", caminho: "/v1/pix/transferencias", corpo: { referencia: "{{id_externo}}", valor_centavos: "{{valor_centavos}}", chave: "{{chave_pix}}", tipo_chave: "{{chave_pix_tipo}}", favorecido: { nome: "{{titular}}", documento: "{{documento_titular}}" } }, id: "id" },
  },
  asaas: {
    nome: "Asaas (de-para)",
    auth: { tipo: "header", nome: "access_token" },
    criar: [
      { nome: "cliente", metodo: "POST", caminho: "/customers", corpo: { name: "{{pagador.nome}}", cpfCnpj: "{{pagador.documento}}", email: "{{pagador.email}}", externalReference: "{{id_externo}}" } },
      { nome: "pagamento", metodo: "POST", caminho: "/payments", corpo: { customer: "{{cliente.id}}", billingType: "PIX", value: "{{valor}}", dueDate: "{{vencimento}}", description: "{{descricao}}", externalReference: "{{id_externo}}" } },
      { nome: "qr", metodo: "GET", caminho: "/payments/{{pagamento.id}}/pixQrCode" },
    ],
    saida: { id: "pagamento.id", copia_cola: "qr.payload", qr_base64: "qr.encodedImage", link: "pagamento.invoiceUrl", expira: "qr.expirationDate" },
    consultar: { metodo: "GET", caminho: "/payments/{{id}}", status: "status" },
    status: { PENDING: "pendente", RECEIVED: "aprovado", CONFIRMED: "aprovado", RECEIVED_IN_CASH: "aprovado", OVERDUE: "expirado", REFUNDED: "estornado", PAYMENT_RECEIVED: "aprovado", PAYMENT_CONFIRMED: "aprovado", PAYMENT_OVERDUE: "expirado", PAYMENT_REFUNDED: "estornado" },
    webhook: { id: "payment.id", status: "event", token_cabecalho: "asaas-access-token" },
    teste: { metodo: "GET", caminho: "/finance/balance" },
    transferir: { metodo: "POST", caminho: "/transfers", corpo: { value: "{{valor}}", pixAddressKey: "{{chave_pix}}", pixAddressKeyType: "{{chave_pix_tipo_asaas}}", description: "Repasse {{id_externo}}" }, id: "id" },
    formas: {
      boleto: {
        criar: [
          { nome: "cliente", metodo: "POST", caminho: "/customers", corpo: { name: "{{pagador.nome}}", cpfCnpj: "{{pagador.documento}}", email: "{{pagador.email}}", externalReference: "{{id_externo}}" } },
          { nome: "pagamento", metodo: "POST", caminho: "/payments", corpo: { customer: "{{cliente.id}}", billingType: "BOLETO", value: "{{valor}}", dueDate: "{{vencimento}}", description: "{{descricao}}", externalReference: "{{id_externo}}" } },
          { nome: "linha", metodo: "GET", caminho: "/payments/{{pagamento.id}}/identificationField" },
        ],
        saida: { id: "pagamento.id", boleto_url: "pagamento.bankSlipUrl", linha_digitavel: "linha.identificationField", link: "pagamento.invoiceUrl" },
      },
      link: {
        criar: [
          { nome: "cliente", metodo: "POST", caminho: "/customers", corpo: { name: "{{pagador.nome}}", cpfCnpj: "{{pagador.documento}}", email: "{{pagador.email}}", externalReference: "{{id_externo}}" } },
          { nome: "pagamento", metodo: "POST", caminho: "/payments", corpo: { customer: "{{cliente.id}}", billingType: "UNDEFINED", value: "{{valor}}", dueDate: "{{vencimento}}", description: "{{descricao}}", externalReference: "{{id_externo}}" } },
        ],
        saida: { id: "pagamento.id", link: "pagamento.invoiceUrl" },
      },
    },
  },
  mercadopago: {
    nome: "Mercado Pago (de-para)",
    auth: { tipo: "bearer" },
    criar: [{ nome: "pagamento", metodo: "POST", caminho: "/v1/payments", cabecalhos: { "X-Idempotency-Key": "{{id_externo}}" }, corpo: { transaction_amount: "{{valor}}", description: "{{descricao}}", payment_method_id: "pix", external_reference: "{{id_externo}}", payer: { email: "{{pagador.email}}", first_name: "{{pagador.nome}}" } } }],
    saida: { id: "pagamento.id", copia_cola: "pagamento.point_of_interaction.transaction_data.qr_code", qr_base64: "pagamento.point_of_interaction.transaction_data.qr_code_base64", link: "pagamento.point_of_interaction.transaction_data.ticket_url", expira: "pagamento.date_of_expiration" },
    consultar: { metodo: "GET", caminho: "/v1/payments/{{id}}", status: "status" },
    status: { pending: "pendente", in_process: "pendente", approved: "aprovado", rejected: "recusado", cancelled: "recusado", refunded: "estornado" },
    webhook: { id: "data.id", status: "action", token_query: "token" },
    teste: { metodo: "GET", caminho: "/v1/payment_methods" },
  },
};

// ── CONTA CORRENTE DO RECEBEDOR (parceiro, motorista...) e SAQUES ─────────────────────────────────────────────────────────
export const COLECOES_REPASSE = { lancamentos: "lancamentos_recebedores", saques: "saques_recebedores", transferencias: "transferencias" } as const;
export type Lancamento = { id_recebedor: string; tipo: "credito" | "debito"; origem: "venda" | "saque" | "estorno_saque" | "ajuste" | "tarifa_saque"; valor: number; descricao: string; ref: string; liberar_em: number; created_at: number };
export type SaldoRecebedor = { disponivel: number; aLiberar: number; proximaLiberacao: number | null; totalVendido: number; totalSacado: number };
const c2 = (v: number) => Math.round(v * 100) / 100;
export function saldoRecebedor(lancamentos: any[] | null | undefined, agora = Date.now()): SaldoRecebedor {
  let disponivel = 0, aLiberar = 0, totalVendido = 0, totalSacado = 0; let proxima: number | null = null;
  for (const l of lancamentos ?? []) {
    const v = Number(l.valor) || 0;
    if (l.tipo === "credito") {
      if (l.origem === "venda") totalVendido += v;
      if (Number(l.liberar_em) <= agora) disponivel += v; else { aLiberar += v; proxima = proxima === null ? Number(l.liberar_em) : Math.min(proxima, Number(l.liberar_em)); }
    } else { disponivel -= v; if (l.origem === "saque") totalSacado += v; }
  }
  return { disponivel: c2(disponivel), aLiberar: c2(aLiberar), proximaLiberacao: proxima, totalVendido: c2(totalVendido), totalSacado: c2(totalSacado) };
}
export type ContaBancaria = { tipo: "pix" | "conta"; chave_pix: string; chave_pix_tipo: string; banco: string; agencia: string; conta: string; titular: string; documento_titular: string };
export const TIPOS_CHAVE_PIX = [{ valor: "cpf", rotulo: "CPF" }, { valor: "cnpj", rotulo: "CNPJ" }, { valor: "email", rotulo: "E-mail" }, { valor: "telefone", rotulo: "Telefone" }, { valor: "aleatoria", rotulo: "Chave aleatória" }] as const;
export function problemaContaBancaria(c: Partial<ContaBancaria> | null | undefined): string | null {
  if (!c) return "Cadastre a conta para receber.";
  if (!String(c.titular ?? "").trim() || String(c.documento_titular ?? "").replace(/\D/g, "").length < 11) return "Informe o titular e o CPF/CNPJ do titular.";
  if ((c.tipo ?? "pix") === "pix") return String(c.chave_pix ?? "").trim() ? null : "Informe a chave Pix.";
  return c.banco && c.agencia && c.conta ? null : "Informe banco, agência e conta.";
}
/** Pedido de saque: confere saldo, mínimo e conta; devolve o débito, a tarifa e a transferência. */
export function planejarSaque(p: { idRecebedor: string; valor: number; lancamentos: any[]; conta: Partial<ContaBancaria> | null; repasse: ConfigRepasse; idSaque: string; agora?: number }) {
  const agora = p.agora ?? Date.now();
  const valor = c2(Number(p.valor) || 0);
  const s = saldoRecebedor(p.lancamentos, agora);
  const pc = problemaContaBancaria(p.conta);
  if (pc) throw new Error(pc);
  if (valor < Math.max(0.01, p.repasse.minimo)) throw new Error(`O mínimo para repasse é R$ ${p.repasse.minimo.toFixed(2).replace(".", ",")}.`);
  const tarifa = c2(Number(p.repasse.tarifa_saque) || 0);
  if (valor + tarifa > s.disponivel + 0.001) throw new Error(`Saldo disponível: R$ ${s.disponivel.toFixed(2).replace(".", ",")}${tarifa ? ` (tarifa do repasse R$ ${tarifa.toFixed(2).replace(".", ",")})` : ""}.`);
  const deb = (origem: Lancamento["origem"], v: number, d: string) => ({ id_recebedor: p.idRecebedor, tipo: "debito" as const, origem, valor: v, descricao: d, ref: p.idSaque, liberar_em: agora, created_at: agora });
  return {
    lancamentos: [deb("saque", valor, "Repasse para a sua conta"), ...(tarifa ? [deb("tarifa_saque", tarifa, "Tarifa do repasse")] : [])],
    transferencia: { id_recebedor: p.idRecebedor, id_saque: p.idSaque, valor, destino: p.conta, status: "pendente", created_at: agora },
  };
}

