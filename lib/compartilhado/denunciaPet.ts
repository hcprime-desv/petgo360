// GERADO por "npm run sync:app" no painel (projetos/petGo360) para o site público (site/petGo), a partir de
// shared/compartilhado/denunciaPet.ts — NÃO EDITAR AQUI: altere no painel e sincronize.

// DISQUE DENÚNCIA PET (dono, 12/11/2026) — denúncia ANÔNIMA de maus-tratos a animais, serviço GRATUITO de utilidade pública,
// pelo app e pelo WhatsApp (mesmo roteiro do DD360 — "Maus-tratos contra animais"). Chega à CENTRAL (painel) e é DIFUNDIDA
// por e-mail, com um PDF, aos ÓRGÃOS COMPETENTES cadastrados por ESTADO e MUNICÍPIO (`orgaos_denuncia`; município vazio =
// todo o estado). Difusão AUTOMÁTICA ou MANUAL (parâmetro do atendimento: `configuracoes` grupo "denuncia_pet", chave
// "difusao_automatica"). SIGILO: a denúncia NÃO guarda quem denunciou (nem telefone, nem conta) — só o PROTOCOLO, que o
// cidadão usa para acompanhar. TS puro e SEM import (cópia idêntica no back-end petall360: produtos/petgo360/denunciaPet/regras.ts).

export const COLECOES_DENUNCIA = {
  denuncias: "denuncias_pet", orgaos: "orgaos_denuncia", difusoes: "difusoes_denuncia_pet",
  // PUCs (dono, 18/11/2026): o cadastro `orgaos_denuncia` passa a ser o de TODOS os pontos de recebimento — órgãos, ONGs e protetores
  tramites: "denuncias_pet_tramites", mensagens: "denuncias_pet_mensagens", encaminhamentos: "denuncias_pet_encaminhamentos", pedidosPuc: "pucs_pedidos",
} as const;
export const GRUPO_PARAMETROS_DENUNCIA = "denuncia_pet";
export const NOME_SERVICO = "Disque Denúncia Pet";

export const TIPOS_MAUS_TRATOS = [
  { valor: "agressao", rotulo: "Agressão / espancamento", emoji: "🤕" },
  { valor: "abandono", rotulo: "Abandono", emoji: "🏚️" },
  { valor: "sem_comida_agua", rotulo: "Sem comida ou água", emoji: "🥣" },
  { valor: "acorrentado", rotulo: "Acorrentado / preso em local pequeno", emoji: "⛓️" },
  { valor: "ferido_sem_socorro", rotulo: "Ferido ou doente sem socorro", emoji: "🩹" },
  { valor: "envenenamento", rotulo: "Envenenamento", emoji: "☠️" },
  { valor: "rinha_exploracao", rotulo: "Rinha, exploração ou criação ilegal", emoji: "⚠️" },
  { valor: "outro", rotulo: "Outro tipo de maus-tratos", emoji: "📝" },
] as const;
export const rotuloTipoDenuncia = (v: any) => TIPOS_MAUS_TRATOS.find((t) => t.valor === v)?.rotulo ?? "Maus-tratos";
// até 10 (lista do WhatsApp); "outro" pede o nome do animal (`especie_outra`)
export const ESPECIES_DENUNCIA = [
  { valor: "cao", rotulo: "Cão" }, { valor: "gato", rotulo: "Gato" }, { valor: "cavalo", rotulo: "Cavalo / jumento / burro" },
  { valor: "boi", rotulo: "Boi / vaca" }, { valor: "porco", rotulo: "Porco" }, { valor: "cabra", rotulo: "Cabra / ovelha" },
  { valor: "galinha", rotulo: "Galinha / aves criação" }, { valor: "ave", rotulo: "Pássaro / ave" }, { valor: "silvestre", rotulo: "Animal silvestre" },
  { valor: "outro", rotulo: "Outro (escrever qual)" },
] as const;
export const rotuloEspecieDenuncia = (v: any, outra?: any) => (v === "outro" && String(outra ?? "").trim() ? String(outra).trim() : ESPECIES_DENUNCIA.find((t) => t.valor === v)?.rotulo.replace(" (escrever qual)", "") ?? "Animal");
export const LOCAIS_DENUNCIA = [{ valor: "privado", rotulo: "Casa / local privado" }, { valor: "publico", rotulo: "Rua / local público" }, { valor: "comercio", rotulo: "Comércio / canil / criadouro" }] as const;
export const FREQUENCIAS_DENUNCIA = [{ valor: "agora", rotulo: "Está acontecendo agora" }, { valor: "frequente", rotulo: "Acontece com frequência" }, { valor: "uma_vez", rotulo: "Aconteceu uma vez" }] as const;

