// GERADO por "npm run sync:app" no painel (projetos/petGo360) para o site público (site/petGo), a partir de
// shared/compartilhado/qrcodes.ts — NÃO EDITAR AQUI: altere no painel e sincronize.

// ═══ COMPARTILHADO painel ⇄ app do parceiro ═══════════════════════════════
// Formato dos QR Codes do ecossistema (vouchers, cupons, carteira) e leitura (ver reservas.ts para as
// regras desta pasta). O app do tutor GERA; o app/portal do parceiro e o
// painel LEEM. Mesmo formato em todo lugar.
//
// Voucher da reserva: o QR carrega o `codigo_voucher` (código curto aleatório
// da reserva), NUNCA o id — id é sequencial e daria para "adivinhar" o voucher
// de outra reserva. A busca é sempre por codigo_voucher + id_empresas do parceiro.

export const PREFIXO_QR = {
  voucher: "petgo360://voucher/",
  cupom_off: "petgo360://cupom-off/",
  carteira: "petgo360://carteira/",
} as const;

export type TipoQr = keyof typeof PREFIXO_QR;

export const qrDoVoucher = (codigoVoucher: string) => `${PREFIXO_QR.voucher}${codigoVoucher}`;

const CODIGO = /^[A-Z0-9]{4,16}$/;
// Com prefixo, o código pode ter hífen no meio (cupom OFF: "B45-H4T6MQXS").
const CODIGO_COM_PREFIXO = /^[A-Z0-9](?:[A-Z0-9-]{2,30})[A-Z0-9]$/;

// Lê o texto de um QR (ou o que o atendente digitou) e diz o que é.
// Código digitado sem prefixo é tratado como voucher de reserva.
export function lerQrCode(texto: string): { tipo: TipoQr; codigo: string } | null {
  const bruto = (texto || "").trim();
  for (const tipo of Object.keys(PREFIXO_QR) as TipoQr[]) {
    const prefixo = PREFIXO_QR[tipo];
    if (bruto.toLowerCase().startsWith(prefixo)) {
      const resto = bruto.slice(prefixo.length).trim();
      if (!resto) return null;
      // Token da carteira é longo e sensível a maiúsculas — não normaliza.
      if (tipo === "carteira") return { tipo, codigo: resto };
      const codigo = resto.toUpperCase();
      return CODIGO_COM_PREFIXO.test(codigo) ? { tipo, codigo } : null;
    }
  }
  const codigo = bruto.replace(/[\s-]/g, "").toUpperCase();
  return CODIGO.test(codigo) ? { tipo: "voucher", codigo } : null;
}
