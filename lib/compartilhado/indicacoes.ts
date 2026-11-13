// GERADO por "npm run sync:app" no painel (projetos/petGo360) para o site público (site/petGo), a partir de
// shared/compartilhado/indicacoes.ts — NÃO EDITAR AQUI: altere no painel e sincronize.

// PROGRAMA DE INDICAÇÃO — PARCEIROS (dono, 12/11/2026): pet shops, clínicas, influenciadores e ONGs trazem tutores com um
// CÓDIGO próprio (link `{url_site}/i/<CÓDIGO>` e QR de balcão). O tutor que se cadastra com o código ganha DIAS EXTRAS no
// teste grátis; o parceiro ganha COMISSÃO sobre o PRIMEIRO pagamento do tutor indicado (% ou valor fixo), apurada por mês e
// paga por Pix (repasse registrado no painel). Atribuição no cadastro: `clientes.id_parceiros_indicacao` + `codigo_parceiro`.
// TS puro (sync:app → app e site).

export const COLECOES_INDICACAO = { parceiros: "parceiros_indicacao", repasses: "repasses_parceiros" } as const;
export const TIPOS_PARCEIRO_INDICACAO = [
  { valor: "pet_shop", rotulo: "Pet shop" }, { valor: "clinica", rotulo: "Clínica veterinária" }, { valor: "influenciador", rotulo: "Influenciador(a)" },
  { valor: "ong", rotulo: "ONG / protetor(a)" }, { valor: "outro", rotulo: "Outro" },
] as const;
export const rotuloTipoParceiro = (v: any) => TIPOS_PARCEIRO_INDICACAO.find((t) => t.valor === v)?.rotulo ?? "Parceiro";
export const TIPOS_COMISSAO_PARCEIRO = [{ valor: "percentual", rotulo: "% do 1º pagamento" }, { valor: "fixo", rotulo: "Valor fixo por assinante" }] as const;
export const BONUS_PADRAO_DIAS = 30;

const centavos = (v: number) => Math.round(v * 100) / 100;
const ms = (v: any) => (typeof v === "number" ? v : typeof v?.toMillis === "function" ? v.toMillis() : Number(new Date(v ?? 0).getTime()) || 0);

/** Código do parceiro: maiúsculas, letras e números, 3 a 20 (ex.: PETNAUS, CLINICAVIDA). */
export const normalizarCodigoParceiro = (t: any) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
export function problemaCodigoParceiro(codigo: any, parceiros: any[], idAtual?: string | null): string | null {
  const c = normalizarCodigoParceiro(codigo);
  if (c.length < 3) return "O código precisa ter de 3 a 20 letras ou números (ex.: PETNAUS).";
  if ((parceiros ?? []).some((p) => normalizarCodigoParceiro(p.codigo) === c && String(p.id) !== String(idAtual ?? ""))) return `O código ${c} já é de outro parceiro.`;
  return null;
}
export const linkParceiro = (urlSite: string, codigo: string) => `${String(urlSite || "").replace(/\/+$/, "")}/i/${normalizarCodigoParceiro(codigo)}`;

/** Parceiro ATIVO dono do código (ou null). */
export const parceiroDoCodigo = (parceiros: any[], codigo: any) => {
  const c = normalizarCodigoParceiro(codigo);
  return c ? (parceiros ?? []).find((p) => p.status !== "inativo" && normalizarCodigoParceiro(p.codigo) === c) ?? null : null;
};
/** O que vai no cadastro do tutor indicado. */
export const atribuicaoParceiro = (parceiro: any, agora = Date.now()) => ({
  id_parceiros_indicacao: String(parceiro.id), codigo_parceiro: normalizarCodigoParceiro(parceiro.codigo), indicado_por_parceiro_em: agora,
  bonus_teste_dias: Math.max(0, Number(parceiro.bonus_tutor_dias ?? BONUS_PADRAO_DIAS) || 0),
});