export const UFS: [string, string][] = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"], ["BA", "Bahia"], ["CE", "Ceará"], ["DF", "Distrito Federal"], ["ES", "Espírito Santo"],
  ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"], ["MS", "Mato Grosso do Sul"], ["MG", "Minas Gerais"], ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"],
  ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"], ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"], ["RR", "Roraima"],
  ["SC", "Santa Catarina"], ["SP", "São Paulo"], ["SE", "Sergipe"], ["TO", "Tocantins"],
];
const semAcento = (s: any) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
/** UF a partir da sigla ou do nome ("am", "Amazonas" → "AM"); null se não reconhece. */
export function lerUf(texto: any): string | null {
  const t = semAcento(texto).toUpperCase();
  const porSigla = UFS.find(([s]) => s === t);
  if (porSigla) return porSigla[0];
  const porNome = UFS.find(([, n]) => semAcento(n).toUpperCase() === t);
  return porNome ? porNome[0] : null;
}
export const nomeUf = (uf: any) => UFS.find(([s]) => s === String(uf ?? "").toUpperCase())?.[1] ?? String(uf ?? "");
/** Chave de comparação do município (sem acento, minúsculas, sem espaços duplos). */
export const chaveMunicipio = (m: any) => semAcento(m).toLowerCase().replace(/\s+/g, " ");

export const STATUS_DENUNCIA = ["recebida", "em_analise", "difundida", "sem_orgao", "encerrada", "descartada"] as const;
export const ROTULOS_STATUS_DENUNCIA: Record<string, string> = {
  recebida: "Recebida", em_analise: "Em análise na central", difundida: "Encaminhada ao órgão competente", sem_orgao: "Aguardando órgão (central)",
  encerrada: "Encerrada", descartada: "Descartada",
};
/** O que o cidadão vê ao consultar o protocolo (sem detalhes internos). */
export const situacaoParaCidadao = (d: any) => ({
  difundida: "✅ Sua denúncia foi encaminhada ao órgão competente da sua região.",
  encerrada: "✅ Atendimento da central encerrado. Obrigado por ajudar a proteger os animais.",
  descartada: "ℹ️ A central analisou e não encaminhou esta denúncia (informações insuficientes ou repetida).",
}[String(d?.status)] ?? "🕐 Sua denúncia está com a central e será encaminhada ao órgão competente.");

const ALFA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const gerarProtocoloDenuncia = (bytes: Uint8Array, agora = Date.now()) =>
  `DP${new Date(agora).getFullYear()}-${Array.from(bytes.slice(0, 6), (b) => ALFA[b % ALFA.length]).join("")}`;
export const lerProtocolo = (t: any) => { const m = String(t ?? "").toUpperCase().replace(/\s/g, "").match(/DP\d{4}-?[A-Z0-9]{6}/); return m ? m[0].replace(/^(DP\d{4})-?/, "$1-") : null; };

