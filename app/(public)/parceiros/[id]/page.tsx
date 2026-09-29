import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buscarParceiro } from "@/lib/data";
import { ROTULOS_TIPO_EMPRESA } from "@/lib/util";
import Parceiro from "@/components/paginas/Parceiro";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const r = await buscarParceiro((await params).id);
  return r ? { title: r.parceiro.nome, description: r.parceiro.descricao || `${ROTULOS_TIPO_EMPRESA[r.parceiro.tipo] ?? "Parceiro"} na rede PetHub360.` } : { title: "Parceiro" };
}

// O servidor confere se o parceiro está na vitrine (404 se não) e manda as
// avaliações atuais; a página segue ao vivo em components/paginas/Parceiro.tsx.
export default async function ParceiroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await buscarParceiro(id);
  if (!r) notFound();
  return <Parceiro id={id} avaliacoesIniciais={r.avaliacoes} />;
}
