// GERADO por "npm run sync:app" no painel (projetos/petGo360) para o site público (site/petGo), a partir de
// shared/compartilhado/carteiraDigital.ts — NÃO EDITAR AQUI: altere no painel e sincronize.

// ═══ COMPARTILHADO painel ⇄ app do tutor ⇄ site ═══════════════════════════
// PetGo360 — CARTEIRA DIGITAL DO PET (modelo novo, 06/11/2026): o passaporte
// de saúde do pet no celular do tutor. Não é marketplace: o tutor cadastra,
// leva a qualquer clínica/pet shop e mostra um QR Code; o profissional abre
// uma página web (sem baixar app), vê o histórico e registra o que aplicou
// ("Validado por profissional"). Regras únicas aqui; o painel copia para o
// app e o site com `npm run sync:app` (só importa desta pasta).
//
// Não é só carteirinha: é o GESTOR DA VIDA DO PET. Grátis = 1 pet + vacinas;
// o resto é contratado por MÓDULO (recursos do app e serviços de parceiros:
// plano de saúde, funeral, seguro...).
// Coleções: clientes (tutor; recursos_ate/servicos_ate), pets, vacinacoes,
// alimentacoes_pets, registros_saude, acessos_carteiras_pets (QR),
// modulos_app (catálogo), assinaturas (contratações) + pagamentos (Pix),
// acionamentos_servicos, notificacoes (aviso ao tutor).
// Datas: SEMPRE milissegundos (número) — regra do ecossistema.

import { CHAVE_PIX_SIMULADA, PROVEDOR_SIMULADO, gerarPixCopiaECola } from "./pagamentos";

const DIA = 86400000;
const ms = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.getTime();
  if (typeof v?.toMillis === "function") return v.toMillis();
  if (typeof v?.seconds === "number") return v.seconds * 1000;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? null : t;
};
export const paraMs = ms;
const txt = (v: any, max = 500) => String(v ?? "").trim().slice(0, max);

// ── Plano grátis + MÓDULOS contratados ───────────────────────────────────
// Grátis: 1 pet e só VACINAS (com QR e PDF das vacinas). Todo o resto é
// MÓDULO contratado à parte (catálogo `modulos_app`, editado no painel):
// - módulos de RECURSO liberam partes do app (lista fixa abaixo);
// - módulos de SERVIÇO são de parceiros (plano de saúde, funeral, seguro...):
//   contratação aprovada no painel e botão "Acionar" na carteira do pet.
// Um módulo pode liberar vários recursos (ex.: pacote "Completo").
// No tutor (clientes): recursos_ate { recurso: ms } e servicos_ate { codigo: ms }.
export const RECURSOS_APP = ["pets_ilimitados", "historico_saude", "anexos", "alimentacao", "pdf_completo", "alertas_whatsapp"] as const;
export type RecursoApp = (typeof RECURSOS_APP)[number];
export const ROTULOS_RECURSO: Record<RecursoApp, string> = {
  pets_ilimitados: "Mais de um pet",
  historico_saude: "Histórico de saúde (vermífugo, antipulgas, consultas, cirurgias, exames, medicação)",
  anexos: "Fotos de laudos, exames e da carteirinha antiga",
  alimentacao: "Alimentação (ração, quantidade, frequência)",
  pdf_completo: "Carteirinha completa em PDF (viagens, hotéis, companhias aéreas)",
  alertas_whatsapp: "Alertas de vacina e reforços por WhatsApp",
};
export const GRATIS = { maxPets: 1, descricao: "1 pet e as vacinas (com QR Code para o veterinário e PDF das vacinas)" };

export const TIPOS_MODULO = ["recurso", "servico"] as const;
export const CATEGORIAS_SERVICO = ["plano_saude", "plano_funeral", "seguro", "outro"] as const;
export const ROTULOS_CATEGORIA_SERVICO: Record<string, string> = { plano_saude: "Plano de saúde pet", plano_funeral: "Plano funeral pet", seguro: "Seguro pet", outro: "Outro serviço" };
export const PERIODOS = ["mensal", "anual"] as const;
export type Periodo = (typeof PERIODOS)[number];
export const diasDoPeriodo = (p: Periodo) => (p === "anual" ? 365 : 30);

// Catálogo inicial (o painel edita preços, textos e parceiros; valores de exemplo).
export const CATALOGO_PADRAO: Record<string, any>[] = [
  { codigo: "completo", nome: "PetGo360 Completo", tipo: "recurso", recursos: [...RECURSOS_APP], preco_mensal: 5.9, preco_anual: 49.9, destaque: true, ordem: 1,
    descricao: "Tudo do app: pets ilimitados, histórico de saúde com fotos, alimentação, PDF completo e alertas por WhatsApp." },
  { codigo: "mais_pets", nome: "Mais pets", tipo: "recurso", recursos: ["pets_ilimitados"], preco_mensal: 1.9, preco_anual: 17.9, ordem: 2, descricao: "Cadastre todos os seus pets." },
  { codigo: "saude", nome: "Saúde completa", tipo: "recurso", recursos: ["historico_saude", "anexos"], preco_mensal: 2.9, preco_anual: 27.9, ordem: 3,
    descricao: "Vermífugo, antipulgas, consultas, cirurgias, exames e medicação, com fotos de laudos." },
  { codigo: "alimentacao", nome: "Alimentação", tipo: "recurso", recursos: ["alimentacao"], preco_mensal: 0.9, preco_anual: 8.9, ordem: 4, descricao: "Ração, quantidade diária, frequência e dietas especiais." },
  { codigo: "pdf_completo", nome: "Carteirinha completa em PDF", tipo: "recurso", recursos: ["pdf_completo"], preco_mensal: 0.9, preco_anual: 8.9, ordem: 5, descricao: "PDF com vacinas, alimentação e histórico, para viagens e hotéis." },
  { codigo: "alertas_whatsapp", nome: "Alertas por WhatsApp", tipo: "recurso", recursos: ["alertas_whatsapp"], preco_mensal: 1.9, preco_anual: 17.9, ordem: 6, descricao: "Aviso no WhatsApp quando vacina ou reforço estiver chegando." },
  { codigo: "plano_saude", nome: "Plano de saúde pet", tipo: "servico", categoria: "plano_saude", recursos: [], preco_mensal: 0, preco_anual: 0, ordem: 10, parceiro: "",
    descricao: "Consultas, exames e emergência com a rede do parceiro. Preço conforme o porte e a idade do pet." },
  { codigo: "plano_funeral", nome: "Plano funeral pet (Despedida Tranquila)", tipo: "servico", categoria: "plano_funeral", recursos: [], preco_mensal: 0, preco_anual: 0, ordem: 11, parceiro: "",
    descricao: "Remoção, cremação e cerimônia, com assistência 24h acionada pelo app." },
  { codigo: "seguro_pet", nome: "Seguro pet", tipo: "servico", categoria: "seguro", recursos: [], preco_mensal: 0, preco_anual: 0, ordem: 12, parceiro: "",
    descricao: "Cobertura de acidentes, assistência e urgência. Preço conforme o pet." },
];

