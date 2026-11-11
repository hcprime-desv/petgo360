// /admin do site PetGo360: marca, menu, perfis e cadastros (o resto vem do kit do monorepo — scripts/copiar-admin-site.py).
// As MESMAS coleções e permissões (menu.site.*) do admsite360: o conteúdo pode ser editado aqui ou lá (as duas opções).
// Módulos e preços do app NÃO são do site: vêm ao vivo do catálogo `modulos_app` do painel PetGo360.
import { BookOpen, Gauge, HelpCircle, Inbox, Megaphone, Settings, UserCog, Users } from "lucide-react";
import { cadastrosNucleo, PERMISSAO_GRUPOS, PERMISSAO_PAINEL, PERMISSAO_USUARIOS } from "./nucleo";
import type { Cadastro, Campo, Opcao, SiteAdmin } from "./tipos";

const P = {
  configuracao: "menu.site.configuracao", paginas: "menu.site.paginas", faq: "menu.site.faq", avisos: "menu.site.avisos", leads: "menu.site.leads",
};
const PERMISSOES: Record<string, string> = {
  [PERMISSAO_PAINEL]: "Painel", [P.configuracao]: "Configuração do site", [P.paginas]: "Páginas", [P.faq]: "Perguntas frequentes",
  [P.avisos]: "Avisos", [P.leads]: "Interessados", [PERMISSAO_USUARIOS]: "Usuários", [PERMISSAO_GRUPOS]: "Grupos de permissões",
};
const CONTEUDO = [PERMISSAO_PAINEL, P.paginas, P.faq, P.avisos];
const PERFIS: Opcao[] = [
  { valor: "administrador", rotulo: "Administrador (tudo)" }, { valor: "editor", rotulo: "Editor de conteúdo" },
  { valor: "comercial", rotulo: "Comercial (interessados)" }, { valor: "atendimento", rotulo: "Atendimento (chat)" }, { valor: "auditoria", rotulo: "Auditoria" },
];

const op = (lista: readonly string[], rotulos?: Record<string, string>): Opcao[] => lista.map((v) => ({ valor: v, rotulo: rotulos?.[v] ?? v }));
const STATUS_PUB = op(["publicado", "rascunho"], { publicado: "Publicado", rascunho: "Rascunho" });
const STATUS_CAD = op(["ativo", "inativo"], { ativo: "Ativo", inativo: "Inativo" });
const status = (opcoes: Opcao[], padrao: string): Campo => ({ nome: "status", rotulo: "Status", tipo: "select", obrigatorio: true, padrao, opcoes });
const ORDEM: Campo = { nome: "ordem", rotulo: "Ordem", tipo: "numero", padrao: 0 };
const porOrdem = (a: any, b: any) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0);
const slugOk = async (d: Record<string, any>) => (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug || "") ? d : "Endereço (slug): use só letras minúsculas, números e hífen.");

