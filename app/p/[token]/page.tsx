import type { Metadata } from "next";
import PassaportePublico from "@/components/PassaportePublico";

// QR PERMANENTE do passaporte do pet: só a identificação e "Encontrei este pet" — fora do índice dos buscadores.
export const metadata: Metadata = { title: "Passaporte do pet", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PassaportePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PassaportePublico token={token} />;
}
