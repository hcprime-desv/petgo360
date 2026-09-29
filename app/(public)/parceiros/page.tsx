import type { Metadata } from "next";
import { Suspense } from "react";
import BuscaParceiros from "@/components/vitrine/BuscaParceiros";

export const metadata: Metadata = { title: "Parceiros", description: "Vitrine de parceiros PetHub360: filtre por categoria, cidade e benefícios disponíveis." };

export default async function ParceirosPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <>
      <section className="pagina-cab">
        <div className="wrap">
          <div className="eyebrow">Parceiros</div>
          <h1>Parceiros PetHub360</h1>
          <p className="sub">Estabelecimentos e profissionais avaliados por tutores. Veja serviços, preços de referência, unidades e os cupons e vantagens de cada um.</p>
        </div>
      </section>
      <section className="secao" style={{ paddingTop: 28 }}>
        <div className="wrap">
          <Suspense><BuscaParceiros inicial={{ q: sp.q, categoria: sp.categoria, cidade: sp.cidade }} /></Suspense>
        </div>
      </section>
    </>
  );
}