const txt = (v: any, max: number) => String(v ?? "").trim().slice(0, max);
export type DadosDenuncia = {
  tipo: string; especie?: string; especie_outra?: string; quantidade?: string; uf: string; municipio: string; bairro?: string; endereco: string; referencia?: string;
  latitude?: number | null; longitude?: number | null; local?: string; frequencia?: string; responsavel?: string; descricao: string;
  fotos?: string[]; canal: "app" | "whatsapp" | "site" | "painel"; bytes: Uint8Array; agora?: number;
  /** PUCs escolhidos por quem denuncia (vazio = a central decide) */
  destinos?: string[];
};
/** Denúncia anônima pronta para gravar — recusa o que falta para encaminhar (tipo, estado, município, local, relato). */
export function planejarDenunciaPet(d: DadosDenuncia) {
  const agora = d.agora ?? Date.now();
  if (!TIPOS_MAUS_TRATOS.some((t) => t.valor === d.tipo)) throw new Error("Escolha o tipo de maus-tratos.");
  const uf = lerUf(d.uf);
  if (!uf) throw new Error("Informe o estado (ex.: AM).");
  const municipio = txt(d.municipio, 80);
  if (municipio.length < 2) throw new Error("Informe o município — é por ele que sabemos qual órgão vai receber a denúncia.");
  const endereco = txt(d.endereco, 200);
  if (endereco.length < 4 && !(Number.isFinite(d.latitude) && Number.isFinite(d.longitude))) throw new Error("Informe onde está acontecendo (endereço ou ponto de referência).");
  const descricao = txt(d.descricao, 3000);
  if (descricao.length < 10) throw new Error("Conte em poucas palavras o que está acontecendo com o animal.");
  return {
    protocolo: gerarProtocoloDenuncia(d.bytes, agora), tipo: d.tipo, especie: txt(d.especie, 20) || "outro", especie_outra: d.especie === "outro" ? txt(d.especie_outra, 60) : "", quantidade: txt(d.quantidade, 20),
    uf, municipio, municipio_chave: chaveMunicipio(municipio), bairro: txt(d.bairro, 80), endereco, referencia: txt(d.referencia, 200),
    latitude: Number.isFinite(d.latitude as number) ? d.latitude : null, longitude: Number.isFinite(d.longitude as number) ? d.longitude : null,
    local: txt(d.local, 20), frequencia: txt(d.frequencia, 20), responsavel: txt(d.responsavel, 300), descricao,
    fotos: (d.fotos ?? []).filter((f) => /^https?:\/\//.test(String(f))).slice(0, 6),
    canal: d.canal, anonima: true, status: "recebida", recebida_em: agora, difundida_em: null, encerrada_em: null, observacoes_central: "", created_at: agora,
    // PUCs: quem escolheu + quem recebeu por trâmite (a central de cada PUC lista as denúncias com o id dela aqui)
    destinos_escolhidos: [...new Set((d.destinos ?? []).map(String).filter(Boolean))].slice(0, 10),
    pucs: [...new Set((d.destinos ?? []).map(String).filter(Boolean))].slice(0, 10),
  };
}

/** Órgãos que recebem: os do MUNICÍPIO + os de todo o ESTADO (município vazio), ativos e com e-mail. */
export function orgaosParaDenuncia(orgaos: any[], uf: any, municipio: any): any[] {
  const u = String(uf ?? "").toUpperCase(), m = chaveMunicipio(municipio);
  return (orgaos ?? []).filter((o) => ehOrgao(o) && pucAtivo(o) && String(o.uf ?? "").toUpperCase() === u && emailsDoOrgao(o).length
    && (!String(o.municipio ?? "").trim() || chaveMunicipio(o.municipio) === m));
}
export const emailsDoOrgao = (o: any): string[] =>
  String(o?.emails ?? "").split(/[;,\s]+/).map((e) => e.trim().toLowerCase()).filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));

