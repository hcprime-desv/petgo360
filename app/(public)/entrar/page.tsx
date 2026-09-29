import type { Metadata } from "next";
import Entrar from "@/components/paginas/Entrar";

export const metadata: Metadata = { title: "Entrar" };

// Conteúdo em components/paginas/Entrar.tsx (client, dados ao vivo do AoVivoProvider).
export default function EntrarPage() {
  return <Entrar />;
}