// Configuração (painel → Configurações, grupo "assinatura").
// PAGAMENTO no padrão do ViaMob360: `modo_gateway` "desenvolvimento" (PADRÃO
// — SIMULADO: Pix com a chave fictícia CHAVE_PIX_SIMULADA, o app aprova
// sozinho após `segundos_aprovacao_pix_simulado`, e o painel também pode
// "Ativar") ou "producao" (Pix real na chave_pix, confirmado no painel; nas
// lojas, compra dentro do app — a fazer). Nada cobra de verdade enquanto o
// modo não for "producao".
export type ModoGateway = "desenvolvimento" | "producao";
export type ConfigAssinatura = { diasAvisoVacina: number; chavePix: string; recebedor: string; cidade: string; urlSite: string; whatsappSuporte: string; modoGateway: ModoGateway; segundosAprovacaoSimulada: number };
export const PADRAO_ASSINATURA: ConfigAssinatura = { diasAvisoVacina: 15, chavePix: "", recebedor: "PETGO 360", cidade: "MANAUS", urlSite: "https://petgo360.com.br", whatsappSuporte: "", modoGateway: "desenvolvimento", segundosAprovacaoSimulada: 20 };
export const pagamentoSimulado = (cfg: Pick<ConfigAssinatura, "modoGateway"> | null | undefined) => cfg?.modoGateway !== "producao";
export function configAssinatura(registros: any[]): ConfigAssinatura {
  const de = (chave: string) => (registros ?? []).find((r) => r?.chave === chave && r?.status !== "inativo")?.valor;
  const num = (chave: string, padrao: number) => { const n = Number(String(de(chave) ?? "").replace(",", ".")); return Number.isFinite(n) && n > 0 ? n : padrao; };
  const str = (chave: string, padrao: string) => { const v = de(chave); return v === undefined || v === null || String(v).trim() === "" ? padrao : String(v).trim(); };
  return {
    diasAvisoVacina: num("dias_aviso_vacina", PADRAO_ASSINATURA.diasAvisoVacina),
    chavePix: str("chave_pix", ""), recebedor: str("nome_recebedor_pix", PADRAO_ASSINATURA.recebedor), cidade: str("cidade_recebedor_pix", PADRAO_ASSINATURA.cidade),
    urlSite: str("url_site", PADRAO_ASSINATURA.urlSite).replace(/\/+$/, ""), whatsappSuporte: str("whatsapp_suporte", ""),
    modoGateway: /^produ[cç][aã]o$/i.test(str("modo_gateway", "")) ? "producao" : "desenvolvimento",
    segundosAprovacaoSimulada: num("segundos_aprovacao_pix_simulado", PADRAO_ASSINATURA.segundosAprovacaoSimulada),
  };
}

// O tutor tem o recurso agora?
export function temRecurso(cliente: Record<string, any> | null | undefined, recurso: RecursoApp, agora = Date.now()): boolean {
  return (ms(cliente?.recursos_ate?.[recurso]) ?? 0) > agora;
}
export function servicoAtivo(cliente: Record<string, any> | null | undefined, codigo: string, agora = Date.now()): boolean {
  return (ms(cliente?.servicos_ate?.[codigo]) ?? 0) > agora;
}
export const recursosAtivos = (cliente: Record<string, any> | null | undefined, agora = Date.now()) => RECURSOS_APP.filter((r) => temRecurso(cliente, r, agora));
// Módulos que liberam um recurso (para oferecer na hora do bloqueio).
export const modulosQueLiberam = (catalogo: any[], recurso: RecursoApp) =>
  (catalogo ?? []).filter((m) => m.status !== "inativo" && m.tipo === "recurso" && (m.recursos ?? []).includes(recurso)).sort((a, b) => (a.ordem ?? 99) - (b.ordem ?? 99));

export function motivoLimitePets(cliente: Record<string, any> | null | undefined, petsAtivos: number, agora = Date.now()): string | null {
  if (temRecurso(cliente, "pets_ilimitados", agora) || petsAtivos < GRATIS.maxPets) return null;
  return `O plano grátis tem ${GRATIS.maxPets} pet. Contrate o módulo "Mais pets" (ou o Completo) para cadastrar todos.`;
}
export function motivoBloqueio(cliente: Record<string, any> | null | undefined, recurso: RecursoApp, agora = Date.now()): string | null {
  return temRecurso(cliente, recurso, agora) ? null : `Este recurso faz parte de um módulo: ${ROTULOS_RECURSO[recurso]}.`;
}

// ── Saúde: status das vacinas ────────────────────────────────────────────
export type NivelSaude = "em_dia" | "atencao" | "atrasada" | "sem_vacinas";
export type StatusSaude = { nivel: NivelSaude; texto: string; proxima: { nome: string; em: number; dias: number } | null; atrasadas: number };
export const diasAte = (alvo: number, agora = Date.now()) => Math.ceil((startOfDay(alvo) - startOfDay(agora)) / DIA);
function startOfDay(t: number) { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }

