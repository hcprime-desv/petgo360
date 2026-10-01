// GERADO por "npm run sync:app" no painel (projetos/petGo360) para o site público (site/petGo), a partir de
// shared/compartilhado/escritas.ts — NÃO EDITAR AQUI: altere no painel e sincronize.

// ═══ COMPARTILHADO painel ⇄ app do parceiro ═══════════════════════════════
// Tipos das escritas que os planejadores devolvem (o painel grava por
// shared/function/aplicarEscritas.ts; o app, por features/parceiro/servico.ts).
// Só tipos — sem Firebase — para os planejadores continuarem testáveis.

// `atualizar.id` também aceita "$ref:<nome>" (documento criado antes no mesmo plano).
// `ajustar_slot` com deltaDisponivel < 0 segura a vaga: o executor RECUSA se o
// horário não tem mais vaga (transação).
export type Escrita =
  | { tipo: "atualizar"; colecao: string; id: string; dados: Record<string, any> }
  // `vincular`: depois de criar, grava o id novo num campo de outro documento
  // (ex.: reembolsos.id_transacoes ← id da transação de estorno criada).
  // `ref`: nome para outras escritas usarem o id novo — qualquer valor
  // "$ref:<nome>" em `dados` de uma escrita posterior vira esse id.
  | { tipo: "criar"; colecao: string; dados: Record<string, any>; vincular?: { colecao: string; id: string; campo: string }; ref?: string }
  | { tipo: "ajustar_slot"; id: string; deltaReservada: number; deltaDisponivel: number };

export type Plano = { patch: Record<string, any>; escritas: Escrita[]; descricao: string };

// Problema de validação apontado por uma regra compartilhada (o painel vira
// erro do campo no formulário; o app mostra a mensagem).
export type Problema = { campo: string; mensagem: string };
