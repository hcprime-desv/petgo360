// GERADO por "npm run sync:app" no painel (projetos/petGo360) para o site público (site/petGo), a partir de
// shared/compartilhado/analiseDenuncias.ts — NÃO EDITAR AQUI: altere no painel e sincronize.

// ANTI-TROTE DO DISQUE DENÚNCIA PET (dono, 12/11/2026). Regras PURAS (sem import) — painel, app, site e back-end petall360
// (cópia em src/produtos/petgo360/denunciaPet/analise-regras.ts).
//
// 1) IDENTIFICADOR CIFRADO, NÃO REVERSÍVEL: o back-end calcula HMAC-SHA256(segredo do servidor, origem) — origem = telefone
//    (WhatsApp) ou a chave aleatória do aparelho/navegador (app/site, campo `chave_origem`, apagado assim que o back-end lê).
//    O segredo NUNCA sai do servidor: com o identificador não dá para descobrir o telefone (nem por força bruta). A denúncia
//    continua sem nome/telefone; só se sabe que "o mesmo denunciante" mandou outras.
// 2) ANÁLISE AUTOMÁTICA a cada denúncia nova: frequência (24 h e 7 dias), relato repetido/parecido e ASSUNTO (é mesmo sobre
//    animais? — checagem por PALAVRAS, sem IA). Suspeito → `denunciantes_analise` com situação "em_analise".
// 3) A central decide no painel (Disque Denúncia Pet → Análise de denunciantes): Liberar, Restringir ou Bloquear.
// 4) BLOQUEADO não consegue fazer denúncia (só no Disque Denúncia Pet — o resto do WhatsApp/app segue normal): no WhatsApp
//    recebe a recusa educada; pelo app/site a denúncia é recusada pelo back-end (não vai a nenhum órgão).

export const COLECAO_DENUNCIANTES = "denunciantes_analise";

export const SITUACOES_DENUNCIANTE = ["em_analise", "liberado", "restrito", "bloqueado"] as const;
export type SituacaoDenunciante = (typeof SITUACOES_DENUNCIANTE)[number];
export const ROTULOS_SITUACAO_DENUNCIANTE: Record<SituacaoDenunciante, string> = {
  em_analise: "Em análise (suspeito)",
  liberado: "Liberado (denúncias legítimas)",
  restrito: "Restrito (só a central difunde)",
  bloqueado: "Bloqueado (não denuncia mais)",
};
export const DESCRICAO_SITUACAO_DENUNCIANTE: Record<SituacaoDenunciante, string> = {
  em_analise: "As denúncias dele ficam com a central (não vão sozinhas aos órgãos) até alguém decidir.",
  liberado: "Denúncias seguem o fluxo normal. Só volta para análise se aparecer um sinal NOVO (ex.: fora do tema).",
  restrito: "Pode denunciar, mas nada é difundido automaticamente: a central confere cada denúncia.",
  bloqueado: "Não consegue mais fazer denúncias no Disque Denúncia Pet (WhatsApp, app e site). O resto do serviço segue normal.",
};

/** Parâmetros (configuracoes, grupo "denuncia_pet"). */
export const PARAMETROS_ANALISE = {
  analise_max_24h: { padrao: 2, rotulo: "Máximo de denúncias em 24 horas", ajuda: "Acima disso o denunciante vai para análise." },
  analise_max_7d: { padrao: 5, rotulo: "Máximo de denúncias em 7 dias", ajuda: "Acima disso o denunciante vai para análise." },
  analise_similaridade: { padrao: 70, rotulo: "Relato parecido a partir de (%)", ajuda: "Relatos com essa semelhança ou mais contam como repetidos." },
} as const;
export type ChaveAnalise = keyof typeof PARAMETROS_ANALISE;
export type ParametrosAnalise = Record<ChaveAnalise, number>;
/** Lê os parâmetros (lista de `configuracoes`) com os padrões. */
export function parametrosAnalise(config: any[] | null | undefined, grupo = "denuncia_pet"): ParametrosAnalise {
  const out = {} as ParametrosAnalise;
  for (const k of Object.keys(PARAMETROS_ANALISE) as ChaveAnalise[]) {
    const c = (config ?? []).find((x) => x?.grupo === grupo && x?.chave === k && x?.status !== "inativo");
    const n = Number(String(c?.valor ?? "").replace(",", "."));
    out[k] = Number.isFinite(n) && n > 0 ? n : PARAMETROS_ANALISE[k].padrao;
  }
  return out;
}