// Só vale a ÚLTIMA aplicação de cada vacina (uma dose nova "fecha" a próxima da anterior).
export function proximasDoses(vacinacoes: any[]): { nome: string; em: number }[] {
  const ultima = new Map<string, any>();
  for (const v of vacinacoes ?? []) {
    const chave = String(v.id_vacinas_catalogo || v.nome_vacina || "").toLowerCase().trim();
    if (!chave) continue;
    const atual = ultima.get(chave);
    if (!atual || (ms(v.aplicada_em) ?? 0) > (ms(atual.aplicada_em) ?? 0)) ultima.set(chave, v);
  }
  return [...ultima.values()].map((v) => ({ nome: txt(v.nome_vacina, 80) || "Vacina", em: ms(v.proxima_dose_em) ?? 0 })).filter((p) => p.em > 0).sort((a, b) => a.em - b.em);
}

// Lembretes de vacina NO CELULAR (notificação local, grátis — vacinas são do
// plano grátis): para cada próxima dose, um aviso `diasAviso` dias antes e
// outro no dia, às 9h. Só o futuro; o mais próximo primeiro (o iOS guarda até
// 64 agendados).
export type LembreteVacina = { chave: string; quando: number; titulo: string; corpo: string; idPet: string };
export function planejarLembretesVacina(pets: any[], vacinacoes: any[], diasAviso = PADRAO_ASSINATURA.diasAvisoVacina, agora = Date.now(), limite = 60): LembreteVacina[] {
  const nove = (t: number) => { const d = new Date(t); d.setHours(9, 0, 0, 0); return d.getTime(); };
  const out: LembreteVacina[] = [];
  for (const pet of pets ?? []) {
    if (!pet || pet.status === "inativo" || pet.status === "falecido") continue;
    const doPet = (vacinacoes ?? []).filter((v) => String(v.id_pets) === String(pet.id) && v.status !== "cancelada");
    for (const d of proximasDoses(doPet)) {
      const nome = txt(pet.nome, 40) || "seu pet";
      const antes = nove(d.em - diasAviso * DIA);
      if (diasAviso > 0 && antes > agora) out.push({ chave: `${pet.id}-${d.nome}-antes`, quando: antes, idPet: String(pet.id), titulo: `Vacina do ${nome} em ${diasAviso} dias`, corpo: `${d.nome} vence em ${new Date(d.em).toLocaleDateString("pt-BR")}. Agende com o veterinário.` });
      const noDia = nove(d.em);
      if (noDia > agora) out.push({ chave: `${pet.id}-${d.nome}-dia`, quando: noDia, idPet: String(pet.id), titulo: `Hoje é dia de vacina do ${nome}`, corpo: `${d.nome} vence hoje. Depois de aplicar, registre na carteira.` });
    }
  }
  return out.sort((x, y) => x.quando - y.quando).slice(0, limite);
}

export function statusSaude(vacinacoes: any[], agora = Date.now(), diasAtencao = PADRAO_ASSINATURA.diasAvisoVacina): StatusSaude {
  if (!(vacinacoes ?? []).length) return { nivel: "sem_vacinas", texto: "Nenhuma vacina registrada", proxima: null, atrasadas: 0 };
  const prox = proximasDoses(vacinacoes);
  const atrasadas = prox.filter((p) => diasAte(p.em, agora) < 0);
  const proxima = prox.find((p) => diasAte(p.em, agora) >= 0) ?? null;
  const p = proxima ? { ...proxima, dias: diasAte(proxima.em, agora) } : null;
  if (atrasadas.length) {
    const a = atrasadas[0];
    const d = -diasAte(a.em, agora);
    return { nivel: "atrasada", texto: `${a.nome} atrasada há ${d} dia${d === 1 ? "" : "s"}`, proxima: p, atrasadas: atrasadas.length };
  }
  if (p && p.dias <= diasAtencao) return { nivel: "atencao", texto: p.dias === 0 ? `${p.nome} vence hoje` : `${p.nome} vence em ${p.dias} dia${p.dias === 1 ? "" : "s"}`, proxima: p, atrasadas: 0 };
  return { nivel: "em_dia", texto: "Vacinas em dia", proxima: p, atrasadas: 0 };
}

// ── Vacina registrada pelo TUTOR (com ou sem o catálogo) ─────────────────
export function planejarVacinaTutor(p: {
  pet: { id: string; id_clientes: string };
  idCarteira: string;
  catalogo?: { id: string; nome: string; doses_serie_inicial?: number; intervalo_doses_dias?: number | null; intervalo_reforco_dias?: number | null } | null;
  vacinacoesDoPet: any[];
  dados: { nome?: string; aplicadaEm: number | null; proximaDoseEm?: number | null; lote?: string; dose?: string; fabricante?: string; comprovante?: string | null; observacoes?: string };
  agora?: number;
}): Record<string, any> {
  const agora = p.agora ?? Date.now();
  const nome = txt(p.catalogo?.nome ?? p.dados.nome, 80);
  if (!nome) throw new Error("Informe a vacina.");
  const aplicada = p.dados.aplicadaEm;
  if (!aplicada) throw new Error("Informe a data da aplicação.");
  if (aplicada > agora + 5 * 60000) throw new Error("A data da aplicação não pode ser no futuro.");
  if (agora - aplicada > 25 * 365 * DIA) throw new Error("Data da aplicação muito antiga.");
  const chave = String(p.catalogo?.id ?? nome).toLowerCase();
  const anteriores = (p.vacinacoesDoPet ?? []).filter((v) => String(v.id_vacinas_catalogo || v.nome_vacina || "").toLowerCase() === chave && (ms(v.aplicada_em) ?? 0) < aplicada).length;
  let proxima = p.dados.proximaDoseEm ?? null;
  if (!proxima && p.catalogo) {
    const serie = p.catalogo.doses_serie_inicial || 1;
    const dias = anteriores + 1 < serie ? p.catalogo.intervalo_doses_dias : p.catalogo.intervalo_reforco_dias;
    proxima = dias ? aplicada + dias * DIA : null;
  }
  if (proxima && proxima <= aplicada) throw new Error("A próxima dose deve ser depois da aplicação.");
  return {
    id_carteiras_pets: String(p.idCarteira), id_pets: String(p.pet.id), id_clientes: String(p.pet.id_clientes),
    id_vacinas_catalogo: p.catalogo ? String(p.catalogo.id) : null, nome_vacina: nome,
    id_empresas: null, id_unidades: null, id_profissionais: null, id_reservas: null, id_atendimentos_veterinarios: null, id_acessos_carteiras_pets: null,
    fabricante: txt(p.dados.fabricante, 80), lote: txt(p.dados.lote, 40), dose: txt(p.dados.dose, 40) || `${anteriores + 1}ª dose`,
    aplicada_em: aplicada, proxima_dose_em: proxima,
    origem: "tutor", canal_registro: "app", validada: false, validada_em: null, id_profissionais_validador: null,
    profissional_nome: null, profissional_registro: null, profissional_estabelecimento: null,
    comprovante: p.dados.comprovante ?? null, observacoes: txt(p.dados.observacoes) || null,
  };
}

