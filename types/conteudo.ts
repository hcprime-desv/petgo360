// Tipos do que o site lê de dados/{tenant}/<colecao>. O formato é o do
// painel (projeto petGo360, schemas em shared/shemas/petgo360/*Shema.ts —
// fonte da verdade). Aqui só os campos que o site usa, já normalizados
// (datas viram ms, imagens viram URL).

export type Configuracao = {
  nomeSite: string;
  slogan: string;
  logoUrl: string | null;
  corPrimaria: string;
  corDestaque: string;
  heroChamada: string;
  heroTitulo: string;
  heroTituloDestaque: string;
  heroTexto: string;
  heroImagemUrl: string | null;
  ctaPrincipalTexto: string;
  ctaPrincipalLink: string;
  ctaSecundarioTexto: string;
  ctaSecundarioLink: string;
  numeros: { rotulo: string; valor: number; detalhe: string }[];
  appStoreUrl: string;
  googlePlayUrl: string;
  whatsapp: string; // só dígitos com DDI
  email: string;
  telefone: string;
  endereco: string;
  redes: { rede: "instagram" | "facebook" | "tiktok" | "youtube" | "linkedin"; url: string }[];
  textoRodape: string;
  seoTitulo: string;
  seoDescricao: string;
  menu: { solucoes: boolean; servicos: boolean; clube: boolean; parceiros: boolean; petgo360: boolean; paraParceiros: boolean };
  quantidadeDestaques: number;
};

export type Pagina = {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  conteudo: string;
  imagemUrl: string | null;
  local: "rodape" | "menu" | "nenhum";
  submenu: string;
  ordem: number;
  seoDescricao: string;
};

export type Aviso = {
  id: string;
  titulo: string;
  mensagem: string;
  imagemUrl: string | null;
  linkUrl: string;
  linkTexto: string;
  tipo: "faixa" | "modal";
  ordem: number;
  // Assinatura do conteúdo: editar o aviso faz ele reaparecer pra quem já fechou.
  versao: string;
};

export type Categoria = { id: string; nome: string; slug: string; descricao: string; icone: string; imagemUrl: string | null; ordem: number };

export type Unidade = {
  id: string;
  idEmpresa: string;
  nome: string;
  bairro: string;
  municipio: string;
  uf: string;
  endereco: string;
  latitude: number | null;
  longitude: number | null;
  telefone: string;
  whatsapp: string;
  raioAtendimentoKm: number | null;
  horarios: { dia_semana: number; abre: string; fecha: string }[];
  funciona24h: boolean;
};

export type ServicoParceiro = {
  id: string;
  idEmpresa: string;
  idUnidade: string | null;
  idCategoria: string | null;
  nome: string;
  descricao: string;
  valorBase: number;
  duracaoMinutos: number | null;
  aceitaClubeOff: boolean;
  domicilio: boolean;
};

export type Parceiro = {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  logoUrl: string | null;
  capaUrl: string | null;
  whatsapp: string;
  telefone: string;
  aceitaReservaOnline: boolean;
  aceitaClubeOff: boolean;
  avaliacaoMedia: number;
  quantidadeAvaliacoes: number;
  destaque: boolean;
  ordemDestaque: number;
  unidades: Unidade[];
  servicos: ServicoParceiro[];
  categorias: string[]; // ids de categorias_servicos que o parceiro oferece
};

export type Beneficio = {
  id: string;
  origem: "vantagem" | "cupom_off";
  idEmpresa: string;
  titulo: string;
  descricao: string;
  selo: string; // "20% OFF", "R$ 30 OFF", "Brinde"...
  fimEm: number | null;
  restantes: number | null; // cupons OFF disponíveis
  soMembros: boolean; // vantagem do Clube (exige app)
};

export type Avaliacao = { id: string; idEmpresa: string; nota: number; comentario: string; resposta: string; data: number | null };

export type Vitrine = { categorias: Categoria[]; parceiros: Parceiro[]; beneficios: Beneficio[] };
