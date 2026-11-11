// GERADO por "npm run sync:app" no painel (projetos/petGo360) para o site público (site/petGo), a partir de
// shared/compartilhado/achados.ts — NÃO EDITAR AQUI: altere no painel e sincronize.

// PETS PERDIDOS E ENCONTRADOS (dono, 11/11/2026) — serviço GRATUITO do PetGo360, para qualquer pessoa (tutor ou não),
// pelo app, pelo WhatsApp e pelo site (aba "Pets perdidos", como os "procurados").
//
// Como funciona:
//   1. Alguém registra uma OCORRÊNCIA com foto(s): "perdi meu pet" (tipo perdido) ou "encontrei um pet" (tipo encontrado),
//      com espécie, onde (localização), quando e o contato de quem registrou.
//   2. O back-end (petall360) faz o RECONHECIMENTO da foto: gera a "assinatura" da imagem (vetor de características) e
//      compara com as ocorrências ABERTAS do tipo contrário (perdido × encontrado), mesma espécie, perto e recentes.
//   3. Achou parecido: grava as CORRESPONDÊNCIAS nas duas ocorrências e AVISA — o tutor (notificação no app + WhatsApp)
//      recebe quem achou, onde e o contato; quem achou recebe o aviso de que o tutor foi informado.
//      Não achou: a ocorrência fica aberta (aparece no site) e é comparada com cada nova que chegar.
//   4. O tutor confirma "É o meu pet!" → as duas viram "reencontrado".
//
// O reconhecimento é por SEMELHANÇA de imagem (não é prova): a confirmação é sempre de quem vê as fotos.
// Datas em milissegundos. Sem imports de fora da pasta (o arquivo vai para o app, o site e o back-end).

export const COLECAO_OCORRENCIAS = "pets_ocorrencias";
/** Vetor da foto (assinatura) — fora do documento público (é grande e não serve para a tela). */
export const COLECAO_VETORES = "pets_ocorrencias_vetores";
/** Contato de quem registrou — fora do documento público (o site não mostra telefone). */
export const COLECAO_CONTATOS = "pets_ocorrencias_contatos";

export const TIPOS_OCORRENCIA = ["perdido", "encontrado"] as const;
export type TipoOcorrencia = (typeof TIPOS_OCORRENCIA)[number];
export const ROTULOS_TIPO_OCORRENCIA: Record<string, string> = { perdido: "Perdido", encontrado: "Encontrado" };

export const STATUS_OCORRENCIA = ["processando", "aberta", "reencontrado", "encerrada"] as const;
export type StatusOcorrencia = (typeof STATUS_OCORRENCIA)[number];
export const ROTULOS_STATUS_OCORRENCIA: Record<string, string> = {
  processando: "Analisando a foto", aberta: "Procurando", reencontrado: "Reencontrado", encerrada: "Encerrada",
};
export const CANAIS_OCORRENCIA = ["app", "whatsapp", "site", "painel"] as const;

/** Parâmetros do reconhecimento (padrão; o painel pode trocar em Parâmetros, grupo "achados"). */
export const PADRAO_ACHADOS = {
  /** Semelhança mínima (cosseno 0–1) para avisar. */
  limiar: 0.78,
  /** Raio de busca em km (sem localização em uma das duas, não filtra por distância). */
  raioKm: 60,
  /** Ocorrências mais antigas que isso não entram na comparação. */
  diasValidade: 120,
  /** Quantas correspondências guardar por ocorrência. */
  maxCorrespondencias: 5,
  maxFotos: 4,
};
export type ConfigAchados = typeof PADRAO_ACHADOS;
export function configAchados(parametros: Record<string, any> | null | undefined): ConfigAchados {
  const p = parametros ?? {};
  const num = (v: any, d: number) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);
  return {
    limiar: Math.min(0.99, num(p.limiar_semelhanca, PADRAO_ACHADOS.limiar)),
    raioKm: num(p.raio_km, PADRAO_ACHADOS.raioKm),
    diasValidade: num(p.dias_validade, PADRAO_ACHADOS.diasValidade),
    maxCorrespondencias: num(p.max_correspondencias, PADRAO_ACHADOS.maxCorrespondencias),
    maxFotos: PADRAO_ACHADOS.maxFotos,
  };
}