// ── Alimentação ──────────────────────────────────────────────────────────
export function planejarAlimentacao(pet: { id: string; id_clientes: string }, d: Record<string, any>): Record<string, any> {
  const marca = txt(d.marca, 80);
  if (!marca) throw new Error("Informe a marca/ração.");
  const vezes = Number(d.vezes_ao_dia);
  return {
    id_pets: String(pet.id), id_clientes: String(pet.id_clientes),
    marca, produto: txt(d.produto, 120), tipo: txt(d.tipo, 40) || "racao_seca",
    quantidade_diaria: txt(d.quantidade_diaria, 40), vezes_ao_dia: Number.isFinite(vezes) && vezes > 0 ? Math.min(12, Math.round(vezes)) : null,
    observacoes: txt(d.observacoes) || null, ativa: d.ativa !== false,
  };
}
export const TIPOS_ALIMENTO = ["racao_seca", "racao_umida", "natural", "mista", "dieta_especial", "outro"] as const;
export const ROTULOS_ALIMENTO: Record<string, string> = { racao_seca: "Ração seca", racao_umida: "Ração úmida", natural: "Alimentação natural", mista: "Mista", dieta_especial: "Dieta especial/terapêutica", outro: "Outro" };

// ── Registros de saúde (vermífugo, consultas, cirurgias, exames...) ──────
export const TIPOS_REGISTRO_SAUDE = ["vermifugacao", "antipulgas", "consulta", "cirurgia", "exame", "medicacao", "outro"] as const;
export type TipoRegistroSaude = (typeof TIPOS_REGISTRO_SAUDE)[number];
export const ROTULOS_REGISTRO_SAUDE: Record<TipoRegistroSaude, string> = {
  vermifugacao: "Vermifugação", antipulgas: "Antipulgas/carrapatos", consulta: "Consulta", cirurgia: "Cirurgia", exame: "Exame", medicacao: "Medicação", outro: "Outro",
};
export const ICONES_REGISTRO_SAUDE: Record<string, string> = {
  vacina: "needle", vermifugacao: "pill", antipulgas: "bug-outline", consulta: "stethoscope", cirurgia: "medical-bag", exame: "flask-outline", medicacao: "pill-multiple", outro: "note-text-outline", alimentacao: "food-drumstick-outline",
};
// Tipos que costumam ter "próxima" (reforço).
export const TIPOS_COM_PROXIMA = new Set<TipoRegistroSaude>(["vermifugacao", "antipulgas", "medicacao"]);

export type Profissional = { nome: string; registro?: string; estabelecimento?: string };
export function problemaProfissional(p: Profissional | null | undefined): string | null {
  if (!txt(p?.nome, 120) || txt(p?.nome, 120).length < 3) return "Informe o seu nome.";
  return null;
}

export function planejarRegistroSaude(p: {
  pet: { id: string; id_clientes: string };
  dados: { tipo: string; titulo?: string; dataEm: number | null; proximaEm?: number | null; descricao?: string; anexos?: string[] };
  origem: "tutor" | "profissional";
  profissional?: Profissional | null;
  idAcesso?: string | null;
  agora?: number;
}): Record<string, any> {
  const agora = p.agora ?? Date.now();
  if (!(TIPOS_REGISTRO_SAUDE as readonly string[]).includes(p.dados.tipo)) throw new Error("Escolha o tipo do registro.");
  const tipo = p.dados.tipo as TipoRegistroSaude;
  if (!p.dados.dataEm) throw new Error("Informe a data.");
  if (p.dados.dataEm > agora + 5 * 60000) throw new Error("A data não pode ser no futuro.");
  if (p.dados.proximaEm && p.dados.proximaEm <= p.dados.dataEm) throw new Error("A próxima data deve ser depois desta.");
  if (p.origem === "profissional") { const e = problemaProfissional(p.profissional); if (e) throw new Error(e); }
  const titulo = txt(p.dados.titulo, 120) || ROTULOS_REGISTRO_SAUDE[tipo];
  return {
    id_pets: String(p.pet.id), id_clientes: String(p.pet.id_clientes), tipo, titulo,
    data_em: p.dados.dataEm, proxima_em: p.dados.proximaEm ?? null, descricao: txt(p.dados.descricao, 2000) || null,
    anexos: (p.dados.anexos ?? []).filter(Boolean).slice(0, 10),
    origem: p.origem, validado: p.origem === "profissional",
    profissional_nome: p.origem === "profissional" ? txt(p.profissional!.nome, 120) : null,
    profissional_registro: p.origem === "profissional" ? txt(p.profissional!.registro, 40) || null : null,
    profissional_estabelecimento: p.origem === "profissional" ? txt(p.profissional!.estabelecimento, 120) || null : null,
    id_acessos_carteiras_pets: p.idAcesso ?? null,
  };
}

// ── QR Code → página web do profissional ─────────────────────────────────
// O QR é um LINK (qualquer câmera abre): {urlSite}/c/{token}. Vale 10 min para
// ser aberto; aberto, a página fica liberada por MINUTOS_SESSAO_WEB para
// consultar e registrar. Token de 43 caracteres aleatórios (bytes de quem chama).
export const MINUTOS_QR = 10;
export const MINUTOS_SESSAO_WEB = 60;
const ALFABETO_TOKEN = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
export const urlCarteira = (urlSite: string, token: string) => `${urlSite.replace(/\/+$/, "")}/c/${token}`;

