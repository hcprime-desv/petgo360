import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Markdown from "@/components/public/Markdown";
import { filtrarOnce } from "@/lib/firebase/gen";
import { TEXTOS_LEGAIS } from "@/lib/textosLegais";

// Páginas do /admin ou do admsite360 (Páginas, status Publicado) — Termos de uso e Política de
// privacidade (as lojas exigem as duas públicas). Sem texto no painel, vale o
// padrão de lib/textosLegais.ts.
export const dynamic = "force-dynamic";

async function pagina(slug: string): Promise<{ titulo: string; conteudo: string } | null> {
  try {
    // paginas_site = coleção do /admin e do admsite360; paginas = a antiga do painel PetGo360 (ainda vale).
    for (const colecao of ["paginas_site", "paginas"]) {
      const [p] = (await filtrarOnce(colecao, "slug", slug)).filter((x) => x.status === "Publicado" || x.status === "publicado" || x.status === "ativo");
      if (p?.conteudo) return { titulo: p.titulo, conteudo: p.conteudo };
    }
  } catch { /* sem banco: usa o padrão */ }
  return TEXTOS_LEGAIS[slug] ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: (await pagina(slug))?.titulo ?? "Página" };
}

export default async function PaginaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await pagina(slug);
  if (!p) notFound();
  return (
    <>
      <section className="pagina-cab"><div className="container"><div className="eyebrow">PetGo360</div><h1>{p.titulo}</h1></div></section>
      <section className="section pagina-corpo"><div className="container estreito"><div className="markdown-body"><Markdown>{p.conteudo}</Markdown></div></div></section>
    </>
  );
}
