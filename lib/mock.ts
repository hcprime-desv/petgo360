// Conteúdo ilustrativo — usado só quando o tenant não está configurado ou a
// leitura falha (ver lib/data.ts). Mesmo cenário "PetGo360 Manaus" da Carga
// de Dados do painel, pra o site parecer igual com e sem Firebase.
import type { Avaliacao, Aviso, Beneficio, Categoria, Configuracao, Pagina, Parceiro, Unidade } from "@/types/conteudo";

export const CONFIGURACAO_PADRAO: Configuracao = {
  nomeSite: "PetHub360",
  slogan: "O ecossistema do cuidado pet",
  logoUrl: null,
  corPrimaria: "#14523d",
  corDestaque: "#f36b21",
  heroChamada: "ECOSSISTEMA PET • CLIENTE + PARCEIRO",
  heroTitulo: "O cuidado do seu pet, conectado em um só lugar.",
  heroTituloDestaque: "conectado",
  heroTexto: "PetHub360 conecta tutores, clínicas, pet shops e serviços. No PetGo360, você acompanha seu pet, a carteira de vacinação, pontos e cupons. O parceiro administra a operação pelo app ou pelo portal web.",
  heroImagemUrl: null,
  ctaPrincipalTexto: "Conheça o PetGo360",
  ctaPrincipalLink: "/petgo360",
  ctaSecundarioTexto: "Quero ser parceiro",
  ctaSecundarioLink: "/quero-ser-parceiro",
  numeros: [
    { rotulo: "Parceiros", valor: 4, detalhe: "na rede PetHub360" },
    { rotulo: "Tutores", valor: 6, detalhe: "usando o PetGo360" },
    { rotulo: "Cidades", valor: 1, detalhe: "atendidas" },
  ],
  appStoreUrl: "",
  googlePlayUrl: "",
  whatsapp: "5592990000000",
  email: "contato@petgo360.teste",
  telefone: "(92) 99000-0000",
  endereco: "Manaus/AM",
  redes: [{ rede: "instagram", url: "https://instagram.com/petgo360" }],
  textoRodape: "Tecnologia para conectar cuidado, benefícios e parceiros.",
  seoTitulo: "PetHub360 — serviços pet perto de você",
  seoDescricao: "Clínicas, pet shops, hotéis e profissionais pet com reserva pelo app, Clube Pet e carteira de vacinação digital.",
  menu: { solucoes: true, servicos: true, clube: true, parceiros: true, petgo360: true, paraParceiros: true },
  quantidadeDestaques: 8,
};

export const PAGINAS_MOCK: Pagina[] = [
  { id: "1", titulo: "Sobre o PetHub360", slug: "sobre", resumo: "Quem somos e o que fazemos.", local: "menu", submenu: "Institucional", ordem: 1, imagemUrl: null, seoDescricao: "",
    conteudo: "## Quem somos\n\nO **PetHub360** conecta tutores a clínicas, hospitais veterinários, pet shops, hotéis e profissionais pet.\n\n- Busca por perto\n- Reserva com pagamento antecipado\n- Clube Pet e pontos no app" },
  { id: "2", titulo: "Como funciona", slug: "como-funciona", resumo: "Do WhatsApp ao app, passo a passo.", local: "menu", submenu: "Institucional", ordem: 2, imagemUrl: null, seoDescricao: "",
    conteudo: "## Para tutores\n\n1. Fale com a gente no WhatsApp ou baixe o app **PetGo360**.\n2. Escolha o serviço e o horário.\n3. Pague antecipado e receba o voucher com QR Code.\n\n## Para parceiros\n\nCadastre sua empresa em **Quero ser parceiro** e receba reservas já pagas." },
  { id: "3", titulo: "Perguntas frequentes", slug: "perguntas-frequentes", resumo: "Dúvidas comuns de tutores e parceiros.", local: "rodape", submenu: "", ordem: 3, imagemUrl: null, seoDescricao: "",
    conteudo: "### Posso cancelar uma reserva?\n\nSim, conforme a política de cancelamento do parceiro, mostrada antes do pagamento.\n\n### Onde fica a carteira de vacinação?\n\nNo app PetGo360. O parceiro só acessa lendo o QR Code que você gera no app." },
  { id: "4", titulo: "Termos de uso", slug: "termos-de-uso", resumo: "", local: "rodape", submenu: "", ordem: 4, imagemUrl: null, seoDescricao: "",
    conteudo: "## Termos de uso\n\nTexto de exemplo. Substitua pelo texto aprovado pelo jurídico no painel (Portal Pet → Páginas)." },
  { id: "5", titulo: "Política de privacidade (LGPD)", slug: "privacidade", resumo: "", local: "rodape", submenu: "", ordem: 5, imagemUrl: null, seoDescricao: "",
    conteudo: "## Privacidade e LGPD\n\nTexto de exemplo. Descreva quais dados são coletados, para quê e como o titular exerce seus direitos." },
];