const CADASTROS: Cadastro[] = [
  {
    id: "configuracao", titulo: "Configuração do site", singular: "configuração", colecao: "configuracoes_site", permissao: P.configuracao, rotulo: "nome_site", unico: true,
    descricao: "Tema, contatos, redes, lojas do app, SEO e o chat do site.",
    campos: [
      { nome: "nome_site", rotulo: "Nome do site", tipo: "texto", obrigatorio: true, padrao: "PetGo360", largura: 2 }, { nome: "slogan", rotulo: "Slogan", tipo: "texto" },
      { nome: "url_site", rotulo: "Endereço do site (usado no QR do app)", tipo: "texto", largura: 2 }, status(STATUS_CAD, "ativo"),
      { nome: "tema_site", rotulo: "Tema do site", tipo: "select", padrao: "escuro", opcoes: op(["escuro", "claro", "automatico"], { escuro: "Escuro", claro: "Claro", automatico: "Seguir o aparelho" }) },
      { nome: "tema_botao", rotulo: "Mostrar botão claro/escuro no topo", tipo: "check", padrao: true },
      { nome: "link_google_play", rotulo: "Link do app no Google Play", tipo: "texto", largura: 2 }, { nome: "link_app_store", rotulo: "Link do app na App Store", tipo: "texto" },
      { nome: "email", rotulo: "E-mail de contato", tipo: "email" }, { nome: "telefone", rotulo: "Telefone", tipo: "texto" }, { nome: "whatsapp", rotulo: "WhatsApp", tipo: "texto" },
      { nome: "instagram_url", rotulo: "Instagram", tipo: "texto" }, { nome: "facebook_url", rotulo: "Facebook", tipo: "texto" }, { nome: "youtube_url", rotulo: "YouTube", tipo: "texto" },
      { nome: "texto_rodape", rotulo: "Texto do rodapé", tipo: "textarea", largura: 3 },
      { nome: "seo_titulo", rotulo: "Título para o Google (até 70)", tipo: "texto", largura: 2 }, { nome: "seo_descricao", rotulo: "Descrição para o Google (até 160)", tipo: "textarea", largura: 3 },
      { nome: "chat_ativo", rotulo: "Mostrar o chat no site", tipo: "check", padrao: true }, { nome: "chat_titulo", rotulo: "Título do chat", tipo: "texto", padrao: "Fale com o PetGo360" },
      { nome: "contato_ativo", rotulo: "Mostrar o formulário de contato", tipo: "check", padrao: true },
      { nome: "contato_assuntos", rotulo: "Assuntos do formulário (um por linha)", tipo: "linhas" },
    ],
    colunas: [{ campo: "nome_site", rotulo: "Site" }],
  },
  {
    id: "paginas", titulo: "Páginas", singular: "página", colecao: "paginas_site", permissao: P.paginas, rotulo: "titulo", ordenar: porOrdem, preparar: slugOk,
    descricao: "Termos de uso (termos-de-uso), Política de privacidade (privacidade) e outras páginas de texto — endereço /<slug>.",
    campos: [
      { nome: "titulo", rotulo: "Título", tipo: "texto", obrigatorio: true, largura: 2 },
      { nome: "slug", rotulo: "Endereço (slug)", tipo: "texto", obrigatorio: true, dica: "Só letras minúsculas, números e hífen." },
      status(STATUS_PUB, "rascunho"), ORDEM,
      { nome: "seo_descricao", rotulo: "Descrição para o Google (até 160)", tipo: "texto", largura: 3 },
      { nome: "conteudo", rotulo: "Conteúdo da página", tipo: "markdown", obrigatorio: true },
    ],
    colunas: [{ campo: "titulo", rotulo: "Título" }, { campo: "slug", rotulo: "Endereço" }, { campo: "status", rotulo: "Status", tipo: "selo" }],
  },
  {
    id: "faq", titulo: "Perguntas frequentes", singular: "pergunta", colecao: "perguntas_frequentes", permissao: P.faq, rotulo: "pergunta", ordenar: porOrdem,
    campos: [
      { nome: "pergunta", rotulo: "Pergunta", tipo: "texto", obrigatorio: true, largura: 2 }, status(STATUS_PUB, "publicado"),
      { nome: "resposta", rotulo: "Resposta", tipo: "markdown", obrigatorio: true }, { nome: "categoria", rotulo: "Categoria (tutor, veterinário...)", tipo: "texto" }, ORDEM,
    ],
    colunas: [{ campo: "pergunta", rotulo: "Pergunta" }, { campo: "categoria", rotulo: "Categoria" }, { campo: "status", rotulo: "Status", tipo: "selo" }],
  },
  {
    id: "avisos", titulo: "Avisos", singular: "aviso", colecao: "avisos_site", permissao: P.avisos, rotulo: "titulo", ordenar: porOrdem,
    descricao: "Faixa no topo ou janela (pop-up) com período no ar.",
    campos: [
      { nome: "titulo", rotulo: "Título", tipo: "texto", obrigatorio: true, largura: 2 },
      { nome: "tipo", rotulo: "Como aparece", tipo: "select", padrao: "faixa", opcoes: op(["faixa", "modal"], { faixa: "Faixa no topo", modal: "Janela (pop-up)" }) },
      status(STATUS_CAD, "ativo"), { nome: "inicio_em", rotulo: "No ar a partir de", tipo: "datahora" }, { nome: "fim_em", rotulo: "Sai do ar em", tipo: "datahora" }, ORDEM,
      { nome: "mensagem", rotulo: "Mensagem", tipo: "markdown" },
      { nome: "imagem", rotulo: "Imagem (só na janela)", tipo: "imagem" }, { nome: "link_texto", rotulo: "Botão (texto)", tipo: "texto" }, { nome: "link_url", rotulo: "Botão (link)", tipo: "texto" },
    ],
    colunas: [{ campo: "titulo", rotulo: "Título" }, { campo: "tipo", rotulo: "Como", tipo: "opcao" }, { campo: "inicio_em", rotulo: "Início", tipo: "datahora" }, { campo: "fim_em", rotulo: "Fim", tipo: "datahora" }, { campo: "status", rotulo: "Status", tipo: "selo" }],
  },
  {
    id: "interessados", titulo: "Interessados", singular: "interessado", colecao: "leads_site", permissao: P.leads, rotulo: "nome", semNovo: true,
    ordenar: (a, b) => Number(b.created_at || 0) - Number(a.created_at || 0),
    descricao: "Quem escreveu pelo formulário de contato do site (tutores, veterinários, pet shops, parceiros).",
    campos: [
      { nome: "tipo", rotulo: "Tipo", tipo: "select", opcoes: op(["contato", "veterinario", "parceria", "suporte"], { contato: "Contato", veterinario: "Veterinário / clínica", parceria: "Parceria", suporte: "Suporte do app" }) },
      { nome: "nome", rotulo: "Nome", tipo: "texto", obrigatorio: true },
      { nome: "status", rotulo: "Status", tipo: "select", padrao: "novo", opcoes: op(["novo", "em_contato", "concluido", "descartado"], { novo: "Novo", em_contato: "Em contato", concluido: "Concluído", descartado: "Descartado" }) },
      { nome: "email", rotulo: "E-mail", tipo: "email" }, { nome: "telefone", rotulo: "Telefone / WhatsApp", tipo: "texto" }, { nome: "contatado_em", rotulo: "Contatado em", tipo: "datahora" },
      { nome: "organizacao", rotulo: "Clínica ou empresa", tipo: "texto" }, { nome: "assunto", rotulo: "Assunto", tipo: "texto" }, { nome: "origem", rotulo: "Página de origem", tipo: "texto" },
      { nome: "aceite_lgpd", rotulo: "Aceitou a Política de Privacidade (LGPD)", tipo: "check" },
      { nome: "mensagem", rotulo: "Mensagem do interessado", tipo: "textarea", largura: 3 }, { nome: "observacoes", rotulo: "Anotações internas", tipo: "textarea", largura: 3 },
    ],
    colunas: [{ campo: "nome", rotulo: "Nome" }, { campo: "tipo", rotulo: "Tipo", tipo: "opcao" }, { campo: "assunto", rotulo: "Assunto" }, { campo: "status", rotulo: "Status", tipo: "selo" }],
  },
];