/** Linhas do documento (PDF e e-mail) — sem nenhum dado de quem denunciou. */
export function linhasDocumento(d: any): [string, string][] {
  const data = (t: any) => (Number(t) ? new Date(Number(t)).toLocaleString("pt-BR", { timeZone: "America/Manaus" }) : "—");
  const r = (lista: readonly { valor: string; rotulo: string }[], v: any) => lista.find((x) => x.valor === v)?.rotulo ?? "—";
  return [
    ["Protocolo", d.protocolo], ["Recebida em", data(d.recebida_em)], ["Tipo", rotuloTipoDenuncia(d.tipo)],
    ["Animal", `${rotuloEspecieDenuncia(d.especie, d.especie_outra)}${d.quantidade ? ` (${d.quantidade})` : ""}`],
    ["Estado / município", `${nomeUf(d.uf)} (${d.uf}) — ${d.municipio}`], ["Bairro", d.bairro || "—"], ["Endereço", d.endereco || "—"],
    ["Ponto de referência", d.referencia || "—"], ["Localização", Number.isFinite(d.latitude) ? `${Number(d.latitude).toFixed(6)}, ${Number(d.longitude).toFixed(6)} (https://maps.google.com/?q=${d.latitude},${d.longitude})` : "—"],
    ["Local", r(LOCAIS_DENUNCIA, d.local)], ["Frequência", r(FREQUENCIAS_DENUNCIA, d.frequencia)], ["Responsável (se conhecido)", d.responsavel || "—"],
    ["Relato", d.descricao], ["Canal", d.canal === "whatsapp" ? "WhatsApp" : d.canal === "app" ? "App PetGo360" : d.canal === "site" ? "Site" : "Central"],
  ];
}
// ── QUEM PODE USAR (dono, 12/11/2026): decisão da operação, configurada no painel (Central → parâmetros do atendimento) ──
// `configuracoes` grupo "denuncia_pet", chave "acesso": "todos" (livre, padrão) ou "assinantes" (só quem tem plano pago).
export const ACESSOS_DENUNCIA = ["todos", "assinantes"] as const;
export type AcessoDenuncia = (typeof ACESSOS_DENUNCIA)[number];
export const ROTULOS_ACESSO_DENUNCIA: Record<AcessoDenuncia, string> = { todos: "Livre para todos (grátis)", assinantes: "Só para assinantes (plano pago)" };
/** Lê o parâmetro "acesso" de uma lista de `configuracoes` (padrão: livre). */
export function acessoDenuncia(configuracoes: any[]): AcessoDenuncia {
  const v = String((configuracoes ?? []).find((c) => c?.grupo === GRUPO_PARAMETROS_DENUNCIA && c?.chave === "acesso" && c?.status !== "inativo")?.valor ?? "").trim().toLowerCase();
  return v === "assinantes" ? "assinantes" : "todos";
}
const ms = (v: any) => (typeof v === "number" ? v : typeof v?.toMillis === "function" ? v.toMillis() : Number(new Date(v ?? 0).getTime()) || 0);
/** Pode denunciar? null = sim; senão, a mensagem. `cliente` = o tutor (null = sem conta). Só CONFERE — a denúncia não guarda quem é. */
export function motivoSemAcessoDenuncia(acesso: AcessoDenuncia, cliente: Record<string, any> | null | undefined, agora = Date.now()): string | null {
  if (acesso === "todos") return null;
  if (String(cliente?.nivel ?? "") === "99") return null;
  if (cliente && ms(cliente.recursos_ate?.backup_nuvem) > agora) return null;
  return cliente
    ? `O ${NOME_SERVICO} está disponível para assinantes. Assine o Backup na nuvem no app (com dias grátis) para denunciar.`
    : `O ${NOME_SERVICO} está disponível para assinantes do PetGo360. Baixe o app, crie sua conta e assine (com dias grátis) para denunciar.`;
}

export const AVISO_SIGILO = "DENÚNCIA ANÔNIMA — a identidade do denunciante não é registrada pelo PetGo360. Documento de uso exclusivo do órgão destinatário; não divulgar.";

