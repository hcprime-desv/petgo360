// Conteúdo do site editado no /admin (ou no admsite360) — mesmas coleções do admsite360:
// configuracoes_site, paginas_site, perguntas_frequentes, avisos_site, leads_site.
// Servidor: leitura a cada acesso (SEO). No navegador, lib/siteAoVivo.ts escuta ao vivo (editou no /admin, muda na tela).
import { criarComIdSequencial, getAllOnce } from "@/lib/firebase/gen";

export type ConfigSite = {
  nomeSite: string; slogan: string; tema: "escuro" | "claro" | "automatico"; temaBotao: boolean;
  googlePlay: string; appStore: string; email: string; telefone: string; whatsapp: string;
  redes: { rede: string; url: string }[]; textoRodape: string; seoTitulo: string; seoDescricao: string;
  chatAtivo: boolean; chatTitulo: string; contatoAtivo: boolean; contatoAssuntos: string[];
};
export type Aviso = { id: string; titulo: string; tipo: "faixa" | "modal"; mensagem: string; imagem: string; linkTexto: string; linkUrl: string; ordem: number; versao: number };
export type Pergunta = { id: string; pergunta: string; resposta: string; categoria: string; ordem: number };

const txt = (v: any, padrao = "") => (typeof v === "string" && v.trim() ? v.trim() : padrao);
const linhas = (v: any): string[] => (Array.isArray(v) ? v : typeof v === "string" ? v.split("\n") : []).map((x: any) => String(x?.label ?? x?.value ?? x ?? "").trim()).filter(Boolean);
const ativo = (d: any) => !d.status || ["ativo", "Ativo"].includes(d.status);
const publicado = (d: any) => ["publicado", "Publicado", "ativo"].includes(d.status);
const porOrdem = (a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem;
const ms = (v: any) => (typeof v === "number" ? v : v ? Date.parse(v) || null : null);

export const ASSUNTOS_PADRAO = ["Dúvida sobre o app", "Sou veterinário / clínica", "Quero ser parceiro", "Suporte"];

export function mapearConfig(lista: any[]): ConfigSite {
  const x = lista.find(ativo) ?? lista[0] ?? {};
  const redes = (["instagram", "facebook", "youtube"] as const).map((rede) => ({ rede, url: txt(x[`${rede}_url`]) })).filter((r) => r.url);
  const assuntos = linhas(x.contato_assuntos);
  return {
    nomeSite: txt(x.nome_site, "PetGo360"), slogan: txt(x.slogan, "O passaporte de saúde do seu pet"),
    tema: ["claro", "automatico"].includes(x.tema_site) ? x.tema_site : "escuro", temaBotao: x.tema_botao !== false,
    googlePlay: txt(x.link_google_play), appStore: txt(x.link_app_store), email: txt(x.email), telefone: txt(x.telefone), whatsapp: txt(x.whatsapp),
    redes, textoRodape: txt(x.texto_rodape, "O passaporte de saúde do seu pet: vacinas, saúde e proteção no celular, para levar a qualquer clínica ou pet shop."),
    seoTitulo: txt(x.seo_titulo), seoDescricao: txt(x.seo_descricao),
    chatAtivo: x.chat_ativo !== false, chatTitulo: txt(x.chat_titulo, "Fale com o PetGo360"),
    contatoAtivo: x.contato_ativo !== false, contatoAssuntos: assuntos.length ? assuntos : ASSUNTOS_PADRAO,
  };
}

export function mapearAvisos(docs: any[]): Aviso[] {
  const agora = Date.now();
  return docs.filter((d) => ativo(d) && d.titulo)
    .filter((d) => { const i = ms(d.inicio_em), f = ms(d.fim_em); return (!i || i <= agora) && (!f || f > agora); })
    .map((d) => ({
      id: String(d.id), titulo: txt(d.titulo), tipo: d.tipo === "modal" ? "modal" as const : "faixa" as const, mensagem: txt(d.mensagem), imagem: txt(d.imagem),
      linkTexto: txt(d.link_texto), linkUrl: txt(d.link_url), ordem: Number(d.ordem) || 0, versao: Number(d.updated_at) || 0,
    }))
    .sort(porOrdem);
}

export const mapearPerguntas = (docs: any[]): Pergunta[] => docs.filter((d) => publicado(d) && d.pergunta)
  .map((d) => ({ id: String(d.id), pergunta: txt(d.pergunta), resposta: txt(d.resposta), categoria: txt(d.categoria), ordem: Number(d.ordem) || 0 }))
  .sort(porOrdem);

/** Servidor: sem banco configurado ou fora do ar, o site segue com o padrão. */
export async function lerConfigSite(): Promise<ConfigSite> {
  try { return mapearConfig(await getAllOnce("configuracoes_site")); } catch { return mapearConfig([]); }
}

// ── Formulário de contato → leads_site (Interessados no /admin e no admsite360) ──
export type DadosContato = { nome: string; email: string; telefone: string; organizacao: string; assunto: string; mensagem: string; aceite: boolean };

export function validarContato(d: DadosContato): Record<string, string> {
  const e: Record<string, string> = {};
  const fone = d.telefone.replace(/\D/g, "");
  if (d.nome.trim().length < 3) e.nome = "Informe o seu nome.";
  if (!d.email.trim() && !fone) e.email = "Informe um e-mail ou telefone para retorno.";
  if (d.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) e.email = "E-mail inválido.";
  if (fone && (fone.length < 10 || fone.length > 13)) e.telefone = "Telefone inválido.";
  if (d.mensagem.trim().length < 5) e.mensagem = "Escreva a sua mensagem.";
  if (!d.aceite) e.aceite = "É preciso concordar com a Política de Privacidade.";
  return e;
}

const tipoDoAssunto = (a: string) => (/veterin|cl[ií]nica/i.test(a) ? "veterinario" : /parc/i.test(a) ? "parceria" : /suporte/i.test(a) ? "suporte" : "contato");

export function enviarContato(d: DadosContato, origem: string): Promise<string> {
  return criarComIdSequencial("leads_site", {
    tipo: tipoDoAssunto(d.assunto), nome: d.nome.trim(), email: d.email.trim().toLowerCase(), telefone: d.telefone.replace(/\D/g, ""),
    organizacao: d.organizacao.trim(), assunto: d.assunto, mensagem: d.mensagem.trim(), aceite_lgpd: true, aceite_em: Date.now(), origem, status: "novo",
  });
}