/** Comissão do parceiro sobre o 1º pagamento do tutor indicado. */
export function comissaoParceiro(parceiro: any, valorPrimeiroPagamento: number): number {
  if (!parceiro || !(valorPrimeiroPagamento > 0)) return 0;
  if (parceiro.comissao_tipo === "fixo") return centavos(Math.min(Number(parceiro.comissao_valor) || 0, valorPrimeiroPagamento));
  return centavos(valorPrimeiroPagamento * ((Number(parceiro.comissao_percentual) || 0) / 100));
}

export const competenciaDe = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
export type LinhaIndicado = { cliente: any; cadastradoEm: number; primeiroPagamentoEm: number | null; valor: number; comissao: number };
export type ResultadoParceiro = {
  parceiro: any; cadastrosMes: number; cadastrosTotal: number; convertidosMes: number; convertidosTotal: number; conversaoPct: number;
  receitaMes: number; comissaoMes: number; linhasMes: LinhaIndicado[];
};
/** Resultado do mês por parceiro: cadastros, quem pagou pela 1ª vez no mês (comissão) e totais. */
export function resultadosParceiros(p: { parceiros: any[]; clientes: any[]; pagamentos: any[]; competencia: string }): ResultadoParceiro[] {
  const primeiro = new Map<string, any>();
  for (const pg of p.pagamentos ?? []) {
    if (pg.status !== "aprovado" || !(Number(pg.valor) > 0)) continue;
    const k = String(pg.id_clientes), atual = primeiro.get(k);
    if (!atual || ms(pg.pago_em) < ms(atual.pago_em)) primeiro.set(k, pg);
  }
  return (p.parceiros ?? []).map((parc) => {
    const meus = (p.clientes ?? []).filter((c) => String(c.id_parceiros_indicacao ?? "") === String(parc.id));
    const linhas: LinhaIndicado[] = meus.map((c) => {
      const pg = primeiro.get(String(c.id));
      const valor = pg ? Number(pg.valor) || 0 : 0;
      return { cliente: c, cadastradoEm: ms(c.indicado_por_parceiro_em || c.created_at), primeiroPagamentoEm: pg ? ms(pg.pago_em) : null, valor, comissao: pg ? comissaoParceiro(parc, valor) : 0 };
    });
    const doMes = (t: number | null) => t !== null && competenciaDe(t) === p.competencia;
    const linhasMes = linhas.filter((l) => doMes(l.primeiroPagamentoEm));
    const convertidosTotal = linhas.filter((l) => l.primeiroPagamentoEm !== null).length;
    return {
      parceiro: parc, cadastrosMes: linhas.filter((l) => doMes(l.cadastradoEm)).length, cadastrosTotal: linhas.length,
      convertidosMes: linhasMes.length, convertidosTotal, conversaoPct: linhas.length ? Math.round((convertidosTotal / linhas.length) * 100) : 0,
      receitaMes: centavos(linhasMes.reduce((s, l) => s + l.valor, 0)), comissaoMes: centavos(linhasMes.reduce((s, l) => s + l.comissao, 0)), linhasMes,
    };
  });
}

/** Repasse (pagamento da comissão ao parceiro, por Pix). */
export function planejarRepasse(p: { parceiro: any; competencia: string; valor: any; comprovante?: string; agora?: number }) {
  const valor = centavos(Number(String(p.valor ?? "").replace(",", ".")) || 0);
  if (!(valor > 0)) throw new Error("Informe o valor pago ao parceiro.");
  if (!/^\d{4}-\d{2}$/.test(p.competencia)) throw new Error("Competência inválida.");
  return {
    id_parceiros_indicacao: String(p.parceiro.id), nome_parceiro: String(p.parceiro.nome ?? ""), codigo_parceiro: normalizarCodigoParceiro(p.parceiro.codigo),
    competencia: p.competencia, valor, chave_pix: String(p.parceiro.chave_pix ?? ""), comprovante: String(p.comprovante ?? "").trim().slice(0, 200),
    pago_em: p.agora ?? Date.now(), status: "pago",
  };
}
