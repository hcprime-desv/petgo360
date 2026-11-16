// GERADO por "npm run sync:app" no painel (projetos/petGo360) para o site público (site/petGo), a partir de
// shared/compartilhado/lojaCanais.ts — NÃO EDITAR AQUI: altere no painel e sincronize.

// LOJA NO SITE E NO WHATSAPP (dono, 15/11/2026): o tutor compra assinaturas, combos e serviços FORA do app — no site
// (/loja, com o mesmo login do app) ou no WhatsApp — pelo GATEWAY da plataforma (sem comissão das lojas Apple/Google). Dentro do
// app, os itens DIGITAIS continuam pela loja do celular (regra das lojas); o app só reconhece o que foi comprado em qualquer canal
// (multiplataforma). Quem cobra, ATIVA e dá os PONTOS é o back-end petall360 (pedidos em `pedidos_loja`). TS puro (sync:app → site;
// cópia no back-end em src/produtos/petgo360/loja/regras.ts).

export const COLECAO_PEDIDOS_LOJA = "pedidos_loja";
export const CANAIS_LOJA = ["site", "whatsapp"] as const;
export type CanalLoja = (typeof CANAIS_LOJA)[number];
export const STATUS_PEDIDO_LOJA = { pedido: "Pedido", aguardando_pagamento: "Aguardando o Pix", ativo: "Ativado", solicitado: "Com a equipe", erro: "Erro", expirado: "Expirado" } as const;
const DIA = 86_400_000;
const ms = (v: any): number => (typeof v === "number" ? v : typeof v?.toMillis === "function" ? v.toMillis() : v ? new Date(v).getTime() || 0 : 0);

/** Itens à venda na loja (catálogo `modulos_app` ativo, com preço; serviço "sob consulta" vira solicitação para a equipe). */
export const itensDaLoja = (catalogo: any[] | null | undefined) =>
  (catalogo ?? []).filter((m) => m?.status !== "inativo" && ["assinatura", "recurso", "servico"].includes(m?.tipo) && m?.modelo_venda !== "comissao")
    .sort((a, b) => (Number(a.ordem) || 99) - (Number(b.ordem) || 99));
export const precoItem = (m: any, periodo: "mensal" | "anual") => Number(periodo === "anual" ? m?.preco_anual : m?.preco_mensal) || 0;
export const sobConsultaItem = (m: any) => m?.tipo === "servico" && !precoItem(m, "mensal") && !precoItem(m, "anual");

/** O pedido do canal (site/WhatsApp) — conferido de novo no back-end. */
export function planejarPedidoLoja(p: { idClientes: string; modulo: any; periodo: "mensal" | "anual"; idPet?: string | null; canal: CanalLoja; agora?: number }) {
  const m = p.modulo;
  if (!p.idClientes) throw new Error("Entre com a sua conta do PetGo360.");
  if (!m || m.status === "inativo") throw new Error("Item indisponível.");
  if (!sobConsultaItem(m) && !precoItem(m, p.periodo)) throw new Error("Este item não tem preço para esse período.");
  if (m.tipo === "servico" && !p.idPet) throw new Error("Escolha o pet.");
  return {
    id_clientes: String(p.idClientes), codigo_modulo: String(m.codigo), id_modulos_app: String(m.id), nome_modulo: String(m.nome), tipo_modulo: m.tipo,
    periodo: p.periodo, id_pets: p.idPet ?? null, canal: p.canal, valor: sobConsultaItem(m) ? 0 : precoItem(m, p.periodo), status: "pedido", created_at: p.agora ?? Date.now(),
  };
}

/** Ativação depois do pagamento aprovado: estende recursos (assinatura/combos) ou o serviço por 30/365 dias (soma ao que falta). */
export function planejarAtivacaoLoja(cliente: any, modulo: any, periodo: "mensal" | "anual", agora = Date.now()) {
  const dias = periodo === "anual" ? 365 : 30;
  const recursos = { ...(cliente?.recursos_ate ?? {}) } as Record<string, number>;
  const servicos = { ...(cliente?.servicos_ate ?? {}) } as Record<string, number>;
  const atual = modulo.tipo === "servico" ? ms(servicos[modulo.codigo]) : Math.max(0, ...(modulo.recursos ?? []).map((r: string) => ms(recursos[r])));
  const fim = Math.max(agora, atual) + dias * DIA;
  if (modulo.tipo === "servico") servicos[modulo.codigo] = fim;
  else for (const r of modulo.recursos ?? []) recursos[r] = Math.max(ms(recursos[r]), fim);
  // serviço que INCLUI recursos digitais (ex.: plano de saúde com o Backup) — ativados junto, pelo mesmo prazo
  if (modulo.tipo === "servico") for (const r of modulo.inclui_recursos ?? []) recursos[r] = Math.max(ms(recursos[r]), fim);
  return { patchCliente: { recursos_ate: recursos, servicos_ate: servicos }, fim };
}