export function gerarAcessoWeb(p: { idCarteira: string; pet: { id: string; id_clientes: string }; bytes: Uint8Array; urlSite: string; agora?: number }) {
  if (p.bytes.length < 43) throw new Error("Token precisa de 43 bytes aleatórios.");
  const agora = p.agora ?? Date.now();
  const token = Array.from(p.bytes.subarray(0, 43), (b) => ALFABETO_TOKEN[b % 64]).join("");
  return {
    dados: {
      id_carteiras_pets: String(p.idCarteira), id_pets: String(p.pet.id), id_clientes: String(p.pet.id_clientes),
      token, escopo: ["vacinas", "saude"], expira_em: agora + MINUTOS_QR * 60000, status: "gerado",
      id_empresas: null, id_unidades: null, id_profissionais: null, canal_leitura: null, lido_em: null, acesso_ate: null, revogado_em: null,
    },
    url: urlCarteira(p.urlSite, token),
  };
}

// Página web abrindo o QR: devolve o patch (primeira abertura) ou null (já
// aberto e dentro da janela); lança o motivo se não pode.
export function planejarAberturaWeb(acesso: Record<string, any> | null, agora = Date.now()): Record<string, any> | null {
  if (!acesso) throw new Error("Link inválido. Peça ao tutor para mostrar o QR Code de novo.");
  if (acesso.status === "revogado") throw new Error("O tutor encerrou este acesso.");
  if (acesso.status === "utilizado") {
    if ((ms(acesso.acesso_ate) ?? 0) > agora) return null;
    throw new Error("Este acesso terminou. Peça ao tutor para gerar outro QR Code.");
  }
  if (acesso.status !== "gerado" || (ms(acesso.expira_em) ?? 0) <= agora) throw new Error("QR Code expirado (vale 10 minutos). Peça ao tutor para gerar outro.");
  return { status: "utilizado", canal_leitura: "web", lido_em: agora, acesso_ate: agora + MINUTOS_SESSAO_WEB * 60000 };
}
export const acessoWebValido = (acesso: Record<string, any> | null | undefined, agora = Date.now()) =>
  !!acesso && acesso.status === "utilizado" && (ms(acesso.acesso_ate) ?? 0) > agora;

// Vacina aplicada pelo profissional na página web: já nasce VALIDADA.
export function planejarVacinaProfissional(p: {
  acesso: Record<string, any>;
  pet: { id: string; id_clientes: string };
  profissional: Profissional;
  vacinacoesDoPet: any[];
  catalogo?: { id: string; nome: string; doses_serie_inicial?: number; intervalo_doses_dias?: number | null; intervalo_reforco_dias?: number | null } | null;
  dados: { nome?: string; aplicadaEm: number | null; proximaDoseEm?: number | null; lote?: string; dose?: string; fabricante?: string; observacoes?: string };
  agora?: number;
}): Record<string, any> {
  const agora = p.agora ?? Date.now();
  if (!acessoWebValido(p.acesso, agora)) throw new Error("Acesso encerrado. Peça ao tutor para gerar outro QR Code.");
  const e = problemaProfissional(p.profissional); if (e) throw new Error(e);
  const base = planejarVacinaTutor({ pet: p.pet, idCarteira: String(p.acesso.id_carteiras_pets), catalogo: p.catalogo, vacinacoesDoPet: p.vacinacoesDoPet, dados: p.dados, agora });
  return {
    ...base, origem: "profissional", canal_registro: "web_profissional", validada: true, validada_em: agora,
    id_acessos_carteiras_pets: String(p.acesso.id),
    profissional_nome: txt(p.profissional.nome, 120), profissional_registro: txt(p.profissional.registro, 40) || null,
    profissional_estabelecimento: txt(p.profissional.estabelecimento, 120) || null,
  };
}

// Profissional confirma uma vacina declarada pelo tutor.
export function planejarValidacaoVacina(acesso: Record<string, any>, vacinacao: Record<string, any>, profissional: Profissional, agora = Date.now()): Record<string, any> {
  if (!acessoWebValido(acesso, agora)) throw new Error("Acesso encerrado. Peça ao tutor para gerar outro QR Code.");
  if (String(vacinacao.id_pets) !== String(acesso.id_pets)) throw new Error("Esta vacina é de outro pet.");
  if (vacinacao.validada) throw new Error("Esta vacina já está validada.");
  const e = problemaProfissional(profissional); if (e) throw new Error(e);
  return {
    validada: true, validada_em: agora, canal_registro: "web_profissional", id_acessos_carteiras_pets: String(acesso.id),
    profissional_nome: txt(profissional.nome, 120), profissional_registro: txt(profissional.registro, 40) || null,
    profissional_estabelecimento: txt(profissional.estabelecimento, 120) || null,
  };
}

// Aviso ao tutor quando um profissional mexe na carteira.
export function notificacaoAtualizacao(p: { pet: { id: string; id_clientes: string; nome: string }; profissional: Profissional; oQue: string; agora?: number }): Record<string, any> {
  const quem = [txt(p.profissional.nome, 120), p.profissional.estabelecimento ? `(${txt(p.profissional.estabelecimento, 120)})` : ""].filter(Boolean).join(" ");
  return {
    id_clientes: String(p.pet.id_clientes), id_pets: String(p.pet.id), tipo: "carteira", canal: "app", modulo: "carteira",
    titulo: `Carteira de ${p.pet.nome} atualizada`, mensagem: `${quem} registrou: ${p.oQue}.`,
    status: "enviada", enviada_em: p.agora ?? Date.now(), lida_em: null,
  };
}

