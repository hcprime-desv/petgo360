import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buscarPaginaPorSlug, listarPaginasPublicadas } from "@/lib/data";
import PaginaConteudo from "@/components/public/PaginaConteudo";

export const revalidate = 300;

// Pré-render dos slugs conhecidos; slug novo renderiza sob demanda (SSR).
export async function generateStaticParams() {
  return (await listarPaginasPublicadas()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const pagina = await buscarPaginaPorSlug((await params).slug);
  return { title: pagina?.titulo ?? "Página", description: pagina?.seoDescricao || pagina?.resumo || undefined };
}

export default async function PaginaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pagina = await buscarPaginaPorSlug(slug);
  if (!pagina) notFound();
  return <PaginaConteudo inicial={pagina} slug={slug} />;
}
