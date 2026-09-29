import type { Metadata } from "next";
import Clube from "@/components/paginas/Clube";

export const metadata: Metadata = { title: "Clube Pet", description: "Cupons OFF e vantagens exclusivas nos parceiros PetHub360. Descubra no site e resgate no app PetGo360." };

// Conteúdo em components/paginas/Clube.tsx (client, dados ao vivo do AoVivoProvider).
export default function ClubePage() {
  return <Clube />;
}