// ── Linha do tempo (app, web e PDF) ──────────────────────────────────────
export type ItemLinha = { chave: string; tipo: string; data: number; titulo: string; detalhe: string; selo: string | null; futuro: boolean; anexos: string[] };
export function linhaDoTempo(d: { vacinacoes?: any[]; registros?: any[] }, agora = Date.now()): ItemLinha[] {
  const itens: ItemLinha[] = [];
  for (const v of d.vacinacoes ?? []) {
    const data = ms(v.aplicada_em) ?? 0;
    itens.push({
      chave: `v${v.id}`, tipo: "vacina", data, titulo: `Vacina ${txt(v.nome_vacina, 80)}`.trim(),
      detalhe: [v.dose, v.lote && `Lote ${v.lote}`, v.profissional_nome && `Por ${v.profissional_nome}${v.profissional_registro ? ` (${v.profissional_registro})` : ""}`, v.profissional_estabelecimento].filter(Boolean).join(" · "),
      selo: v.validada ? "Validado por profissional" : "Declarado pelo tutor", futuro: data > agora, anexos: v.comprovante ? [v.comprovante] : [],
    });
  }
  for (const r of d.registros ?? []) {
    const data = ms(r.data_em) ?? 0;
    const prox = ms(r.proxima_em);
    itens.push({
      chave: `r${r.id}`, tipo: r.tipo, data, titulo: txt(r.titulo, 120) || (ROTULOS_REGISTRO_SAUDE as any)[r.tipo] || "Registro",
      detalhe: [txt(r.descricao, 300), prox ? `Próxima: ${new Date(prox).toLocaleDateString("pt-BR")}` : "", r.profissional_nome && `Por ${r.profissional_nome}${r.profissional_registro ? ` (${r.profissional_registro})` : ""}`].filter(Boolean).join(" · "),
      selo: r.validado ? "Validado por profissional" : "Declarado pelo tutor", futuro: data > agora, anexos: r.anexos ?? [],
    });
  }
  return itens.sort((a, b) => b.data - a.data);
}

// ── Contratação de módulo ────────────────────────────────────────────────
export function precoDoModulo(m: Record<string, any>, periodo: Periodo): number { return Number(periodo === "anual" ? m.preco_anual : m.preco_mensal) || 0; }
export const sobConsulta = (m: Record<string, any>) => m.tipo === "servico" && !precoDoModulo(m, "mensal") && !precoDoModulo(m, "anual");

// Pedido: contratação (aguardando pagamento) + Pix pendente; serviço "sob
// consulta" vira só a solicitação (a equipe/parceiro fala com o tutor e o
// painel ativa).
export function planejarContratacao(p: { cliente: Record<string, any>; modulo: Record<string, any>; periodo: Periodo; idPet?: string | null; cfg: ConfigAssinatura; txid: string; agora?: number }) {
  const agora = p.agora ?? Date.now();
  const m = p.modulo;
  if (!m || m.status === "inativo") throw new Error("Módulo indisponível.");
  if (!(PERIODOS as readonly string[]).includes(p.periodo)) throw new Error("Escolha mensal ou anual.");
  const consulta = sobConsulta(m);
  const valor = consulta ? 0 : precoDoModulo(m, p.periodo);
  if (!consulta && !valor) throw new Error("Este módulo não tem preço para esse período.");
  const simulado = pagamentoSimulado(p.cfg);
  if (!consulta && !simulado && !p.cfg.chavePix) throw new Error("O pagamento por Pix ainda não está configurado. Fale com o suporte.");
  if (m.tipo === "servico" && !p.idPet) throw new Error("Escolha o pet.");
  const copiaECola = consulta ? null : gerarPixCopiaECola({ chave: simulado ? CHAVE_PIX_SIMULADA : p.cfg.chavePix, nome: p.cfg.recebedor, cidade: p.cfg.cidade, valor, txid: p.txid });
  return {
    assinatura: {
      id_clientes: String(p.cliente.id), id_pets: p.idPet ?? null, id_planos: null, id_modulos_app: String(m.id), codigo_modulo: String(m.codigo), nome_modulo: String(m.nome),
      tipo_modulo: m.tipo, id_empresas: null, periodicidade: p.periodo, inicio_em: agora, fim_em: null, inicio_ciclo_em: agora, proxima_cobranca_em: agora,
      valor, renovacao_automatica: false, cancelada_em: null, status: consulta ? "solicitada" : "aguardando_pagamento",
    },
    pagamento: consulta ? null : (idAssinatura: string) => ({
      id_reservas: null, id_compras_cupons_off: null, id_cupons_off: null, id_assinaturas: String(idAssinatura), id_clientes: String(p.cliente.id), id_empresas: null,
      provedor: simulado ? PROVEDOR_SIMULADO : "pix_manual", forma_pagamento: "pix", parcelas: 1, valor, status: "pendente", codigo_transacao: p.txid,
      qr_code_pix: copiaECola, copia_cola_pix: copiaECola, pix_expira_em: agora + 3 * DIA, pago_em: null,
    }),
    copiaECola, valor, sobConsulta: consulta, simulado: simulado && !consulta,
  };
}

// Ativação (painel: Pix confirmado ou serviço aprovado): estende os recursos/serviço do tutor.
export function planejarAtivacao(p: { assinatura: Record<string, any>; modulo: Record<string, any>; cliente: Record<string, any>; pagamento?: Record<string, any> | null; agora?: number }) {
  const agora = p.agora ?? Date.now();
  if (p.assinatura.status === "ativa") throw new Error("Esta contratação já está ativa.");
  if (p.pagamento && p.pagamento.status !== "pendente") throw new Error("Só dá para confirmar pagamento pendente.");
  const periodo: Periodo = p.assinatura.periodicidade === "anual" ? "anual" : "mensal";
  const recursos = { ...(p.cliente.recursos_ate ?? {}) } as Record<string, number>;
  const servicos = { ...(p.cliente.servicos_ate ?? {}) } as Record<string, number>;
  const atual = p.modulo.tipo === "servico" ? ms(servicos[p.modulo.codigo]) ?? 0 : Math.max(0, ...(p.modulo.recursos ?? []).map((r: string) => ms(recursos[r]) ?? 0));
  const inicio = Math.max(agora, atual); // renovação antecipada soma ao que falta
  const fim = inicio + diasDoPeriodo(periodo) * DIA;
  if (p.modulo.tipo === "servico") servicos[p.modulo.codigo] = fim;
  else for (const r of p.modulo.recursos ?? []) recursos[r] = Math.max(ms(recursos[r]) ?? 0, fim);
  return {
    patchPagamento: p.pagamento ? { status: "aprovado", pago_em: agora } : null,
    patchAssinatura: { status: "ativa", inicio_ciclo_em: inicio, fim_em: fim, proxima_cobranca_em: fim },
    patchCliente: { recursos_ate: recursos, servicos_ate: servicos },
    notificacao: {
      id_clientes: String(p.cliente.id), id_pets: p.assinatura.id_pets ?? null, tipo: "assinatura", canal: "app", modulo: "assinatura",
      titulo: `${p.modulo.nome} ativado!`, mensagem: `Vale até ${new Date(fim).toLocaleDateString("pt-BR")}. Obrigado!`,
      status: "enviada", enviada_em: agora, lida_em: null,
    },
  };
}