// ---------- texto ----------
export function normalizarTexto(t: any): string {
  return String(t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
const PARADAS = new Set(["que", "com", "uma", "um", "para", "por", "dos", "das", "nos", "nas", "ele", "ela", "eles", "elas", "esta", "esse", "essa", "isso", "tem", "mais", "muito", "sem", "foi", "sao", "ser", "seu", "sua", "meu", "minha", "aqui", "ali", "la", "ja", "nao", "sim", "the", "pra", "pro", "todo", "toda", "dia", "dias"]);
function palavras(t: any): Set<string> {
  return new Set(normalizarTexto(t).split(" ").filter((p) => p.length >= 3 && !PARADAS.has(p)));
}
/** Semelhança entre dois relatos, 0–100 (palavras em comum; textos iguais = 100). */
export function similaridade(a: any, b: any): number {
  const na = normalizarTexto(a), nb = normalizarTexto(b);
  if (!na || !nb) return 0;
  if (na === nb) return 100;
  const A = palavras(a), B = palavras(b);
  if (!A.size || !B.size) return 0;
  let comum = 0;
  A.forEach((p) => { if (B.has(p)) comum++; });
  return Math.round((comum / (A.size + B.size - comum)) * 100);
}

// ---------- assunto (é mesmo sobre animais?) — só palavras ----------
const ANIMAIS = ["animal", "animais", "bicho", "bichinho", "pet", "cachorr", "cao", "caes", "cadel", "filhote", "gato", "gata", "gatinh", "felino", "canino", "cavalo", "egua", "burro", "jumento", "mula", "boi", "vaca", "bezerr", "porco", "leitao", "cabra", "bode", "ovelha", "carneiro", "galinha", "galo", "pinto", "pato", "passaro", "ave", "aves", "papagaio", "arara", "periquito", "calopsita", "canario", "macaco", "tartaruga", "jabuti", "coelho", "hamster", "peixe", "cobra", "jacare", "silvestre", "vira lata", "viralata", "pitbull", "rottweiler", "racao", "coleira", "canil", "gaiola", "veterinari"];
const MAUS_TRATOS = ["mau trato", "maus trato", "maltrat", "bate", "batendo", "bateu", "espanc", "chut", "agred", "acorrent", "corrente", "amarrad", "preso", "presa", "trancad", "abandon", "fome", "magro", "magra", "desnutr", "sem agua", "sem comida", "sede", "ferid", "machucad", "sangr", "envenen", "veneno", "queimad", "mutilad", "doente", "sarna", "carrapato", "sol", "chuva", "sujeira", "fezes", "rinha", "briga de", "cruel", "tortur", "morto", "morrendo", "atropel", "enforc", "chicote", "pedrad", "pauladas", "isolad"];
const FORA_DO_TEMA = ["assalto", "roubo", "furto", "droga", "trafico", "traficante", "arma", "tiro", "homicidio", "estupro", "violencia domestica", "marido", "esposa", "politic", "prefeito", "vereador", "deputado", "eleicao", "voto", "barulho", "som alto", "festa", "teste", "testando", "trote", "kkk", "hahaha", "rsrs", "piada", "brincadeira", "ola", "oi tudo bem", "bom dia", "boa tarde", "boa noite", "quero saber", "propaganda", "promocao", "pix", "dinheiro", "emprestimo"];
function achados(texto: string, lista: string[]): string[] {
  const t = ` ${texto} `;
  return lista.filter((p) => t.includes(p.includes(" ") || p.length > 4 ? p : ` ${p}`));
}
export type Assunto = "animais" | "duvidoso" | "fora_do_tema";
export const ROTULOS_ASSUNTO: Record<Assunto, string> = { animais: "Sobre animais", duvidoso: "Duvidoso", fora_do_tema: "Fora do tema" };
/** Classifica o relato pelas palavras: menciona animal? maus-tratos? assunto de outra área ou brincadeira? */
export function assuntoDenuncia(d: { descricao?: any; responsavel?: any; especie?: any; especie_outra?: any }): { assunto: Assunto; palavras_animal: string[]; palavras_maus_tratos: string[]; palavras_fora: string[] } {
  const texto = normalizarTexto([d.descricao, d.responsavel, d.especie_outra].filter(Boolean).join(" "));
  const pa = achados(texto, ANIMAIS), pm = achados(texto, MAUS_TRATOS), pf = achados(texto, FORA_DO_TEMA);
  const curto = texto.split(" ").filter(Boolean).length < 5;
  let assunto: Assunto;
  if (pf.length >= 2 && pa.length + pm.length <= 1) assunto = "fora_do_tema";
  else if (!pa.length && !pm.length) assunto = curto || pf.length ? "fora_do_tema" : "duvidoso";
  else if (pf.length && pa.length + pm.length < pf.length) assunto = "duvidoso";
  else if (!pm.length && curto) assunto = "duvidoso";
  else assunto = "animais";
  return { assunto, palavras_animal: pa.slice(0, 8), palavras_maus_tratos: pm.slice(0, 8), palavras_fora: pf.slice(0, 8) };
}

// ---------- análise do denunciante ----------
export type AnaliseDenuncia = {
  suspeita: boolean; motivos: string[]; assunto: Assunto; palavras: string[];
  em_24h: number; em_7d: number; maior_similaridade: number; parecida_com: string | null; analisada_em: number;
};
/**
 * Analisa a denúncia `nova` contra as ANTERIORES do mesmo identificador (qualquer canal).
 * Motivos: muitas em 24 h / 7 dias, relato igual/parecido a outra, assunto fora do tema.
 */
export function analisarDenuncia(nova: any, anteriores: any[], p: ParametrosAnalise, agora = Date.now()): AnaliseDenuncia {
  const quando = (d: any) => Number(d?.recebida_em ?? d?.created_at ?? 0);
  const outras = (anteriores ?? []).filter((d) => d && d.protocolo !== nova.protocolo);
  const em24 = outras.filter((d) => quando(d) >= agora - 24 * 3600e3).length + 1;
  const em7 = outras.filter((d) => quando(d) >= agora - 7 * 24 * 3600e3).length + 1;
  let maior = 0, parecida: string | null = null;
  for (const d of outras) { const s = similaridade(nova.descricao, d.descricao); if (s > maior) { maior = s; parecida = d.protocolo ?? null; } }
  const a = assuntoDenuncia(nova);
  const motivos: string[] = [];
  if (em24 > p.analise_max_24h) motivos.push(`${em24} denúncias em 24 horas (limite ${p.analise_max_24h})`);
  if (em7 > p.analise_max_7d) motivos.push(`${em7} denúncias em 7 dias (limite ${p.analise_max_7d})`);
  if (maior >= p.analise_similaridade) motivos.push(`relato ${maior === 100 ? "IGUAL" : `${maior}% parecido`} ao da denúncia ${parecida}`);
  if (a.assunto === "fora_do_tema") motivos.push(`relato fora do tema (não fala de animais${a.palavras_fora.length ? `; cita: ${a.palavras_fora.slice(0, 4).join(", ")}` : ""})`);
  return {
    suspeita: motivos.length > 0, motivos, assunto: a.assunto, palavras: [...a.palavras_animal, ...a.palavras_maus_tratos, ...a.palavras_fora].slice(0, 12),
    em_24h: em24, em_7d: em7, maior_similaridade: maior, parecida_com: maior >= p.analise_similaridade ? parecida : null, analisada_em: agora,
  };
}

/**
 * Nova situação do denunciante depois de uma denúncia analisada. Decisão da central (restrito/bloqueado) nunca muda sozinha;
 * "liberado" só volta para análise com sinal de FORA DO TEMA ou se o último aval tem mais de 30 dias.
 */
export function proximaSituacao(atual: SituacaoDenunciante | null | undefined, a: AnaliseDenuncia, liberadoEm: number | null | undefined, agora = Date.now()): SituacaoDenunciante | null {
  if (atual === "restrito" || atual === "bloqueado") return atual;
  if (!a.suspeita) return atual ?? null;
  if (atual === "liberado" && a.assunto !== "fora_do_tema" && Number(liberadoEm ?? 0) > agora - 30 * 24 * 3600e3) return "liberado";
  return "em_analise";
}
/** A denúncia pode ir AUTOMATICAMENTE aos órgãos? (suspeito em análise ou restrito → só a central). */
export const difusaoAutomaticaLiberada = (situacao: SituacaoDenunciante | null | undefined, a: AnaliseDenuncia | null) =>
  situacao !== "restrito" && situacao !== "em_analise" && situacao !== "bloqueado" && !(a?.suspeita && situacao !== "liberado");
export const podeDenunciar = (situacao: SituacaoDenunciante | null | undefined) => situacao !== "bloqueado";
export const MENSAGEM_DENUNCIANTE_BLOQUEADO =
  "Não foi possível registrar novas denúncias por este canal: a central identificou denúncias repetidas ou fora do tema. Em caso de flagrante com risco para o animal, ligue 190.";
/** Texto para o cidadão (privacidade / LGPD). */
export const AVISO_ANTITROTE =
  "Para evitar trotes, guardamos só um código cifrado e irreversível do seu número ou aparelho — com ele não é possível saber quem denunciou, apenas que a mesma origem mandou outras denúncias.";

/** Planeja a decisão da central (Liberar / Restringir / Bloquear). */
export function planejarDecisao(situacao: SituacaoDenunciante, justificativa: string, quem: string, agora = Date.now()) {
  if (!SITUACOES_DENUNCIANTE.includes(situacao) || situacao === "em_analise") throw new Error("Escolha Liberar, Restringir ou Bloquear.");
  const j = String(justificativa ?? "").trim();
  if (situacao !== "liberado" && j.length < 5) throw new Error("Escreva a justificativa (fica no histórico).");
  return {
    situacao, decidido_por: String(quem ?? "").slice(0, 80), decidido_em: agora, justificativa: j.slice(0, 500),
    ...(situacao === "liberado" ? { liberado_em: agora } : {}), updated_at: agora,
  };
}

// ---------- RISCO DE TROTE (0–100) e faixas verde → vermelho (gráficos do painel) ----------
export const FAIXAS_RISCO = [
  { id: "baixo", rotulo: "Baixo", de: 0, cor: "#16a34a" },
  { id: "moderado", rotulo: "Moderado", de: 25, cor: "#ca8a04" },
  { id: "alto", rotulo: "Alto", de: 50, cor: "#ea580c" },
  { id: "critico", rotulo: "Crítico", de: 75, cor: "#dc2626" },
] as const;
export type FaixaRisco = (typeof FAIXAS_RISCO)[number];
export const faixaRisco = (pontos: number): FaixaRisco => [...FAIXAS_RISCO].reverse().find((f) => pontos >= f.de) ?? FAIXAS_RISCO[0];
export const COR_ASSUNTO: Record<Assunto, string> = { animais: "#16a34a", duvidoso: "#ca8a04", fora_do_tema: "#dc2626" };

/** Pontua o risco de trote de um denunciante pelas denúncias dele (com `analise` gravada pelo back-end). */
export function riscoDenunciante(denuncias: any[], p: ParametrosAnalise): { pontos: number; faixa: FaixaRisco; sinais: string[] } {
  const an = (denuncias ?? []).map((d) => d?.analise ?? { assunto: assuntoDenuncia(d ?? {}).assunto, em_24h: 1, em_7d: 1, maior_similaridade: 0 });
  const fora = an.filter((a) => a.assunto === "fora_do_tema").length, duv = an.filter((a) => a.assunto === "duvidoso").length;
  const max24 = Math.max(0, ...an.map((a) => Number(a.em_24h ?? 0))), max7 = Math.max(0, ...an.map((a) => Number(a.em_7d ?? 0)));
  const sim = Math.max(0, ...an.map((a) => Number(a.maior_similaridade ?? 0)));
  const sinais: string[] = [];
  let pontos = 0;
  if (fora) { pontos += Math.min(50, fora * 25); sinais.push(`${fora} fora do tema`); }
  if (duv) { pontos += Math.min(20, duv * 10); sinais.push(`${duv} duvidosa(s)`); }
  if (sim >= p.analise_similaridade) { pontos += sim >= 95 ? 35 : 25; sinais.push(sim >= 95 ? "relato repetido" : `relato ${sim}% parecido`); }
  if (max24 > p.analise_max_24h) { pontos += Math.min(30, (max24 - p.analise_max_24h) * 15); sinais.push(`${max24} em 24 h`); }
  if (max7 > p.analise_max_7d) { pontos += Math.min(20, (max7 - p.analise_max_7d) * 10); sinais.push(`${max7} em 7 dias`); }
  pontos = Math.min(100, pontos);
  return { pontos, faixa: faixaRisco(pontos), sinais };
}
