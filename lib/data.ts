// Leitura pública do site PetHub360 — o que o painel (petGo360) grava em
// dados/{tenant}/<colecao>. Só coleções de vitrine/conteúdo: NUNCA ler
// clientes, pets, reservas ou qualquer dado pessoal aqui.
//
// Tempo real, no mesmo padrão do portal181:
// - `listarX` / `buscarX` — leitura pontual (getDocs) no servidor Node, a
//   cada acesso (force-dynamic): o HTML já sai com o dado atual (SEO);
// - `subscribeX` — listener (onSnapshot) no navegador: depois de carregar,
//   tudo (configuração, vitrine, páginas, avisos, avaliações) acompanha o
//   Firestore — editou no painel, muda na tela aberta sem recarregar.
//
// Regras de publicação (espelham o painel — schemas em
// petGo360/shared/shemas/petgo360):
// - empresas/unidades/servicos_parceiros/categorias: status "ativo";
// - vantagens: status "ativa", no período e com "site" em `canais`;
// - campanhas_cupons_off: status "ativa", no período, "site" em `canais`
//   e com saldo (quantidade_disponivel > 0);
// - avaliacoes: status "publicada";
// - paginas: "publicada"; avisos: "ativo" e dentro de inicio_em/fim_em.
//
// Só dado real, sem conteúdo de exemplo. Falha de leitura no servidor LANÇA
// erro de propósito: no build ele aparece na hora; em produção (ISR) o Next
// continua servindo a última versão boa da página em vez de gravar em cache
// uma página vazia. Tenant é obrigatório (NEXT_PUBLIC_PETHUB_PATH).
import { getAll, getAllOnce } from "@/lib/firebase/gen";
import type { Unsubscribe } from "firebase/firestore";
import type { Aviso, Avaliacao, Beneficio, Categoria, Configuracao, Pagina, Parceiro, ServicoParceiro, Unidade, Vitrine } from "@/types/conteudo";

// Listener no cliente: se falhar (sem rede, regra), mantém o que já está na
// tela — que veio do servidor — em vez de esvaziar.
function subscrever<T>(colecao: string, mapear: (docs: any[]) => T, callback: (dados: T) => void): Unsubscribe {
  try {
    return getAll(colecao, (docs) => callback(mapear(docs)));
  } catch (e) {
    console.error(`[pethub] listener de ${colecao} indisponível`, e);
    return () => {};
  }
}

// ── Normalização ─────────────────────────────────────────────────────────
export const ms = (v: any): number | null => {
  if (!v) return null;
  if (typeof v?.toDate === "function") return v.toDate().getTime();
  if (typeof v?.seconds === "number") return v.seconds * 1000;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? null : t;
};
const txt = (v: any) => (typeof v === "string" ? v : "");
const url = (v: any) => (typeof v === "string" && v.trim() ? v : null);
const num = (v: any, padrao = 0) => (typeof v === "number" && Number.isFinite(v) ? v : padrao);
const numOuNull = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const HEX = /^#[0-9A-Fa-f]{6}$/;
const noPeriodo = (d: any, agora: number) => { const i = ms(d.inicio_em); const f = ms(d.fim_em); return (i === null || i <= agora) && (f === null || f > agora); };
const noSite = (d: any) => Array.isArray(d.canais) && d.canais.includes("site");
const porOrdem = <T extends { ordem: number }>(a: T, b: T) => a.ordem - b.ordem;

