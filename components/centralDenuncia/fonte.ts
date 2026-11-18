// GERADO por "npm run sync:app" no painel PetGo360 a partir de shared/centralDenuncia/fonte.ts — NÃO EDITAR AQUI.
// CENTRAL DE DENÚNCIAS (dono, 18/11/2026) — a MESMA tela no PAINEL (órgãos, estados e a central do PetGo) e no PORTAL do
// site (/admin/denuncias — ONGs e protetores). Fonte única: apps/petgo360/shared/centralDenuncia/ — o `npm run sync:app`
// copia para o site (components/centralDenuncia). A tela só conhece esta FONTE; cada lado entrega a sua (painel = gen do
// núcleo; site = lib/admin/banco). Sem Bootstrap/Tailwind: estilos próprios (claro e escuro azul).
export type Filtro = [campo: string, op: "==" | "array-contains", valor: any];

export type FonteCentral = {
  /** lista ao vivo (filtro opcional); devolve a função que para de ouvir */
  ouvir: (colecao: string, filtro: Filtro | null, cb: (docs: any[]) => void) => () => void;
  /** grava com id fixo (merge) */
  definir: (colecao: string, id: string, dados: Record<string, any>) => Promise<void>;
  /** grava com id novo */
  adicionar: (colecao: string, dados: Record<string, any>) => Promise<string>;
  atualizar: (colecao: string, id: string, dados: Record<string, any>) => Promise<void>;
  /** sobe o arquivo (foto, vídeo, áudio, documento) e devolve o link público */
  subir: (arquivo: Blob, nome: string) => Promise<string>;
  /** quem está usando */
  usuario: { id: string; nome: string };
  /** PUC do usuário (órgão/ONG/protetor) — null = CENTRAL do PetGo (vê todas as denúncias) */
  puc: Record<string, any> | null;
  /** trilha de auditoria (opcional) */
  auditar?: (descricao: string, dados: Record<string, any>) => void;
};