// Acionamento de serviço contratado (funeral/seguro/saúde 24h).
export function planejarAcionamento(p: { cliente: Record<string, any>; pet: { id: string; id_clientes: string; nome: string }; modulo: Record<string, any>; motivo: string; agora?: number }): Record<string, any> {
  const agora = p.agora ?? Date.now();
  if (!servicoAtivo(p.cliente, String(p.modulo.codigo), agora)) throw new Error("Este serviço não está ativo para você.");
  const motivo = txt(p.motivo, 1000);
  if (motivo.length < 5) throw new Error("Conte em poucas palavras o que aconteceu.");
  return {
    id_clientes: String(p.cliente.id), id_pets: String(p.pet.id), nome_pet: p.pet.nome, id_modulos_app: String(p.modulo.id), codigo_modulo: String(p.modulo.codigo),
    nome_modulo: String(p.modulo.nome), parceiro: p.modulo.parceiro ?? "", motivo, status: "aberto", aberto_em: agora, atendido_em: null,
    tutor_nome: p.cliente.nome ?? "", tutor_whatsapp: p.cliente.whatsapp ?? "",
  };
}

// ── PDF da carteirinha (HTML → expo-print no app; impressão no site) ─────
const esc = (s: any) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const dataBr = (v: any) => { const t = ms(v); return t ? new Date(t).toLocaleDateString("pt-BR") : "—"; };