export const AVISOS_MOCK: Aviso[] = [
  { id: "1", titulo: "Clube Pet chegou", mensagem: "Descontos exclusivos nos parceiros para quem usa o **app PetGo360**.", imagemUrl: null, linkUrl: "/clube", linkTexto: "Saiba mais", tipo: "faixa", ordem: 0, versao: "mock" },
];

export const CATEGORIAS_MOCK: Categoria[] = [
  { id: "1", nome: "Clínica veterinária", slug: "clinica-veterinaria", descricao: "Consultas, vacinas e exames", icone: "stethoscope", imagemUrl: null, ordem: 1 },
  { id: "2", nome: "Banho e tosa", slug: "banho-e-tosa", descricao: "Estética e higiene", icone: "bath", imagemUrl: null, ordem: 2 },
  { id: "3", nome: "Hotel e creche", slug: "hotel-e-creche", descricao: "Hospedagem e day care", icone: "home", imagemUrl: null, ordem: 3 },
  { id: "4", nome: "Transporte pet", slug: "transporte-pet", descricao: "Leva e traz com segurança", icone: "car", imagemUrl: null, ordem: 4 },
  { id: "5", nome: "Vacinação", slug: "vacinacao", descricao: "Carteira digital no app", icone: "syringe", imagemUrl: null, ordem: 5 },
  { id: "6", nome: "Atendimento domiciliar", slug: "domiciliar", descricao: "O veterinário vai até você", icone: "map-pin", imagemUrl: null, ordem: 6 },
];

const semana = (abre: string, fecha: string, dias = [1, 2, 3, 4, 5, 6]) => dias.map((dia_semana) => ({ dia_semana, abre, fecha }));
const unidade = (id: string, idEmpresa: string, nome: string, bairro: string, rua: string, lat: number, lng: number, extras: Partial<Unidade> = {}): Unidade => ({
  id, idEmpresa, nome, bairro, municipio: "Manaus", uf: "AM", endereco: `${rua} — ${bairro}`, latitude: lat, longitude: lng,
  telefone: "(92) 3000-0000", whatsapp: "", raioAtendimentoKm: null, horarios: semana("08:00", "19:00"), funciona24h: false, ...extras,
});

