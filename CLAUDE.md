# PetGo360 — site público (modelo novo, 06/11/2026)

Site do app **PetGo360 — o passaporte de saúde do pet / gestor da vida do pet**
(Next.js 15, App Router). O antigo site do marketplace PetHub360 (vitrine,
parceiros, clube, pagamento) foi REMOVIDO: o produto atual virou o PetVet
(`sites/petvet`), e o nome PetGo360 passou para este novo produto.

## Páginas
- `/` — apresentação (layout do site padrão p2pcorp: hero, como funciona,
  módulos com preços ao vivo de `modulos_app`, veterinários, baixar o app).
- `/c/<token>` — **página do profissional pelo QR Code do app** (sem login,
  sem app): lê a CÓPIA temporária da carteira gravada no acesso
  (`acessos_carteiras_pets.copia`, porque os dados do pet ficam no celular do
  tutor), abre o acesso (10 min para abrir; 1 h liberado) e grava o que o
  profissional registrar/validar em `registros_profissionais` (caixa de
  entrada que o app importa) + `notificacoes` para o tutor.
- `/privacidade` e `/termos-de-uso` — das Páginas do painel (status
  Publicado); sem texto lá, vale `lib/textosLegais.ts` (revisar com o
  jurídico antes de publicar nas lojas).

## Regras e dados
- Regras em `lib/compartilhado/` = CÓPIA do painel (`apps/petgo360/shared/
  compartilhado`, `npm run sync:app` lá) — não editar aqui.
- Tenant: `NEXT_PUBLIC_PETHUB_PATH` no `.env.local` (nome antigo mantido para
  não quebrar o deploy; valor `PETGO360`).
- Datas sempre em milissegundos (`lib/firebase/gen.ts` converte).

## Layout
`app/globals.css` = CSS do `sites/p2pcorp` copiado + "Complemento PetGo360"
no fim (cor verde-azulado #0f766e, laranja de destaque, página do vet).
Logos: `python scripts/gerar-marca.py petgo360` (raiz do core360) gera em
`apps/petgo360/public/assets/images`; copiar `logo-petgo360.png`,
`logo-petgo360-claro.png` (→ `-branco`) e `simbolo-petgo360.png` para
`public/images/`.

## Build
`pnpm build` / `pnpm start` (Node, `output: "standalone"`). O `next build`
não confere tipos (`typescript.ignoreBuildErrors`, erro falso de React 18×19
no monorepo); tipos pelo `pnpm typecheck`. Publicação: repositório próprio
(`bash scripts/publicar-site.sh petgo <url> "msg" --enviar` na raiz).