// ── Configuração do site (registro único) ───────────────────────────────
// Sem registro ativo em Portal Pet → Configuração do site: só a marca e as
// cores; o resto fica em branco (seções que dependem disso não aparecem).
// Nada de telefone, número ou texto inventado.
export const CONFIGURACAO_BASE: Configuracao = {
  nomeSite: "PetHub360", slogan: "", logoUrl: null, corPrimaria: "#14523d", corDestaque: "#f36b21",
  heroChamada: "", heroTitulo: "PetHub360", heroTituloDestaque: "", heroTexto: "", heroImagemUrl: null,
  ctaPrincipalTexto: "Conheça o PetGo360", ctaPrincipalLink: "/petgo360", ctaSecundarioTexto: "Quero ser parceiro", ctaSecundarioLink: "/quero-ser-parceiro",
  numeros: [], appStoreUrl: "", googlePlayUrl: "", whatsapp: "", email: "", telefone: "", endereco: "", redes: [],
  textoRodape: "", seoTitulo: "", seoDescricao: "",
  menu: { solucoes: true, servicos: true, clube: true, parceiros: true, petgo360: true, paraParceiros: true },
  quantidadeDestaques: 8,
};
// O WhatsApp do site é o "Telefone / WhatsApp" da configuração: só dígitos,
// e sem DDI (10–11 dígitos) assume Brasil (55).
const numeroWhatsapp = (telefone: string) => {
  const d = telefone.replace(/\D/g, "");
  return d.length === 10 || d.length === 11 ? `55${d}` : d;
};
function mapearConfiguracao(docs: any[]): Configuracao {
  const d = docs.find((x) => x.status === "ativo") ?? null;
  if (!d) return CONFIGURACAO_BASE;
  const p = CONFIGURACAO_BASE;
  const numeros = ([
    ["numero_parceiros", "Parceiros", "na rede PetHub360"],
    ["numero_tutores", "Tutores", "usando o PetGo360"],
    ["numero_atendimentos", "Atendimentos", "realizados com parceiros"],
    ["numero_cidades", "Cidades", "atendidas"],
  ] as const)
    .filter(([campo]) => typeof d[campo] === "number")
    .map(([campo, rotulo, detalhe]) => ({ rotulo, valor: d[campo] as number, detalhe }));
  const redes = (["instagram", "facebook", "tiktok", "youtube", "linkedin"] as const)
    .map((rede) => ({ rede, url: txt(d[`${rede}_url`]) }))
    .filter((r) => r.url);
  return {
    nomeSite: txt(d.nome_site) || p.nomeSite,
    slogan: txt(d.slogan),
    logoUrl: url(d.logo),
    corPrimaria: HEX.test(d.cor_primaria) ? d.cor_primaria : p.corPrimaria,
    corDestaque: HEX.test(d.cor_destaque) ? d.cor_destaque : p.corDestaque,
    heroChamada: txt(d.hero_chamada),
    heroTitulo: txt(d.hero_titulo) || p.heroTitulo,
    heroTituloDestaque: txt(d.hero_titulo_destaque),
    heroTexto: txt(d.hero_texto),
    heroImagemUrl: url(d.hero_imagem),
    ctaPrincipalTexto: txt(d.cta_principal_texto) || p.ctaPrincipalTexto,
    ctaPrincipalLink: txt(d.cta_principal_link) || p.ctaPrincipalLink,
    ctaSecundarioTexto: txt(d.cta_secundario_texto) || p.ctaSecundarioTexto,
    ctaSecundarioLink: txt(d.cta_secundario_link) || p.ctaSecundarioLink,
    numeros,
    appStoreUrl: txt(d.app_store_url),
    googlePlayUrl: txt(d.google_play_url),
    whatsapp: numeroWhatsapp(txt(d.telefone_contato)),
    email: txt(d.email_contato),
    telefone: txt(d.telefone_contato),
    endereco: txt(d.endereco),
    redes,
    textoRodape: txt(d.texto_rodape),
    seoTitulo: txt(d.seo_titulo),
    seoDescricao: txt(d.seo_descricao),
    menu: {
      solucoes: d.menu_solucoes !== false, servicos: d.menu_servicos !== false, clube: d.menu_clube !== false,
      parceiros: d.menu_parceiros !== false, petgo360: d.menu_petgo360 !== false, paraParceiros: d.menu_para_parceiros !== false,
    },
    quantidadeDestaques: num(d.quantidade_destaques, 8),
  };
}

export const listarConfiguracao = async () => mapearConfiguracao(await getAllOnce("configuracoes_site"));
export const subscribeConfiguracao = (cb: (c: Configuracao) => void) => subscrever("configuracoes_site", mapearConfiguracao, cb);

// ── Páginas ──────────────────────────────────────────────────────────────
function mapearPaginas(docs: any[]): Pagina[] {
  return docs
    .filter((d) => d.status === "publicada" && d.slug)
    .map((d) => ({
      id: String(d.id), titulo: txt(d.titulo), slug: txt(d.slug), resumo: txt(d.resumo), conteudo: txt(d.conteudo),
      imagemUrl: url(d.imagem), local: (["rodape", "menu", "nenhum"].includes(d.local) ? d.local : "rodape") as Pagina["local"],
      submenu: txt(d.submenu), ordem: num(d.ordem), seoDescricao: txt(d.seo_descricao),
    }))
    .sort(porOrdem);
}

export const listarPaginasPublicadas = async () => mapearPaginas(await getAllOnce("paginas"));
export const subscribePaginasPublicadas = (cb: (p: Pagina[]) => void) => subscrever("paginas", mapearPaginas, cb);
export const buscarPaginaPorSlug = async (slug: string) => (await listarPaginasPublicadas()).find((p) => p.slug === slug) ?? null;
export const subscribePaginaPorSlug = (slug: string, cb: (p: Pagina | null) => void) =>
  subscrever("paginas", (docs) => mapearPaginas(docs).find((p) => p.slug === slug) ?? null, cb);

