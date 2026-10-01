import type { Metadata } from "next";
import PetGo360 from "@/components/paginas/PetGo360";

export const metadata: Metadata = { title: "PetGo360", description: "O app do tutor: agende serviços, acompanhe a Carteira do Pet (vacinas, saúde e histórico), acumule pontos e use cupons dos parceiros." };

// Conteúdo em components/paginas/PetGo360.tsx (client, dados ao vivo do AoVivoProvider).
export default function PetGo360Page() {
  return <PetGo360 />;
}
