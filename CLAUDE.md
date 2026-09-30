# PetHub360 — site público

Site institucional/comercial do ecossistema PetHub360 (Next.js 15, App
Router, TypeScript). Porta de entrada para tutores e parceiros: vitrine de
serviços e parceiros, Clube Pet (cupons OFF e vantagens), página do app
PetGo360 e captação de parceiros. Documentação em `documentacao/`
(`PetHub360_Documentacao_Site.docx`, `PetHub360_Wireframe.html` — fonte do
visual de `app/globals.css` — e `page.jpeg`, referência de layout).

**Este repositório é só o site público — não tem painel.** Todo o conteúdo
vem do painel **petGo360** (`D:\desv\producao\hc\projetos\petGo360`),
módulo **Portal Pet** (Configuração do site, Páginas, Avisos,
Interessados), e da operação do marketplace (Empresas, Unidades, Serviços
dos parceiros, Categorias, Vantagens, Campanhas de cupons OFF,
Avaliações). Os schemas de lá (`shared/shemas/petgo360/*Shema.ts`) são a
fonte da verdade dos campos; `types/conteudo.ts` e `lib/data.ts` só
espelham o que o site usa. Não criar `/admin` aqui.

Nasceu como cópia do portal181 (Disque Denúncia); tudo de
denúncia/chat/baralho/procurados foi removido e o `.git` antigo foi apagado.
Por enquanto roda local (`npm run dev`, ou `npm run build && npx next start` para testar como produção), sem deploy.

## Decisões (e o porquê)

- **Vitrine + busca, sem checkout.** Reserva e pagamento são no app
  PetGo360 ou no WhatsApp da plataforma (bot) — os botões "Agendar" abrem
  `wa.me/<whatsapp_atendimento>` com parceiro e serviço no texto. Nunca o
  WhatsApp do próprio parceiro (WhatsApp é aquisição, app é fidelização).
  Resgate de cupom/vantagem também só no app (código único, status central).
- **Tempo real em tudo (padrão portal181), sem cache.** Roda em Node
  (`output: "standalone"`); `app/(public)/layout.tsx` é `force-dynamic`:
  cada acesso renderiza no servidor com o dado atual (SEO). No navegador,
  `components/public/AoVivo.tsx` (AoVivoProvider) mantém configuração e
  vitrine (empresas, unidades, serviços, categorias, vantagens, campanhas)
  com onSnapshot; Header/Footer ouvem `paginas`; AvisosClient ouve `avisos`;
  a página do parceiro ouve `avaliacoes`. Editou no painel → muda na tela
  aberta em ~0,3 s, sem recarregar. Conteúdo de cada página fica em
  `components/paginas/*.tsx` (client, lê `useConfiguracao`/`useVitrine`);
  o `page.tsx` só tem metadata e o 404 do servidor. Não voltar a usar
  `revalidate`/ISR nem `generateStaticParams`.
- **Mesmo Firebase do painel** (`omnichannel-b4696`), multi-tenant em
  `dados/{tenant}/<colecao>`; tenant em `NEXT_PUBLIC_PETHUB_PATH` (sem
  padrão — é o `path` do cliente PetGo360/Portal Pet no painel). Acesso
  sempre por `lib/firebase/gen.ts`.
- **Regras de publicação** (em `lib/data.ts`): empresa/unidade/serviço/
  categoria `ativo`; vantagem `ativa` + período + `"site"` em `canais`;
  campanha OFF `ativa` + período + canal site + saldo; avaliação
  `publicada`; página `publicada`; aviso `ativo` + período. Parceiro sem
  unidade ativa não aparece. Destaques da Home = `destaque_site` na ordem
  de `ordem_destaque`.
- **Só dado público.** Nunca ler clientes, pets, reservas, pagamentos ou
<<<<<<< HEAD
  prontuário no site. A carteira de vacinação é só no app (acesso do
=======
  prontuário no site. A Carteira do Pet (vacinas, saúde e histórico) é só no app (acesso do
>>>>>>> 8c6abb8 (last commit)
  parceiro por QR Code do tutor) — nunca expor aqui.
- **Única escrita:** "Quero ser parceiro" → `leads_parceiros` (origem
  "site", aceite LGPD obrigatório, id sequencial igual ao `onSaveIncrement`
  do painel — `criarComIdSequencial`). Validação em `lib/leads.ts` espelha
  o `LeadParceiroShema`.
- **Só dado real, sem mock** (removido para produção). Tenant obrigatório
  (`NEXT_PUBLIC_PETHUB_PATH`, hoje `PETHUB360`): sem ele o build falha.
  Falha de leitura no servidor LANÇA erro de propósito — em produção o ISR
  segue servindo a última versão boa em vez de cachear página vazia;
  `app/(public)/error.tsx` e `not-found.tsx` cobrem o resto. Sem registro
  de configuração do site: só marca/cores (`CONFIGURACAO_BASE`), nada inventado.
- **Markdown** (páginas/avisos) sempre por `components/public/Markdown.tsx`
  (rehype-raw + rehype-sanitize).
- Depois de mexer em `page.tsx`/`layout.tsx` (Server Components) rodar
  `npm run build`; se aparecer `PageNotFoundError`, apagar `.next` e repetir.

## Pendências

- Portal do Parceiro (área autenticada no site) — `/entrar` hoje só orienta.
- Audiência do site (acessos) para o Dashboard do Portal Pet.
- Firestore rules: herdadas do portal181, revisar para as coleções do PetHub.
- **Vitrine ao vivo expõe documentos inteiros ao navegador** (empresas com
  comissão/CNPJ/razão social, campanhas com custo do cupom). Com as regras
  abertas já eram legíveis, mas agora vão para todo visitante. Solução:
  coleção pública de vitrine (só campos de exibição) gerada pelo backend, e
  regras bloqueando leitura pública das coleções completas.
- Repositório git próprio e deploy.