// ═══════════════ PUCs — PONTOS DE RECEBIMENTO (dono, 18/11/2026) ═══════════════
// Cada denúncia, além do e-mail, cai na CENTRAL de quem a recebe (PUC = ponto único de contato): ÓRGÃO competente (secretaria,
// delegacia, promotoria...), ONG ou PROTETOR independente. Quem denuncia pode ESCOLHER para quem enviar (opcional, vários; vazio
// = a central do PetGo decide). Cada PUC trata, conversa com o denunciante PELO PROTOCOLO (anônimo) e ENCAMINHA a um ou mais
// órgãos (trâmite). Órgãos e estados usam o PAINEL; ONGs e protetores, o PORTAL no /admin do site (se cadastram e esperam a
// APROVAÇÃO da central). Mesmo cadastro (`orgaos_denuncia`), mesma central nos dois.
export const TIPOS_PUC = ["orgao", "ong", "protetor"] as const;
export type TipoPuc = (typeof TIPOS_PUC)[number];
export const ROTULOS_TIPO_PUC: Record<TipoPuc, string> = { orgao: "Órgão competente", ong: "ONG", protetor: "Protetor(a) independente" };
export const tipoPuc = (o: any): TipoPuc => ((TIPOS_PUC as readonly string[]).includes(o?.tipo_puc) ? o.tipo_puc : "orgao");
export const ehOrgao = (o: any) => tipoPuc(o) === "orgao";
/** status do PUC: ativo | inativo | aguardando_aprovacao (ONG que se cadastrou) | recusado */
export const pucAtivo = (o: any) => !["inativo", "aguardando_aprovacao", "recusado"].includes(String(o?.status ?? "ativo"));
export const STATUS_PUC = ["ativo", "inativo", "aguardando_aprovacao", "recusado"] as const;
export const ROTULOS_STATUS_PUC: Record<string, string> = { ativo: "Ativo", inativo: "Inativo", aguardando_aprovacao: "Aguardando aprovação", recusado: "Recusado" };
/** Perfil do usuário de um PUC (painel ou portal) — vê só as denúncias do PUC dele (`usuarios.id_orgaos_denuncia`). */
export const PERFIL_PUC = "puc";
export const PERMISSAO_CENTRAL_PUC = "menu.petgo360.denuncias.central";

/** PUCs que atendem o local (estado + município; município vazio = todo o estado), ativos — para quem denuncia escolher. */
export function pucsDaRegiao(pucs: any[], uf: any, municipio: any): { orgaos: any[]; ongs: any[] } {
  const u = String(uf ?? "").toUpperCase(), m = chaveMunicipio(municipio);
  const daqui = (pucs ?? []).filter((o) => pucAtivo(o) && String(o.uf ?? "").toUpperCase() === u && (!String(o.municipio ?? "").trim() || chaveMunicipio(o.municipio) === m))
    .sort((a, b) => Number(!!String(b.municipio ?? "").trim()) - Number(!!String(a.municipio ?? "").trim()) || String(a.nome).localeCompare(String(b.nome)));
  return { orgaos: daqui.filter(ehOrgao), ongs: daqui.filter((o) => !ehOrgao(o)) };
}
export const nomePuc = (o: any) => String(o?.sigla ? `${o.nome} (${o.sigla})` : o?.nome ?? "—");

// ── ETAPAS (a barra do atendimento): Recebida → Em análise → Encaminhada → Concluída ──
export const ETAPAS_DENUNCIA = ["recebida", "em_analise", "encaminhada", "concluida"] as const;
export type EtapaDenuncia = (typeof ETAPAS_DENUNCIA)[number];
export const ROTULOS_ETAPA: Record<EtapaDenuncia, string> = { recebida: "Recebida", em_analise: "Em análise", encaminhada: "Encaminhada", concluida: "Concluída" };
/** Etapa da denúncia na central do PetGo (status geral). */
export const etapaDaDenuncia = (d: any): EtapaDenuncia =>
  d?.status === "difundida" ? "encaminhada" : ["encerrada", "descartada"].includes(d?.status) ? "concluida" : ["em_analise", "sem_orgao"].includes(d?.status) ? "em_analise" : "recebida";

