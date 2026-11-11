// Textos PADRÃO dos Termos de uso e da Política de privacidade (exigidos pelas
// lojas). Valem enquanto o painel (Páginas, slugs "termos-de-uso" e
// "privacidade", status Publicado) não tiver o texto oficial — revisar com o
// jurídico antes de publicar o app.
export const TEXTOS_LEGAIS: Record<string, { titulo: string; conteudo: string }> = {
  privacidade: {
    titulo: "Política de privacidade",
    conteudo: `O PetGo360 trata os seus dados conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).

## Quais dados tratamos
- **Conta:** nome, e-mail, celular (WhatsApp) e senha (guardada só como código criptográfico, nunca em texto).
- **Dados dos pets:** cadastro do pet (espécie, raça, peso, microchip, alergias), vacinas, registros de saúde, alimentação e fotos de laudos que você incluir.
- **Contratações:** módulos e serviços contratados e os pagamentos.

## Onde ficam
- Os dados dos pets ficam **no seu celular**. Se você contratar qualquer módulo, ganha o **backup na nuvem**: os dados são copiados para os nossos servidores para você recuperar ao trocar de aparelho.
- Sem módulo contratado, os dados ficam só no aparelho; se ele for perdido ou o app for apagado, eles se perdem.

## QR Code para profissionais
Ao mostrar o QR Code, você autoriza o profissional que o ler a ver a carteira daquele pet por um tempo limitado (o código vale 10 minutos; aberto, 1 hora). Para isso, uma cópia temporária da carteira vai para os nossos servidores e é apagada quando o acesso termina. O que o profissional registrar chega ao seu app e você é avisado.

## Serviços de parceiros
Ao contratar plano de saúde, plano funeral ou seguro pet, enviamos ao parceiro só os dados necessários para a contratação e o atendimento (seus dados de contato e os do pet).

## Seus direitos
Você pode consultar, corrigir e excluir seus dados a qualquer momento pelo app (Perfil → Excluir minha conta), o que apaga a conta e o backup na nuvem. Guardamos apenas o que a lei exige (registros de pagamento).

## Contato
Dúvidas sobre privacidade: fale com o suporte pelo app.`,
  },
  "termos-de-uso": {
    titulo: "Termos de uso",
    conteudo: `Ao usar o PetGo360 você concorda com estes termos.

## O serviço
O PetGo360 é um aplicativo para o tutor organizar a vida do pet: vacinas, saúde, alimentação e serviços. O plano grátis permite 1 pet e o registro de vacinas; os demais recursos e os serviços de parceiros são contratados por módulo, com o preço exibido no app.

## Informações registradas
Os registros feitos pelo tutor aparecem como “Declarado pelo tutor”. Os feitos por um profissional pelo QR Code aparecem como “Validado por profissional”, com o nome e o registro informados por ele. O PetGo360 não substitui a orientação do médico-veterinário.

## Pagamentos
Os módulos são pagos por período (mensal ou anual) e liberados após a confirmação do pagamento. Serviços de parceiros (plano de saúde, funeral, seguro) seguem também as condições do parceiro.

## Conta
Você é responsável pela sua senha. Podemos suspender contas usadas de forma indevida.

## Cancelamento
Você pode excluir a sua conta a qualquer momento pelo app.`,
  },
};
