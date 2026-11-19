// Manual do SITE do PetGo360 e da página do veterinário (node scripts/gerar-manual.js sites/petgo/documentacao/manuais/site.manual.js)
const I = (n) => `../imagens/${n}`;
module.exports = {
  arquivo: "Manual_PetGo360_Site_e_Veterinario",
  produto: "PetGo360", rotulo: "Manual do site", titulo: "Site, página do veterinário e /admin",
  sub: "O site público do PetGo360, a carteira que o veterinário abre pelo QR Code, pets perdidos, o Disque Denúncia Pet com a central dos pontos e o painel /admin do site.",
  logo: "../../public/images/logo-petgo360.png", cores: { azul: "#0F766E", azulEscuro: "#0B5A54", verde: "#EA580C" },
  publico: "Veterinários, clínicas, pet shops, ONGs e protetores, visitantes do site e a equipe que publica o conteúdo",
  secoes: [
    {
      titulo: "O site",
      blocos: [
        { img: [I("09-site-inicio.png"), "Início: apresentação, baixar o app e o acesso do veterinário"], larga: true },
        { lista: ["**Como funciona**, **Módulos e serviços** (preços ao vivo), **Para veterinários**, **Guia Pet**, **Loja**, **Pets perdidos**, **Denúncia ▾**, **Contato** e **Admin**.", "Abre no tema escuro; o sol/lua troca só no navegador do visitante.", "Chat “Fale com o PetGo360” no canto: o mesmo atendimento do WhatsApp."] },
        { img: [I("10-site-modulos-precos.png"), "Módulos e preços, lidos do catálogo do painel"] },
        { celulares: [[I("12-site-inicio-celular.png"), "Site no celular"]] },
      ],
    },
    {
      titulo: "Para o veterinário: a carteira pelo QR Code",
      intro: "O tutor mostra o QR Code (no app ou no WhatsApp). O profissional aponta a câmera do celular e a carteira abre no navegador — sem instalar nada e sem cadastro.",
      blocos: [
        { celulares: [[I("02-carteira-qr-celular-claro.png"), "Carteira aberta pelo QR"], [I("01-carteira-qr-celular-escuro.png"), "No tema escuro"]] },
        { passos: ["Leia o QR com a câmera — ele vale **10 minutos** para abrir; aberto, a página fica liberada por **1 hora**.", "Informe o seu nome, o CRMV (opcional) e a clínica/pet shop.", "**Registrar vacina aplicada**: vacina (catálogo), data, lote, dose e próxima dose — já nasce **Validada por profissional**.", "**Validar** as vacinas que o tutor declarou.", "**Registrar atendimento**: consulta, vermífugo, exame, cirurgia, com detalhes.", "O tutor recebe o aviso e o registro entra no app dele."] },
        { img: [I("11-site-veterinarios.png"), "Seção do site para veterinários e pet shops"] },
        { atencao: "Use os dados só para o atendimento daquele pet. Depois do prazo, peça ao tutor um novo QR Code." },
      ],
    },
    {
      titulo: "Pets perdidos e encontrados",
      blocos: [
        { img: [I("03-pets-perdidos.png"), "Pets perdidos: abas, busca e “Vi este pet”"], larga: true },
        { passos: ["Abra **Pets perdidos** no menu.", "Viu um destes pets? Toque em **Vi este pet**, diga onde e deixe o seu WhatsApp — o tutor é avisado.", "Perdeu ou encontrou um pet? Use **Perdi meu pet** ou **Encontrei um pet** e mande a foto."] },
        { img: [I("05-pets-perdidos-vi-este-pet.png"), "“Vi este pet”: o tutor recebe o seu contato"] },
        { celulares: [[I("04-pets-perdidos-celular.png"), "No celular, dois pets por linha"]] },
        { dica: "O telefone de quem registrou nunca aparece no site — só é enviado ao tutor/quem encontrou quando há correspondência." },
      ],
    },
    {
      titulo: "Disque Denúncia Pet",
      intro: "Menu **Denúncia ▾**: **Denunciar maus-tratos** (/denuncia), **Central** dos pontos (/denuncia/central) e **Cadastro de ONG/Instituições** (/denuncia/ponto). A denúncia é ANÔNIMA — serviço de utilidade pública.",
      blocos: [
        { passos: ["Escolha o tipo de maus-tratos e o animal.", "Informe o **estado** e o **município** (obrigatórios), o endereço e um ponto de referência; se quiser, use a localização do navegador.", "Em **Para quem enviar? (opcional)**, marque os órgãos competentes e as ONGs/protetores da região. Nenhum marcado = a central decide.", "Conte o que viu, envie até 4 fotos e toque em `Enviar denúncia`: aparece o **protocolo**."] },
        { img: [I("14-denuncia-site.png"), "Disque Denúncia Pet no site"], larga: true },
        { celulares: [[I("15-denuncia-site-celular-destinos.png"), "No celular: escolher quem recebe"]] },
        { h3: "Acompanhar e conversar" },
        "Em **Acompanhar**, digite o protocolo e toque em **Consultar**: aparece a situação e a **conversa com a central** — responda com texto, foto, vídeo, áudio, documento ou localização, sem se identificar.",
        { img: [I("16-denuncia-site-acompanhar-conversa.png"), "Acompanhar e conversar pelo protocolo"], larga: true },
        { dica: "Não pedimos nem guardamos nome, e-mail ou telefone de quem denuncia — contra trotes, só um código cifrado e irreversível do navegador, que não identifica a pessoa. Se a plataforma liberar o serviço só para assinantes, a página mostra o aviso e indica o app." },
      ],
    },
    {
      titulo: "Central dos pontos (ONGs, protetores e órgãos)",
      intro: "ONGs e protetores independentes recebem as denúncias da sua região e tratam na CENTRAL DOS PONTOS do site — a mesma central do painel, sem instalar nada, no computador ou no celular. Os órgãos também podem usar a central pelo site.",
      blocos: [
        { h3: "Cadastro de ONG ou protetor" },
        { passos: ["Menu **Denúncia → Cadastro de ONG/Instituições** (/denuncia/ponto).", "Informe se é ONG ou protetor, o nome, o documento, o responsável, o e-mail, o telefone e a **região onde atua** (estado e município).", "Crie a senha e envie: o cadastro fica **aguardando aprovação** da central do PetGo360.", "Aprovado, você entra na central com o e-mail e a senha."] },
        { img: [I("17-denuncia-site-cadastro-ong-protetor.png"), "Cadastro de ONG ou protetor"] },
        { celulares: [[I("18-denuncia-site-cadastro-ong-celular.png"), "Cadastro pelo celular"]] },
        { h3: "A central" },
        { passos: ["Menu **Denúncia → Central** (/denuncia/central): entre com o e-mail e a senha.", "No topo, os indicadores e, ao lado, **⛶ expandir** (tela cheia), **👤** (quem está logado e o seu ponto) e **✕** (sair da central).", "Escolha uma denúncia na fila: relato, etapas, **conversa com o denunciante**, mapa e trâmite.", "Use **Assumir**, **Encaminhar** (a órgãos e outras ONGs, com nota), **PDF** e **Concluir**. Converse pelo protocolo com texto, foto, áudio e localização."] },
        { img: [I("19-central-dos-pontos-login.png"), "Entrar na central"] },
        { img: [I("20-central-dos-pontos-ong.png"), "Central dos pontos: a ONG trata as denúncias que recebeu"], larga: true },
        { celulares: [[I("21-central-dos-pontos-celular.png"), "A central no celular"]] },
        { dica: "Cada ponto vê só as denúncias enviadas a ele. Toda denúncia também entra na central do estado de origem do Disque Denúncia Pet." },
      ],
    },
    {
      titulo: "Passaporte e botton: “Encontrei este pet”",
      intro: "O QR do passaporte, da carteira de identidade e do botton da coleira abre a página do pet (/p/<código>): foto, nome, espécie e raça — nada de saúde. O tutor escolhe se aparecem o primeiro nome dele e o botão de WhatsApp.",
      blocos: [
        { celulares: [[I("22-qr-do-botton-celular.png"), "Página aberta pelo QR do botton"], [I("13-passaporte-encontrei-este-pet.png"), "Encontrei este pet"]] },
        { lista: ["**Falar com o tutor no WhatsApp** (se o tutor liberou).", "**Mostrar ao tutor onde estou**: envia a localização ao tutor.", "**Encontrei este pet**: deixe o seu contato e onde o pet está — o tutor é avisado no app e no WhatsApp.", "Cada leitura do QR gera um aviso no celular do tutor."] },
      ],
    },
    {
      titulo: "Link de indicação dos parceiros",
      intro: "Página /i/CÓDIGO: o link que pet shops, clínicas e influenciadores divulgam. Mostra o código para usar no cadastro do app (o tutor ganha dias extras no teste grátis) e os botões das lojas.",
      blocos: [{ p: "O código é conferido no cadastro do app; a página não mostra nenhum dado do parceiro (comissão e Pix ficam só no painel)." }],
    },
    {
      titulo: "O /admin do site",
      intro: "A equipe publica o conteúdo do site sem depender de TI: páginas, perguntas frequentes, avisos, interessados (contatos), usuários e a configuração do site. O mesmo conteúdo pode ser gerenciado pelo AdmSite360.",
      blocos: [
        { img: [I("07-admin-painel-escuro.png"), "Painel do /admin: cadastros com o pulso dos últimos 14 dias, registros por mês e conteúdo do site"], larga: true },
        { lista: ["Entre em `/admin` com o seu usuário (e-mail ou login) e senha.", "**Configuração do site**: tema padrão, contatos, redes, links das lojas, SEO, chat e formulário.", "**Páginas**, **Perguntas frequentes** e **Avisos** (faixa ou janela).", "**Interessados**: quem preencheu o contato do site."] },
        { img: [I("08-admin-painel-claro.png"), "O mesmo painel no tema claro"] },
      ],
    },
  ],
};
