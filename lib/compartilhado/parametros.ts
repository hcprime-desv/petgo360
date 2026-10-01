// GERADO por "npm run sync:app" no painel (projetos/petGo360) para o site público (site/petGo), a partir de
// shared/compartilhado/parametros.ts — NÃO EDITAR AQUI: altere no painel e sincronize.

// ═══ COMPARTILHADO painel ⇄ app do parceiro ═══════════════════════════════
// Ver reservas.ts para as regras desta pasta. O painel edita os valores em
// Sistema → Configurações; painel e app leem a mesma lista e a mesma cascata.
// Parâmetros da plataforma (coleção `configuracoes`). Lista FECHADA de
// chaves conhecidas — a tela só oferece estas, para não nascer parâmetro
// com nome digitado errado que ninguém lê. Escopo em cascata: unidade >
// empresa > plataforma (id_empresas/id_unidades null); sem nenhum
// registro, vale o `padrao` daqui.

export type ParametroConhecido = {
  grupo: string;
  chave: string;
  rotulo: string;
  descricao: string;
  tipo: "numero";
  padrao: number;
  unidade: string;
  min?: number;
  max?: number;
};

export const PARAMETROS_PLATAFORMA: ParametroConhecido[] = [
  { grupo: "checkout", chave: "minutos_bloqueio_disponibilidade", rotulo: "Tempo que o horário fica preso no checkout", descricao: "Enquanto o cliente paga, o horário fica reservado para ele; depois volta para a agenda.", tipo: "numero", padrao: 15, unidade: "minutos", min: 5, max: 120 },
  { grupo: "checkout", chave: "minutos_sessao_checkout", rotulo: "Validade do link de checkout", descricao: "Link enviado pelo WhatsApp para pagar no app/site.", tipo: "numero", padrao: 30, unidade: "minutos", min: 5, max: 1440 },
  { grupo: "financeiro", chave: "dias_repasse", rotulo: "Prazo do repasse ao parceiro", descricao: "Dias entre o fim do período conciliado e o pagamento ao parceiro.", tipo: "numero", padrao: 7, unidade: "dias", min: 0, max: 90 },
  // Pagamentos: usados pelo checkout (hoje com o gateway simulado — ver
  // shared/compartilhado/pagamentos.ts). Por empresa = condição negociada com o parceiro.
  { grupo: "pagamentos", chave: "taxa_gateway_pix", rotulo: "Taxa do gateway no Pix", descricao: "Descontada do parceiro em cada pagamento por Pix.", tipo: "numero", padrao: 0.99, unidade: "%", min: 0, max: 20 },
  { grupo: "pagamentos", chave: "taxa_gateway_debito", rotulo: "Taxa do gateway no débito", descricao: "Descontada do parceiro em cada pagamento no cartão de débito.", tipo: "numero", padrao: 1.99, unidade: "%", min: 0, max: 20 },
  { grupo: "pagamentos", chave: "taxa_gateway_cartao", rotulo: "Taxa do gateway no crédito à vista", descricao: "Descontada do parceiro no cartão de crédito em 1×.", tipo: "numero", padrao: 3.49, unidade: "%", min: 0, max: 20 },
  { grupo: "pagamentos", chave: "taxa_gateway_credito_parcelado", rotulo: "Taxa do gateway no crédito parcelado", descricao: "Descontada do parceiro no crédito de 2× em diante.", tipo: "numero", padrao: 3.99, unidade: "%", min: 0, max: 20 },
  { grupo: "pagamentos", chave: "taxa_antecipacao_mensal", rotulo: "Taxa de antecipação (ao mês)", descricao: "Crédito parcelado é antecipado: o parceiro recebe tudo no repasse, com esta taxa por mês de antecipação (média de (n+1)/2 meses).", tipo: "numero", padrao: 1.7, unidade: "% a.m.", min: 0, max: 10 },
  { grupo: "pagamentos", chave: "juros_parcelamento_mensal", rotulo: "Juros do parcelamento para o cliente (ao mês)", descricao: "Cobrados do cliente acima das parcelas sem juros (tabela Price); os juros vão para o parceiro.", tipo: "numero", padrao: 2.99, unidade: "% a.m.", min: 0, max: 15 },
  { grupo: "pagamentos", chave: "parcelas_sem_juros", rotulo: "Parcelas sem juros", descricao: "Até quantas parcelas o cliente não paga juros (o parceiro absorve a taxa).", tipo: "numero", padrao: 3, unidade: "parcelas", min: 1, max: 12 },
  { grupo: "pagamentos", chave: "parcelas_maximas", rotulo: "Máximo de parcelas", descricao: "Maior parcelamento oferecido no cartão de crédito.", tipo: "numero", padrao: 12, unidade: "parcelas", min: 1, max: 12 },
  { grupo: "pagamentos", chave: "valor_minimo_parcela", rotulo: "Valor mínimo da parcela", descricao: "Parcelamentos com parcela menor que isto não aparecem.", tipo: "numero", padrao: 5, unidade: "R$", min: 1, max: 1000 },
  { grupo: "pagamentos", chave: "minutos_validade_pix", rotulo: "Validade do Pix", descricao: "Tempo para o cliente pagar o QR Code/copia e cola.", tipo: "numero", padrao: 30, unidade: "minutos", min: 5, max: 1440 },
  { grupo: "vacinacao", chave: "minutos_validade_qr", rotulo: "Validade do QR Code da carteira", descricao: "Tempo para o parceiro ler o QR gerado no app do tutor.", tipo: "numero", padrao: 10, unidade: "minutos", min: 1, max: 60 },
  { grupo: "vacinacao", chave: "horas_acesso_carteira", rotulo: "Acesso do parceiro à carteira após ler o QR", descricao: "Janela em que o parceiro pode ver e registrar vacinas do pet.", tipo: "numero", padrao: 12, unidade: "horas", min: 1, max: 72 },
  { grupo: "comercial", chave: "percentual_comissao_padrao", rotulo: "Comissão padrão de parceiro novo", descricao: "Comissão da plataforma aplicada ao converter um interessado (Quero ser parceiro) em empresa; ajustável depois na empresa.", tipo: "numero", padrao: 15, unidade: "%", min: 0, max: 50 },
  { grupo: "lembretes", chave: "dias_antecedencia_vacina", rotulo: "Antecedência do lembrete de vacina", descricao: "Quantos dias antes da próxima dose o tutor é lembrado.", tipo: "numero", padrao: 7, unidade: "dias", min: 0, max: 60 },
];

export const parametroPorChave = (chave: string) => PARAMETROS_PLATAFORMA.find((p) => p.chave === chave);

// Valor efetivo de um parâmetro: o mais específico que existir (unidade,
// depois empresa, depois plataforma), senão o padrão.
export function valorEfetivo(chave: string, registros: any[], escopo: { id_empresas?: string | null; id_unidades?: string | null } = {}): number {
  const def = parametroPorChave(chave);
  const daChave = registros.filter((r) => r.chave === chave);
  const achar = (f: (r: any) => boolean) => daChave.find(f);
  const reg =
    (escopo.id_unidades && achar((r) => String(r.id_unidades) === String(escopo.id_unidades))) ||
    (escopo.id_empresas && achar((r) => !r.id_unidades && String(r.id_empresas) === String(escopo.id_empresas))) ||
    achar((r) => !r.id_empresas && !r.id_unidades);
  const v = Number(reg?.valor);
  return reg && Number.isFinite(v) ? v : def?.padrao ?? 0;
}
