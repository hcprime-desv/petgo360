import type { Metadata } from "next";
import CarteiraVet from "@/components/CarteiraVet";

// Carteira do pet aberta pelo QR Code do app (sem login, sem app) — fora do
// índice dos buscadores.
export const metadata: Metadata = { title: "Carteira do pet", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CarteiraPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <CarteiraVet token={token} />;
}