export const PARCEIROS_MOCK: Parceiro[] = [
  {
    id: "1", nome: "Clínica Vet Amigo Fiel", tipo: "clinica_veterinaria", descricao: "Clínica geral, vacinas e atendimento domiciliar.",
    logoUrl: null, capaUrl: null, whatsapp: "5592900000000", telefone: "(92) 3000-0000", aceitaReservaOnline: true, aceitaClubeOff: true,
    avaliacaoMedia: 4.8, quantidadeAvaliacoes: 3, destaque: true, ordemDestaque: 1, categorias: ["1", "5", "6"],
    unidades: [
      unidade("1", "1", "Amigo Fiel — Adrianópolis", "Adrianópolis", "Rua Recife, 1200", -3.1019, -60.011, { raioAtendimentoKm: 10, horarios: semana("08:00", "20:00") }),
      unidade("2", "1", "Amigo Fiel — Ponta Negra", "Ponta Negra", "Av. Coronel Teixeira, 5000", -3.0845, -60.093),
    ],
    servicos: [
      { id: "1", idEmpresa: "1", idUnidade: "1", idCategoria: "1", nome: "Consulta clínica", descricao: "Avaliação geral com veterinário.", valorBase: 150, duracaoMinutos: 40, aceitaClubeOff: true, domicilio: false },
      { id: "2", idEmpresa: "1", idUnidade: "1", idCategoria: "5", nome: "Vacina V10", descricao: "Aplicação com registro na carteira digital.", valorBase: 120, duracaoMinutos: 20, aceitaClubeOff: false, domicilio: false },
      { id: "3", idEmpresa: "1", idUnidade: "1", idCategoria: "6", nome: "Consulta domiciliar", descricao: "Atendimento em casa (até 10 km).", valorBase: 220, duracaoMinutos: 60, aceitaClubeOff: false, domicilio: true },
    ],
  },
  {
    id: "2", nome: "Banho & Charme Pet Shop", tipo: "pet_shop", descricao: "Banho, tosa e estética.",
    logoUrl: null, capaUrl: null, whatsapp: "5592900000000", telefone: "(92) 3000-0000", aceitaReservaOnline: true, aceitaClubeOff: true,
    avaliacaoMedia: 4.6, quantidadeAvaliacoes: 2, destaque: true, ordemDestaque: 2, categorias: ["2"],
    unidades: [unidade("3", "2", "Banho & Charme — Vieiralves", "Nossa Senhora das Graças", "Rua Rio Içá, 350", -3.1046, -60.0183)],
    servicos: [
      { id: "4", idEmpresa: "2", idUnidade: "3", idCategoria: "2", nome: "Banho e tosa", descricao: "Banho, tosa higiênica e perfume.", valorBase: 80, duracaoMinutos: 90, aceitaClubeOff: true, domicilio: false },
      { id: "5", idEmpresa: "2", idUnidade: "3", idCategoria: "2", nome: "Banho", descricao: "Banho com hidratação.", valorBase: 55, duracaoMinutos: 60, aceitaClubeOff: true, domicilio: false },
    ],
  },
  {
    id: "3", nome: "Hotelzinho Patas Felizes", tipo: "hotel_creche", descricao: "Hotel com câmera e creche diária.",
    logoUrl: null, capaUrl: null, whatsapp: "5592900000000", telefone: "(92) 3000-0000", aceitaReservaOnline: true, aceitaClubeOff: true,
    avaliacaoMedia: 5, quantidadeAvaliacoes: 1, destaque: true, ordemDestaque: 3, categorias: ["3"],
    unidades: [unidade("4", "3", "Patas Felizes — Parque 10", "Parque 10 de Novembro", "Rua do Comércio, 88", -3.087, -60.012, { funciona24h: true, horarios: [] })],
    servicos: [
      { id: "6", idEmpresa: "3", idUnidade: "4", idCategoria: "3", nome: "Diária de hotel", descricao: "Hospedagem com câmera 24h.", valorBase: 90, duracaoMinutos: null, aceitaClubeOff: true, domicilio: false },
      { id: "7", idEmpresa: "3", idUnidade: "4", idCategoria: "3", nome: "Creche (dia)", descricao: "Day care com recreação.", valorBase: 60, duracaoMinutos: null, aceitaClubeOff: true, domicilio: false },
    ],
  },
  {
    id: "4", nome: "Pet Leva e Traz", tipo: "transporte_pet", descricao: "Van climatizada para leva e traz.",
    logoUrl: null, capaUrl: null, whatsapp: "5592900000000", telefone: "(92) 3000-0000", aceitaReservaOnline: true, aceitaClubeOff: false,
    avaliacaoMedia: 0, quantidadeAvaliacoes: 0, destaque: false, ordemDestaque: 0, categorias: ["4"],
    unidades: [unidade("5", "4", "Pet Leva e Traz — Centro", "Centro", "Av. Eduardo Ribeiro, 600", -3.1316, -60.0231, { raioAtendimentoKm: 15, horarios: semana("07:00", "19:00", [0, 1, 2, 3, 4, 5, 6]) })],
    servicos: [{ id: "8", idEmpresa: "4", idUnidade: "5", idCategoria: "4", nome: "Leva e traz", descricao: "Buscamos e levamos seu pet (até 15 km).", valorBase: 35, duracaoMinutos: 60, aceitaClubeOff: false, domicilio: true }],
  },
];

export const BENEFICIOS_MOCK: Beneficio[] = [
  { id: "c-1", origem: "cupom_off", idEmpresa: "2", titulo: "Banho e tosa com desconto", descricao: "Válido de segunda a quinta.", selo: "15% OFF", fimEm: null, restantes: 26, soMembros: false },
  { id: "c-2", origem: "cupom_off", idEmpresa: "1", titulo: "Consulta clínica", descricao: "Primeira consulta na Amigo Fiel.", selo: "20% OFF", fimEm: null, restantes: 12, soMembros: false },
  { id: "v-1", origem: "vantagem", idEmpresa: "3", titulo: "Diária de hotel", descricao: "Para membros do Clube Pet.", selo: "R$ 30 OFF", fimEm: null, restantes: null, soMembros: true },
  { id: "v-2", origem: "vantagem", idEmpresa: "1", titulo: "Leva e traz na consulta", descricao: "Membros Ouro não pagam o transporte.", selo: "Leva e traz grátis", fimEm: null, restantes: null, soMembros: true },
];

export const AVALIACOES_MOCK: Avaliacao[] = [
  { id: "1", idEmpresa: "1", nota: 5, comentario: "Atendimento excelente, a Dra. Carla foi muito atenciosa com o Thor.", resposta: "Obrigada! O Thor é sempre bem-vindo.", data: null },
  { id: "2", idEmpresa: "2", nota: 5, comentario: "A Mel voltou cheirosa e tranquila.", resposta: "", data: null },
];