// ── TRÂMITE: a denúncia na central de UM PUC (um documento por PUC × denúncia) ──
export const STATUS_TRAMITE = ["recebida", "em_analise", "encaminhada", "concluida"] as const;
export type StatusTramite = (typeof STATUS_TRAMITE)[number];
export const ORIGENS_TRAMITE = { cidadao: "Escolhido por quem denunciou", central: "Encaminhada pela central do PetGo", puc: "Encaminhada por outro ponto" } as const;
/** id fixo do trâmite (um por PUC × denúncia — encaminhar de novo não duplica) */
export const idTramite = (idDenuncia: any, idPuc: any) => `${idDenuncia}_${idPuc}`;
export function planejarTramite(p: { denuncia: any; puc: any; origem: keyof typeof ORIGENS_TRAMITE; deNome?: string; idPucOrigem?: string | null; nota?: string; agora?: number }) {
  const agora = p.agora ?? Date.now();
  return {
    id: idTramite(p.denuncia.id, p.puc.id),
    id_denuncias_pet: String(p.denuncia.id), protocolo: String(p.denuncia.protocolo ?? ""), id_orgaos_denuncia: String(p.puc.id), puc_nome: nomePuc(p.puc), tipo_puc: tipoPuc(p.puc),
    origem: p.origem, id_orgaos_denuncia_origem: p.idPucOrigem ?? null, origem_nome: String(p.deNome ?? (p.origem === "cidadao" ? "Denunciante" : "Central PetGo")),
    nota: String(p.nota ?? "").slice(0, 1000), status: "recebida" as StatusTramite, assumido_por: "", id_usuarios_assumido: null,
    historico: [{ em: agora, status: "recebida", texto: `${ORIGENS_TRAMITE[p.origem]}${p.deNome ? ` (${p.deNome})` : ""}`, por: String(p.deNome ?? "") }],
    created_at: agora, updated_at: agora,
  };
}
/** Muda a situação do trâmite e registra no histórico. */
export function avancarTramite(t: any, status: StatusTramite, por: string, texto: string, agora = Date.now()) {
  if (!(STATUS_TRAMITE as readonly string[]).includes(status)) throw new Error("Situação inválida.");
  return { status, updated_at: agora, historico: [...(t?.historico ?? []), { em: agora, status, texto: String(texto).slice(0, 300), por }] };
}