// ── Avisos ───────────────────────────────────────────────────────────────
function mapearAvisos(docs: any[]): Aviso[] {
  const agora = Date.now();
  return docs
    .filter((d) => d.status === "ativo" && noPeriodo(d, agora))
    .map((d) => ({
      id: String(d.id), titulo: txt(d.titulo), mensagem: txt(d.mensagem), imagemUrl: url(d.imagem),
      linkUrl: txt(d.link_url), linkTexto: txt(d.link_texto), tipo: (d.tipo === "modal" ? "modal" : "faixa") as Aviso["tipo"],
      ordem: num(d.ordem), versao: String(ms(d.updated_at) ?? ms(d.created_at) ?? ""),
    }))
    .sort(porOrdem);
}

export const listarAvisosAtivos = async () => mapearAvisos(await getAllOnce("avisos"));
export const subscribeAvisosAtivos = (cb: (a: Aviso[]) => void) => subscrever("avisos", mapearAvisos, cb);

// ── Vitrine: categorias, parceiros, benefícios ───────────────────────────
function mapearCategorias(docs: any[]): Categoria[] {
  return docs
    .filter((d) => d.status === "ativo")
    .map((d) => ({ id: String(d.id), nome: txt(d.nome), slug: txt(d.slug), descricao: txt(d.descricao), icone: txt(d.icone), imagemUrl: url(d.imagem), ordem: num(d.ordem) }))
    .sort(porOrdem);
}

function mapearUnidade(d: any): Unidade {
  const endereco = [txt(d.logradouro), txt(d.numero)].filter(Boolean).join(", ");
  return {
    id: String(d.id), idEmpresa: String(d.id_empresas), nome: txt(d.nome), bairro: txt(d.bairro), municipio: txt(d.municipio), uf: txt(d.uf),
    endereco: [endereco, txt(d.bairro)].filter(Boolean).join(" — "),
    latitude: numOuNull(d.latitude), longitude: numOuNull(d.longitude), telefone: txt(d.telefone), whatsapp: txt(d.whatsapp).replace(/\D/g, ""),
    raioAtendimentoKm: numOuNull(d.raio_atendimento_km),
    horarios: Array.isArray(d.horarios_funcionamento) ? d.horarios_funcionamento : [], funciona24h: d.funcionamento_24h === true,
  };
}

function mapearServico(d: any): ServicoParceiro {
  return {
    id: String(d.id), idEmpresa: String(d.id_empresas), idUnidade: d.id_unidades ? String(d.id_unidades) : null,
    idCategoria: d.id_categorias_servicos ? String(d.id_categorias_servicos) : null, nome: txt(d.nome_comercial), descricao: txt(d.descricao),
    valorBase: num(d.valor_base), duracaoMinutos: numOuNull(d.duracao_minutos), aceitaClubeOff: d.aceita_clube_off === true,
    domicilio: typeof d.raio_atendimento_km === "number" && d.raio_atendimento_km > 0,
  };
}

export const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: v % 1 ? 2 : 0 });

function seloVantagem(d: any): string {
  const v = num(d.valor_beneficio);
  switch (d.tipo_beneficio) {
    case "percentual": return `${v}% OFF`;
    case "valor": return `${moeda(v)} OFF`;
    case "gratuidade": return "Grátis";
    case "brinde": return "Brinde";
    case "prioridade_agenda": return "Prioridade";
    case "transporte_gratis": return "Leva e traz grátis";
    default: return "Vantagem";
  }
}

function seloCampanha(d: any): string {
  if (d.tipo_desconto === "percentual") return `${num(d.valor_desconto)}% OFF`;
  if (d.tipo_desconto === "valor") return `${moeda(num(d.valor_desconto))} OFF`;
  if (d.tipo_desconto === "preco_fixo") return `Por ${moeda(num(d.preco_promocional))}`;
  return "OFF";
}

function mapearBeneficios(vantagens: any[], campanhas: any[], empresasAtivas: Set<string>): Beneficio[] {
  const agora = Date.now();
  const v: Beneficio[] = vantagens
    .filter((d) => d.status === "ativa" && noSite(d) && noPeriodo(d, agora) && empresasAtivas.has(String(d.id_empresas)))
    .map((d) => ({
      id: `v-${d.id}`, origem: "vantagem", idEmpresa: String(d.id_empresas), titulo: txt(d.titulo), descricao: txt(d.descricao),
      selo: seloVantagem(d), fimEm: ms(d.fim_em), restantes: null, soMembros: true,
    }));
  const c: Beneficio[] = campanhas
    .filter((d) => d.status === "ativa" && noSite(d) && noPeriodo(d, agora) && num(d.quantidade_disponivel) > 0 && empresasAtivas.has(String(d.id_empresas)))
    .sort((a, b) => Number(b.destaque === true) - Number(a.destaque === true))
    .map((d) => ({
      id: `c-${d.id}`, origem: "cupom_off", idEmpresa: String(d.id_empresas), titulo: txt(d.nome), descricao: txt(d.descricao),
      selo: seloCampanha(d), fimEm: ms(d.fim_em), restantes: num(d.quantidade_disponivel), soMembros: false,
    }));
  return [...c, ...v];
}