export const SITE_ADMIN: SiteAdmin = {
  nome: "PetGo360",
  logo: "/images/logo-petgo360.png",
  logoBranco: "/images/logo-petgo360-branco.png",
  chaveSessao: "admin-petgo360",
  modulo: "site",
  permissoes: PERMISSOES,
  perfis: { administrador: "*", editor: CONTEUDO, comercial: [PERMISSAO_PAINEL, P.leads], atendimento: [PERMISSAO_PAINEL], auditoria: [PERMISSAO_PAINEL, P.leads] },
  menu: [
    { grupo: "Visão geral", itens: [
      { href: "/admin", rotulo: "Painel", permissao: PERMISSAO_PAINEL, icone: <Gauge size={18} /> },
      { href: "/admin/interessados", rotulo: "Interessados", permissao: P.leads, icone: <Inbox size={18} /> },
    ] },
    { grupo: "Conteúdo", itens: [
      { href: "/admin/paginas", rotulo: "Páginas", permissao: P.paginas, icone: <BookOpen size={18} /> },
      { href: "/admin/faq", rotulo: "Perguntas frequentes", permissao: P.faq, icone: <HelpCircle size={18} /> },
      { href: "/admin/avisos", rotulo: "Avisos", permissao: P.avisos, icone: <Megaphone size={18} /> },
    ] },
    { grupo: "Configurações", itens: [
      { href: "/admin/configuracao", rotulo: "Configuração do site", permissao: P.configuracao, icone: <Settings size={18} /> },
      { href: "/admin/usuarios", rotulo: "Usuários", permissao: PERMISSAO_USUARIOS, icone: <Users size={18} /> },
      { href: "/admin/grupos", rotulo: "Grupos de permissões", permissao: PERMISSAO_GRUPOS, icone: <UserCog size={18} /> },
    ] },
  ],
  cadastros: [...CADASTROS, ...cadastrosNucleo(PERMISSOES, PERFIS)],
};