// ── CONVERSA PELO PROTOCOLO: mesmo formato das mensagens do chat dos sites (texto, foto, vídeo, áudio, documento, localização) ──
export const TIPOS_MENSAGEM = ["text", "image", "video", "audio", "document", "location"] as const;
export type TipoMensagem = (typeof TIPOS_MENSAGEM)[number];
export type MensagemDenuncia = { type: TipoMensagem; body?: string; file?: string; mime_type?: string; nome_file?: string; latitude?: number; longitude?: number; endereco?: string };
/** Mensagem pronta para gravar em `denuncias_pet_mensagens`. de = "denunciante" | "puc" | "central". Denunciante NUNCA leva identificação. */
export function planejarMensagemDenuncia(p: { denuncia: any; de: "denunciante" | "puc" | "central"; m: MensagemDenuncia; autor?: string; idPuc?: string | null; pucNome?: string; canal?: string; agora?: number }) {
  const agora = p.agora ?? Date.now(), m = p.m;
  if (!(TIPOS_MENSAGEM as readonly string[]).includes(m.type)) throw new Error("Tipo de mensagem inválido.");
  const body = String(m.body ?? "").trim().slice(0, 4000);
  if (m.type === "text" && !body) throw new Error("Escreva a mensagem.");
  if (["image", "video", "audio", "document"].includes(m.type) && !/^https?:\/\//.test(String(m.file ?? ""))) throw new Error("Arquivo não enviado.");
  if (m.type === "location" && !(Number.isFinite(Number(m.latitude)) && Number.isFinite(Number(m.longitude)))) throw new Error("Localização inválida.");
  return {
    id_denuncias_pet: String(p.denuncia.id), protocolo: String(p.denuncia.protocolo ?? ""), de: p.de,
    autor: p.de === "denunciante" ? "Denunciante" : String(p.autor ?? "").slice(0, 80), id_orgaos_denuncia: p.de === "puc" ? String(p.idPuc ?? "") : null,
    puc_nome: p.de === "denunciante" ? "" : String(p.pucNome ?? (p.de === "central" ? "Central PetGo" : "")),
    type: m.type, body, file: m.file ?? "", mime_type: m.mime_type ?? "", nome_file: m.nome_file ?? "",
    latitude: m.type === "location" ? Number(m.latitude) : null, longitude: m.type === "location" ? Number(m.longitude) : null, endereco: String(m.endereco ?? "").slice(0, 200),
    canal: p.canal ?? "", lida_denunciante: p.de === "denunciante", lida_central: p.de !== "denunciante", criado_em: agora, created_at: agora,
  };
}
/** Texto da mensagem para o WhatsApp / aviso (mídia vira link). */
export function textoDaMensagem(m: any): string {
  const quem = m.de === "denunciante" ? "Você" : m.puc_nome || "Central";
  const rot: Record<string, string> = { image: "📷 Foto", video: "🎥 Vídeo", audio: "🎤 Áudio", document: "📄 Arquivo" };
  const corpo = m.type === "text" ? m.body : m.type === "location" ? `📍 Localização: https://maps.google.com/?q=${m.latitude},${m.longitude}${m.endereco ? ` (${m.endereco})` : ""}`
    : `${rot[String(m.type)] ?? "📎"}: ${m.file}${m.body && m.body !== m.nome_file ? `\n${m.body}` : ""}`;
  return `*${quem}:* ${corpo}`;
}
/** Tipo da mensagem pelo MIME do arquivo. */
export const tipoPorMime = (mime: any): TipoMensagem => { const t = String(mime ?? ""); return t.startsWith("image") ? "image" : t.startsWith("video") ? "video" : t.startsWith("audio") ? "audio" : "document"; };

// ── CADASTRO DE ONG / PROTETOR pelo site (aguarda a aprovação da central) ──
export function planejarPedidoPuc(p: { tipo: string; nome: string; documento: string; responsavel: string; email: string; telefone: string; uf: string; municipio: string; descricao?: string; site?: string; senha: { senha_hash: string; senha_salt: string; senha_iteracoes: number }; agora?: number }) {
  const agora = p.agora ?? Date.now();
  if (!["ong", "protetor"].includes(p.tipo)) throw new Error("Escolha: ONG ou protetor(a) independente.");
  const nome = txt(p.nome, 150); if (nome.length < 3) throw new Error("Informe o nome.");
  const doc = String(p.documento ?? "").replace(/\D/g, "");
  if (p.tipo === "ong" ? doc.length !== 14 : doc.length !== 11) throw new Error(p.tipo === "ong" ? "Informe o CNPJ da ONG (14 números)." : "Informe o CPF (11 números).");
  const email = String(p.email ?? "").trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("E-mail inválido.");
  const uf = lerUf(p.uf); if (!uf) throw new Error("Informe o estado.");
  if (String(p.telefone ?? "").replace(/\D/g, "").length < 10) throw new Error("Informe o telefone com DDD.");
  if (!p.senha?.senha_hash) throw new Error("Crie uma senha.");
  return {
    tipo_puc: p.tipo, nome, documento: doc, responsavel: txt(p.responsavel, 100), email, telefone: String(p.telefone).replace(/\D/g, ""), uf, municipio: txt(p.municipio, 80),
    descricao: txt(p.descricao, 1000), site: txt(p.site, 200), ...p.senha, status: "aguardando_aprovacao", created_at: agora, updated_at: agora,
  };
}