export function montarVitrine(emp: any[], uni: any[], sp: any[], cat: any[], vant: any[], camp: any[]): Vitrine {
  const categorias = mapearCategorias(cat);
  const catAtivas = new Set(categorias.map((c) => c.id));
  const unidades = uni.filter((u) => u.status === "ativo").map(mapearUnidade);
  const servicos = sp.filter((s) => s.status === "ativo").map(mapearServico);
  const parceiros: Parceiro[] = emp
    .filter((e) => e.status === "ativo")
    .map((e) => {
      const id = String(e.id);
      const seus = servicos.filter((s) => s.idEmpresa === id);
      return {
        id, nome: txt(e.nome_fantasia), tipo: txt(e.tipo), descricao: txt(e.descricao), logoUrl: url(e.logo), capaUrl: url(e.imagem_capa),
        whatsapp: txt(e.whatsapp).replace(/\D/g, ""), telefone: txt(e.telefone),
        aceitaReservaOnline: e.aceita_reserva_online !== false, aceitaClubeOff: e.aceita_clube_off === true,
        avaliacaoMedia: num(e.avaliacao_media), quantidadeAvaliacoes: num(e.quantidade_avaliacoes),
        destaque: e.destaque_site === true, ordemDestaque: num(e.ordem_destaque),
        unidades: unidades.filter((u) => u.idEmpresa === id), servicos: seus,
        categorias: Array.from(new Set(seus.map((s) => s.idCategoria).filter((c): c is string => !!c && catAtivas.has(c)))),
      };
    })
    // Sem unidade ativa o parceiro não tem onde atender — não entra na vitrine.
    .filter((p) => p.unidades.length > 0)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const beneficios = mapearBeneficios(vant, camp, new Set(parceiros.map((p) => p.id)));
  return { categorias, parceiros, beneficios };
}

const COLECOES_VITRINE = ["empresas", "unidades", "servicos_parceiros", "categorias_servicos", "vantagens", "campanhas_cupons_off"] as const;

export async function listarVitrine(): Promise<Vitrine> {
  const [emp, uni, sp, cat, vant, camp] = await Promise.all(COLECOES_VITRINE.map((c) => getAllOnce(c)));
  return montarVitrine(emp, uni, sp, cat, vant, camp);
}

// Vitrine em tempo real: um listener por coleção; a cada mudança em qualquer
// uma, remonta a vitrine inteira com as mesmas regras de publicação. Só
// emite depois que as 6 chegaram pelo menos uma vez (até lá, a tela fica com
// o que veio do servidor).
export function subscribeVitrine(cb: (v: Vitrine) => void): Unsubscribe {
  const atual: Partial<Record<(typeof COLECOES_VITRINE)[number], any[]>> = {};
  const emitir = () => {
    if (COLECOES_VITRINE.some((c) => !atual[c])) return;
    cb(montarVitrine(atual.empresas!, atual.unidades!, atual.servicos_parceiros!, atual.categorias_servicos!, atual.vantagens!, atual.campanhas_cupons_off!));
  };
  const unsubs = COLECOES_VITRINE.map((c) => subscrever(c, (docs) => docs, (docs) => { atual[c] = docs; emitir(); }));
  return () => unsubs.forEach((u) => u());
}

function mapearAvaliacoes(docs: any[], idEmpresa: string): Avaliacao[] {
  return docs
    .filter((d) => String(d.id_empresas) === idEmpresa && d.status === "publicada")
    .map((d) => ({ id: String(d.id), idEmpresa, nota: num(d.nota), comentario: txt(d.comentario), resposta: txt(d.resposta_parceiro), data: ms(d.created_at) }))
    .sort((a, b) => (b.data ?? 0) - (a.data ?? 0));
}
export const subscribeAvaliacoes = (idEmpresa: string, cb: (a: Avaliacao[]) => void) =>
  subscrever("avaliacoes", (docs) => mapearAvaliacoes(docs, idEmpresa), cb);

export async function buscarParceiro(id: string): Promise<{ parceiro: Parceiro; beneficios: Beneficio[]; categorias: Categoria[]; avaliacoes: Avaliacao[] } | null> {
  const vitrine = await listarVitrine();
  const parceiro = vitrine.parceiros.find((p) => p.id === id);
  if (!parceiro) return null;
  const avaliacoes = mapearAvaliacoes(await getAllOnce("avaliacoes"), id);
  return { parceiro, beneficios: vitrine.beneficios.filter((b) => b.idEmpresa === id), categorias: vitrine.categorias, avaliacoes };
}
