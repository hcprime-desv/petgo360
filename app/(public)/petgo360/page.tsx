import type { Metadata } from "next";
import PetGo360 from "@/components/paginas/PetGo360";

<<<<<<< HEAD
export const metadata: Metadata = { title: "PetGo360", description: "O app do tutor: agende serviços, acompanhe a carteira de vacinação digital, acumule pontos e use cupons dos parceiros." };
=======
export const metadata: Metadata = { title: "PetGo360", description: "O app do tutor: agende serviços, acompanhe a Carteira do Pet (vacinas, saúde e histórico), acumule pontos e use cupons dos parceiros." };
>>>>>>> 8c6abb8 (last commit)

// Conteúdo em components/paginas/PetGo360.tsx (client, dados ao vivo do AoVivoProvider).
export default function PetGo360Page() {
  return <PetGo360 />;
}
