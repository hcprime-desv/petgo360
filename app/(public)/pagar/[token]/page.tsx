import type { Metadata } from "next";
import PagarLink from "@/components/pagamento/PagarLink";

// Link de pagamento da reserva (mandado pelo WhatsApp). Tudo é lido no
// navegador pelo token da sessão — nada de dado pessoal no HTML do servidor
// nem no Google.
export const metadata: Metadata = { title: "Pagamento da reserva", robots: { index: false, follow: false } };

export default async function PagarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <section className="secao">
      <div className="wrap" style={{ maxWidth: 640 }}>
        <PagarLink token={token} />
      </div>
    </section>
  );
}