const ms = (v: any): number | null => {
  if (v == null || v === "") return null;
  if (typeof v === "number") return v;
  if (typeof v?.toMillis === "function") return v.toMillis();
  if (typeof v?.seconds === "number") return v.seconds * 1000;
  const n = Date.parse(String(v));
  return Number.isFinite(n) ? n : null;
};
export const soDigitos = (v: any) => String(v ?? "").replace(/\D/g, "");

// ── Montagem ─────────────────────────────────────────────────────────────────
export type NovaOcorrencia = {
  tipo: TipoOcorrencia;
  especie: string;
  fotos: string[];
  nome_pet?: string | null;
  descricao?: string | null;
  cor?: string | null;
  porte?: string | null;
  sexo?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  endereco?: string | null;
  visto_em?: number | null;
  contato_nome: string;
  contato_telefone: string;
  canal: (typeof CANAIS_OCORRENCIA)[number];
  id_clientes?: string | null;
  id_pets?: string | null;
  /** Ocorrência que a pessoa diz ter visto (botão "Vi este pet" do site). */
  id_alvo?: string | null;
};

/** Confere e monta os 2 documentos (público e contato). Lança a mensagem para a pessoa se faltar algo. */
export function planejarOcorrencia(d: NovaOcorrencia, agora = Date.now()): { ocorrencia: Record<string, any>; contato: Record<string, any> } {
  if (!TIPOS_OCORRENCIA.includes(d.tipo)) throw new Error("Diga se o pet foi perdido ou encontrado.");
  if (!String(d.especie ?? "").trim()) throw new Error("Informe a espécie (cão, gato...).");
  const fotos = (d.fotos ?? []).filter((f) => /^https?:\/\//.test(String(f))).slice(0, PADRAO_ACHADOS.maxFotos);
  if (!fotos.length && !d.id_alvo) throw new Error("Envie pelo menos uma foto do pet — é com ela que fazemos o reconhecimento.");
  const tel = soDigitos(d.contato_telefone);
  if (tel.length < 10) throw new Error("Informe um telefone com DDD para avisarmos você.");
  if (!String(d.contato_nome ?? "").trim()) throw new Error("Informe o seu nome.");
  if (d.tipo === "perdido" && !String(d.nome_pet ?? "").trim()) throw new Error("Informe o nome do pet.");
  const lat = Number(d.latitude), lng = Number(d.longitude);
  const temLocal = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
  const visto = ms(d.visto_em) ?? agora;
  if (visto > agora + 60_000) throw new Error("A data não pode ser no futuro.");
  return {
    ocorrencia: {
      tipo: d.tipo, especie: String(d.especie), fotos,
      nome_pet: String(d.nome_pet ?? "").trim() || null,
      descricao: String(d.descricao ?? "").trim().slice(0, 600) || null,
      cor: String(d.cor ?? "").trim() || null, porte: d.porte || null, sexo: d.sexo || null,
      latitude: temLocal ? lat : null, longitude: temLocal ? lng : null,
      endereco: String(d.endereco ?? "").trim().slice(0, 200) || null,
      visto_em: visto, canal: d.canal, id_clientes: d.id_clientes ?? null, id_pets: d.id_pets ?? null, id_alvo: d.id_alvo ?? null,
      // primeiro nome só (o site mostra "Registrado por Ana")
      contato_primeiro_nome: String(d.contato_nome).trim().split(/\s+/)[0],
      status: fotos.length ? "processando" : "aberta",
      correspondencias: [], criado_em: agora, atualizado_em: agora,
    },
    contato: { nome: String(d.contato_nome).trim(), telefone: tel, criado_em: agora },
  };
}

// ── Comparação ───────────────────────────────────────────────────────────────
export function cosseno(a: number[], b: number[]): number {
  if (!a?.length || a.length !== b?.length) return 0;
  let p = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { p += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? p / Math.sqrt(na * nb) : 0;
}
/** Maior semelhança entre as fotos de uma e as da outra (cada ocorrência pode ter várias fotos). */
export function semelhanca(vetoresA: number[][], vetoresB: number[][]): number {
  let melhor = 0;
  for (const a of vetoresA ?? []) for (const b of vetoresB ?? []) melhor = Math.max(melhor, cosseno(a, b));
  return melhor;
}
export function distanciaKm(a: { latitude?: any; longitude?: any }, b: { latitude?: any; longitude?: any }): number | null {
  const [la1, lo1, la2, lo2] = [a?.latitude, a?.longitude, b?.latitude, b?.longitude].map(Number);
  if (![la1, lo1, la2, lo2].every(Number.isFinite) || a?.latitude == null || b?.latitude == null) return null;
  const r = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(r(la2 - la1) / 2) ** 2 + Math.cos(r(la1)) * Math.cos(r(la2)) * Math.sin(r(lo2 - lo1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
const mesmaEspecie = (a: string, b: string) => !a || !b || a === "outro" || b === "outro" || a === b;

/** A ocorrência `o` pode ser comparada com `c`? (tipo contrário, aberta, mesma espécie, perto, recente). */
export function podeComparar(o: Record<string, any>, c: Record<string, any>, cfg: ConfigAchados = PADRAO_ACHADOS, agora = Date.now()): boolean {
  if (String(o.id) === String(c.id) || o.tipo === c.tipo || c.status !== "aberta") return false;
  if (!mesmaEspecie(String(o.especie ?? ""), String(c.especie ?? ""))) return false;
  if ((ms(c.criado_em) ?? 0) < agora - cfg.diasValidade * 86400_000) return false;
  const km = distanciaKm(o, c);
  return km == null || km <= cfg.raioKm;
}

export type Correspondencia = { id: string; tipo: string; similaridade: number; distancia_km: number | null; foto: string | null; especie: string; nome_pet: string | null; em: number; descartada?: boolean };

/** Ordena e corta as correspondências (acima do limiar), da mais parecida para a menos. */
export function melhoresCorrespondencias(
  o: Record<string, any>, vetoresO: number[][],
  candidatas: { ocorrencia: Record<string, any>; vetores: number[][] }[],
  cfg: ConfigAchados = PADRAO_ACHADOS, agora = Date.now(),
): Correspondencia[] {
  return candidatas
    .filter((c) => podeComparar(o, c.ocorrencia, cfg, agora))
    .map((c) => ({ c, sim: semelhanca(vetoresO, c.vetores) }))
    .filter((x) => x.sim >= cfg.limiar)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, cfg.maxCorrespondencias)
    .map(({ c, sim }) => ({
      id: String(c.ocorrencia.id), tipo: String(c.ocorrencia.tipo), similaridade: Math.round(sim * 1000) / 1000,
      distancia_km: distanciaKm(o, c.ocorrencia) == null ? null : Math.round(distanciaKm(o, c.ocorrencia)! * 10) / 10,
      foto: c.ocorrencia.fotos?.[0] ?? null, especie: String(c.ocorrencia.especie ?? ""), nome_pet: c.ocorrencia.nome_pet ?? null, em: agora,
    }));
}

/** Junta correspondências novas às que já existiam (sem repetir; mantém as descartadas pelo tutor). */
export function juntarCorrespondencias(antigas: Correspondencia[] | null | undefined, novas: Correspondencia[], max = PADRAO_ACHADOS.maxCorrespondencias): Correspondencia[] {
  const mapa = new Map<string, Correspondencia>();
  for (const c of antigas ?? []) mapa.set(String(c.id), c);
  for (const c of novas) { const v = mapa.get(c.id); mapa.set(c.id, v ? { ...c, descartada: v.descartada } : c); }
  return [...mapa.values()].sort((a, b) => Number(!!a.descartada) - Number(!!b.descartada) || b.similaridade - a.similaridade).slice(0, Math.max(max, 1) * 2);
}

export const porcentagem = (sim: number) => `${Math.round(Math.max(0, Math.min(1, sim)) * 100)}%`;

// ── Textos dos avisos (WhatsApp e app) ───────────────────────────────────────
const quando = (v: any) => { const d = new Date(ms(v) ?? Date.now()); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`; };
const onde = (o: Record<string, any>) => o.endereco || (o.latitude != null ? `https://maps.google.com/?q=${o.latitude},${o.longitude}` : "local não informado");

/** Para o TUTOR (dono do perdido): alguém encontrou um pet parecido. */
export function textoAvisoTutor(perdido: Record<string, any>, encontrado: Record<string, any>, contatoQuemAchou: { nome?: string; telefone?: string } | null, sim: number): string {
  return [
    `🐾 *PetGo360 — possível reencontro!*`,
    `Alguém registrou um pet ENCONTRADO parecido com ${perdido.nome_pet || "o seu pet"} (${porcentagem(sim)} de semelhança na foto).`,
    `📍 Onde: ${onde(encontrado)}`,
    `📅 Visto em: ${quando(encontrado.visto_em)}`,
    encontrado.descricao ? `📝 ${encontrado.descricao}` : "",
    encontrado.fotos?.[0] ? `📷 Foto: ${encontrado.fotos[0]}` : "",
    contatoQuemAchou?.telefone ? `📞 Quem encontrou: ${contatoQuemAchou.nome || ""} — wa.me/${soDigitos(contatoQuemAchou.telefone)}` : "",
    `Confira a foto antes de combinar o encontro e, se for o seu pet, marque "É o meu pet" no app PetGo360. Combine em local público.`,
  ].filter(Boolean).join("\n");
}
/** Para QUEM ACHOU: o tutor foi avisado. */
export function textoAvisoQuemAchou(encontrado: Record<string, any>, perdido: Record<string, any>, sim: number): string {
  return [
    `🐾 *PetGo360 — obrigado por ajudar!*`,
    `O pet que você encontrou é parecido (${porcentagem(sim)}) com ${perdido.nome_pet ? `*${perdido.nome_pet}*` : "um pet"} que está sendo procurado${perdido.contato_primeiro_nome ? ` por ${perdido.contato_primeiro_nome}` : ""}.`,
    `Já avisamos o tutor com o seu contato — ele deve falar com você em breve.`,
    `Se puder, mantenha o pet em segurança até lá. Combine a entrega em local público.`,
  ].join("\n");
}
/** Para quem registrou e ainda não houve correspondência. */
export function textoOcorrenciaRegistrada(o: Record<string, any>, protocolo: string): string {
  return o.tipo === "perdido"
    ? `🐾 Registramos ${o.nome_pet ? `*${o.nome_pet}*` : "o seu pet"} como PERDIDO (protocolo ${protocolo}). Ainda não há um pet encontrado parecido — cada novo registro é comparado com a foto e avisamos você na hora. O pet também aparece na página de pets perdidos do site PetGo360.`
    : `🐾 Registramos o pet ENCONTRADO (protocolo ${protocolo}). Ainda não achamos um tutor procurando um pet parecido — cada novo registro é comparado e avisamos você e o tutor na hora. Obrigado por ajudar!`;
}
export const protocoloOcorrencia = (id: string | number, agora = Date.now()) => `PP-${new Date(agora).getFullYear()}-${String(id).replace(/\D/g, "").padStart(6, "0").slice(-6)}`;

/** O que o SITE mostra (sem contato). */
export function ocorrenciaPublica(o: Record<string, any>) {
  return {
    id: String(o.id), tipo: o.tipo, especie: o.especie, nome_pet: o.nome_pet ?? null, descricao: o.descricao ?? null, cor: o.cor ?? null,
    porte: o.porte ?? null, sexo: o.sexo ?? null, fotos: o.fotos ?? [], endereco: o.endereco ?? null, latitude: o.latitude ?? null, longitude: o.longitude ?? null,
    visto_em: ms(o.visto_em), status: o.status, contato_primeiro_nome: o.contato_primeiro_nome ?? null, criado_em: ms(o.criado_em),
  };
}