export function htmlCarteira(p: {
  pet: Record<string, any>; tutor?: Record<string, any> | null; vacinacoes: any[]; registros: any[]; alimentacoes: any[];
  completo: boolean; rotuloEspecie?: string; idade?: string; geradoEm?: number;
}): string {
  const pet = p.pet;
  const vac = [...(p.vacinacoes ?? [])].sort((a, b) => (ms(b.aplicada_em) ?? 0) - (ms(a.aplicada_em) ?? 0));
  const reg = [...(p.registros ?? [])].sort((a, b) => (ms(b.data_em) ?? 0) - (ms(a.data_em) ?? 0));
  const ali = (p.alimentacoes ?? []).filter((a) => a.ativa !== false);
  const linha = (rotulo: string, valor: any) => (valor ? `<div class="kv"><span>${esc(rotulo)}</span><b>${esc(valor)}</b></div>` : "");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Carteira de ${esc(pet.nome)}</title>
<style>
*{box-sizing:border-box}body{font-family:Helvetica,Arial,sans-serif;color:#1f2937;margin:24px;font-size:12px}
.cab{display:flex;align-items:center;gap:16px;border-bottom:3px solid #0f766e;padding-bottom:12px;margin-bottom:16px}
.cab img{width:84px;height:84px;border-radius:50%;object-fit:cover}.cab h1{margin:0;font-size:22px;color:#0f766e}
.marca{margin-left:auto;text-align:right;color:#0f766e;font-weight:700}.marca small{display:block;color:#6b7280;font-weight:400}
h2{font-size:14px;color:#0f766e;border-bottom:1px solid #d1d5db;padding-bottom:4px;margin:18px 0 8px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px}.kv{display:flex;justify-content:space-between;border-bottom:1px dotted #e5e7eb;padding:3px 0}.kv span{color:#6b7280}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:5px 6px;border-bottom:1px solid #e5e7eb;vertical-align:top}th{background:#f0fdfa;font-size:11px}
.selo{font-size:10px;padding:1px 6px;border-radius:8px;background:#ecfdf5;color:#047857;white-space:nowrap}.selo.t{background:#fff7ed;color:#c2410c}
.alerta{background:#fef2f2;color:#991b1b;padding:6px 10px;border-radius:6px;margin-top:8px}.rod{margin-top:24px;color:#9ca3af;font-size:10px;text-align:center}
</style></head><body>
<div class="cab">${pet.foto ? `<img src="${esc(pet.foto)}">` : ""}<div><h1>${esc(pet.nome)}</h1><div>${esc([p.rotuloEspecie, pet.raca, p.idade].filter(Boolean).join(" · "))}</div></div>
<div class="marca">PetGo360<small>Carteira digital do pet</small></div></div>
<div class="grid">${linha("Sexo", pet.sexo === "macho" ? "Macho" : pet.sexo === "femea" ? "Fêmea" : "")}${linha("Peso", pet.peso ? `${String(pet.peso).replace(".", ",")} kg` : "")}
${linha("Castrado", pet.castrado ? "Sim" : "Não")}${linha("Microchip", pet.microchip)}${linha("Nascimento", pet.data_nascimento ? dataBr(pet.data_nascimento) : "")}
${p.tutor ? linha("Tutor", p.tutor.nome) + linha("WhatsApp", p.tutor.whatsapp) : ""}</div>
${(pet.alergias ?? []).length ? `<div class="alerta"><b>Alergias:</b> ${esc(pet.alergias.join(", "))}</div>` : ""}
<h2>Vacinas</h2>${vac.length ? `<table><tr><th>Vacina</th><th>Aplicação</th><th>Lote</th><th>Próxima dose</th><th></th></tr>${vac.map((v) => `<tr><td>${esc(v.nome_vacina)}<br><small>${esc(v.dose)}</small></td><td>${dataBr(v.aplicada_em)}</td><td>${esc(v.lote || "—")}</td><td>${v.proxima_dose_em ? dataBr(v.proxima_dose_em) : "—"}</td><td><span class="selo${v.validada ? "" : " t"}">${v.validada ? `Validada${v.profissional_nome ? ` · ${esc(v.profissional_nome)}` : ""}` : "Declarada pelo tutor"}</span></td></tr>`).join("")}</table>` : "<p>Nenhuma vacina registrada.</p>"}
${p.completo ? `<h2>Alimentação</h2>${ali.length ? `<table><tr><th>Ração/alimento</th><th>Quantidade por dia</th><th>Vezes ao dia</th><th>Observações</th></tr>${ali.map((a) => `<tr><td>${esc(a.marca)} ${esc(a.produto)}</td><td>${esc(a.quantidade_diaria || "—")}</td><td>${a.vezes_ao_dia ?? "—"}</td><td>${esc(a.observacoes || "")}</td></tr>`).join("")}</table>` : "<p>Sem registro de alimentação.</p>"}
<h2>Histórico de saúde</h2>${reg.length ? `<table><tr><th>Data</th><th>Registro</th><th>Detalhes</th><th></th></tr>${reg.map((r) => `<tr><td>${dataBr(r.data_em)}</td><td>${esc(r.titulo)}</td><td>${esc(r.descricao || "")}${r.proxima_em ? `<br><small>Próxima: ${dataBr(r.proxima_em)}</small>` : ""}</td><td><span class="selo${r.validado ? "" : " t"}">${r.validado ? "Validado" : "Declarado pelo tutor"}</span></td></tr>`).join("")}</table>` : "<p>Sem registros.</p>"}`
  : `<p class="alerta" style="background:#f0fdfa;color:#0f766e">Carteirinha básica (vacinas). A versão completa, com alimentação e histórico de saúde, é um módulo do PetGo360.</p>`}
<div class="rod">Gerado pelo app PetGo360 em ${new Date(p.geradoEm ?? Date.now()).toLocaleString("pt-BR")} · Registros "Declarado pelo tutor" não foram conferidos por profissional.</div>
</body></html>`;
}

// ── Dados no CELULAR + backup na nuvem (decisão do dono, 06/11/2026) ─────
// Pets, vacinas, saúde e alimentação ficam no aparelho do tutor. Quem tem
// QUALQUER módulo pago ganha o backup: o app sincroniza com o banco e, num
// celular novo, os dados voltam. Sem módulo: só no aparelho (o app avisa).
export function temBackup(cliente: Record<string, any> | null | undefined, agora = Date.now()): boolean {
  const vale = (mapa: any) => Object.values(mapa ?? {}).some((v) => (ms(v) ?? 0) > agora);
  return vale(cliente?.recursos_ate) || vale(cliente?.servicos_ate);
}
export const COLECOES_DO_APARELHO = ["pets", "vacinacoes", "registros_saude", "alimentacoes_pets"] as const;

// Cópia temporária da carteira que vai junto com o QR (o veterinário lê pela
// web mesmo quando os dados só existem no celular). Só o necessário; o app
// apaga a cópia quando o acesso termina.
export function montarCopiaQr(p: { pet: Record<string, any>; vacinacoes: any[]; registros: any[]; alimentacoes: any[]; tutor?: Record<string, any> | null }) {
  const pet = p.pet;
  return {
    pet: {
      id: String(pet.id), nome: pet.nome, especie: pet.especie, raca: pet.raca ?? "", sexo: pet.sexo ?? "", data_nascimento: pet.data_nascimento ?? null,
      idade_aproximada: pet.idade_aproximada ?? null, peso: pet.peso ?? null, porte: pet.porte ?? "", castrado: !!pet.castrado, microchip: pet.microchip ?? null,
      alergias: pet.alergias ?? [], observacoes: pet.observacoes ?? null, foto: pet.foto ?? "",
    },
    tutor: p.tutor ? { nome: txt(p.tutor.nome, 150).split(" ")[0] } : null,
    vacinacoes: (p.vacinacoes ?? []).map((v) => ({
      id: String(v.id), nome_vacina: v.nome_vacina, id_vacinas_catalogo: v.id_vacinas_catalogo ?? null, dose: v.dose ?? "", lote: v.lote ?? "", aplicada_em: ms(v.aplicada_em),
      proxima_dose_em: ms(v.proxima_dose_em), validada: !!v.validada, profissional_nome: v.profissional_nome ?? null, profissional_registro: v.profissional_registro ?? null,
      profissional_estabelecimento: v.profissional_estabelecimento ?? null,
    })),
    registros: (p.registros ?? []).map((r) => ({
      id: String(r.id), tipo: r.tipo, titulo: r.titulo, data_em: ms(r.data_em), proxima_em: ms(r.proxima_em), descricao: r.descricao ?? null, validado: !!r.validado,
      profissional_nome: r.profissional_nome ?? null, anexos: r.anexos ?? [],
    })),
    alimentacoes: (p.alimentacoes ?? []).filter((a) => a.ativa !== false).map((a) => ({ marca: a.marca, produto: a.produto ?? "", tipo: a.tipo, quantidade_diaria: a.quantidade_diaria ?? "", vezes_ao_dia: a.vezes_ao_dia ?? null, observacoes: a.observacoes ?? null })),
  };
}

// Caixa de entrada: o que o profissional registrou pela web vai para
// `registros_profissionais`; o app do tutor importa para o celular.
export const TIPOS_ENTRADA = ["vacina", "registro", "validacao"] as const;
export function planejarEntrada(p: { acesso: Record<string, any>; tipo: (typeof TIPOS_ENTRADA)[number]; registro?: Record<string, any> | null; idAlvo?: string | null; patch?: Record<string, any> | null; agora?: number }): Record<string, any> {
  const agora = p.agora ?? Date.now();
  if (!acessoWebValido(p.acesso, agora)) throw new Error("Acesso encerrado. Peça ao tutor para gerar outro QR Code.");
  return {
    id_acessos_carteiras_pets: String(p.acesso.id), id_clientes: String(p.acesso.id_clientes), id_pets: String(p.acesso.id_pets),
    tipo: p.tipo, registro: p.registro ?? null, id_alvo: p.idAlvo ?? null, patch: p.patch ?? null, status: "pendente", importado_em: null,
  };
}
// O que o app grava no celular ao importar (coleção, id e dados).
export function aplicarEntrada(e: Record<string, any>, novoId: () => string): { colecao: "vacinacoes" | "registros_saude"; id: string; dados: Record<string, any>; merge: boolean } | null {
  if (e.tipo === "vacina" && e.registro) return { colecao: "vacinacoes", id: novoId(), dados: e.registro, merge: false };
  if (e.tipo === "registro" && e.registro) return { colecao: "registros_saude", id: novoId(), dados: e.registro, merge: false };
  if (e.tipo === "validacao" && e.id_alvo && e.patch) return { colecao: "vacinacoes", id: String(e.id_alvo), dados: e.patch, merge: true };
  return null;
}
