// Manual do SITE do PetGo360 e da página do veterinário (node scripts/gerar-manual.js sites/petgo/documentacao/manuais/site.manual.js)
const I = (n) => `../imagens/${n}`;
module.exports = {
  arquivo: "Manual_PetGo360_Site_e_Veterinario",
  produto: "PetGo360", rotulo: "Manual do site", titulo: "Site, página do veterinário e /admin",
  sub: "O site público do PetGo360, a carteira que o veterinário abre pelo QR Code, a página de pets perdidos e o painel /admin do site.",
  logo: "../../public/images/logo-petgo360.png", cores: { azul: "#0F766E", azulEscuro: "#0B5A54", verde: "#EA580C" },
  publico: "Veterinários, clínicas, pet shops, visitantes do site e a equipe que publica o conteúdo",
  secoes: [
    {
      titulo: "O site",
      blocos: [
        { img: [I("09-site-inicio.png"), "Início: apresentação, baixar o app e o acesso do veterinário"], larga: true },
        { lista: ["**Como funciona**, **Módulos e serviços** (preços ao vivo), **Para veterinários**, **Pets perdidos** e **Contato**.", "Abre no tema escuro; o sol/lua troca só no navegador do visitante.", "Chat “Fale com o PetGo360” no canto: o mesmo atendimento do WhatsApp."] },
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
