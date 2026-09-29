// Leitura pública do site PetHub360 — o que o painel (petGo360) grava em
// dados/{tenant}/<colecao>. Só coleções de vitrine/conteúdo: NUNCA ler
// clientes, pets, reservas ou qualquer dado pessoal aqui.
//
// Duas famílias de função (mesmo padrão herdado do portal181):
// - `listarX` / `buscarX` — leitura pontual (getDocs), usada pelos Server
//   Components (SSR/ISR, HTML com dado real pra SEO);
// - `subscribeX` — listener (onSnapshot) pros componentes client que
//   precisam refletir edição do painel sem recarregar (páginas, avisos).
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
// Sem tenant configurado (ou se a leitura falhar) cada função cai num
// conteúdo ilustrativo, pra o site navegar antes de qualquer credencial.
import { getAll, getAllOnce } from "@/lib/firebase/gen";
import type { Unsubscribe } from "firebase/firestore";
import type { Aviso, Avaliacao, Beneficio, Categoria, Configuracao, Pagina, Parceiro, ServicoParceiro, Unidade, Vitrine } from "@/types/conteudo";
import {
  CONFIGURACAO_PADRAO, PAGINAS_MOCK, AVISOS_MOCK, CATEGORIAS_MOCK, PARCEIROS_MOCK, BENEFICIOS_MOCK, AVALIACOES_MOCK,
} from "@/lib/mock";

async function tentar<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function subscrever<T>(colecao: string, mapear: (docs: any[]) => T, fallback: T, callback: (dados: T) => void): Unsubscribe {
  try {
    return getAll(colecao, (docs) => callback(mapear(docs)));
  } catch {
    callback(fallback);
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
// O WhatsApp do site é o "Telefone / WhatsApp" da configuração: só dígitos,
// e sem DDI (10–11 dígitos) assume Brasil (55).
const numeroWhatsapp = (telefone: string) => {
  const d = telefone.replace(/\D/g, "");
  return d.length === 10 || d.length === 11 ? `55${d}` : d;
};
function mapearConfiguracao(docs: any[]): Configuracao {
  const d = docs.find((x) => x.status === "ativo") ?? null;
  if (!d) return CONFIGURACAO_PADRAO;
  const p = CONFIGURACAO_PADRAO;
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

export const listarConfiguracao = () => tentar(async () => mapearConfiguracao(await getAllOnce("configuracoes_site")), CONFIGURACAO_PADRAO);

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

export const listarPaginasPublicadas = () => tentar(async () => mapearPaginas(await getAllOnce("paginas")), PAGINAS_MOCK);
export const buscarPaginaPorSlug = async (slug: string) => (await listarPaginasPublicadas()).find((p) => p.slug === slug) ?? null;
export const subscribePaginaPorSlug = (slug: string, cb: (p: Pagina | null) => void) =>
  subscrever("paginas", (docs) => mapearPaginas(docs).find((p) => p.slug === slug) ?? null, PAGINAS_MOCK.find((p) => p.slug === slug) ?? null, cb);

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

export const listarAvisosAtivos = () => tentar(async () => mapearAvisos(await getAllOnce("avisos")), AVISOS_MOCK);
export const subscribeAvisosAtivos = (cb: (a: Aviso[]) => void) => subscrever("avisos", mapearAvisos, AVISOS_MOCK, cb);

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

const VITRINE_MOCK: Vitrine = { categorias: CATEGORIAS_MOCK, parceiros: PARCEIROS_MOCK, beneficios: BENEFICIOS_MOCK };

export const listarVitrine = () =>
  tentar(async () => {
    const [emp, uni, sp, cat, vant, camp] = await Promise.all(
      ["empresas", "unidades", "servicos_parceiros", "categorias_servicos", "vantagens", "campanhas_cupons_off"].map((c) => getAllOnce(c)),
    );
    return montarVitrine(emp, uni, sp, cat, vant, camp);
  }, VITRINE_MOCK);

export async function buscarParceiro(id: string): Promise<{ parceiro: Parceiro; beneficios: Beneficio[]; categorias: Categoria[]; avaliacoes: Avaliacao[] } | null> {
  const vitrine = await listarVitrine();
  const parceiro = vitrine.parceiros.find((p) => p.id === id);
  if (!parceiro) return null;
  const avaliacoes = await tentar(async () => {
    const docs = await getAllOnce("avaliacoes");
    return docs
      .filter((d) => String(d.id_empresas) === id && d.status === "publicada")
      .map((d) => ({ id: String(d.id), idEmpresa: id, nota: num(d.nota), comentario: txt(d.comentario), resposta: txt(d.resposta_parceiro), data: ms(d.created_at) }))
      .sort((a, b) => (b.data ?? 0) - (a.data ?? 0));
  }, AVALIACOES_MOCK.filter((a) => a.idEmpresa === id));
  return { parceiro, beneficios: vitrine.beneficios.filter((b) => b.idEmpresa === id), categorias: vitrine.categorias, avaliacoes };
}
