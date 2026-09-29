import type { Metadata } from "next";
import { Suspense } from "react";
import BuscaParceiros from "@/components/vitrine/BuscaParceiros";

export const metadata: Metadata = { title: "Serviços", description: "Encontre clínicas, pet shops, banho e tosa, hotéis, transporte e outros serviços pet perto de você." };

export default async function ServicosPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <>
      <section className="pagina-cab">
        <div className="wrap">
          <div className="eyebrow">Serviços</div>
          <h1>Tudo que seu pet precisa, perto de você</h1>
          <p className="sub">Clínicas, hospitais veterinários, pet shops, banho e tosa, hotéis e creches, transporte e atendimento em casa. A reserva é pelo app PetGo360 ou pelo WhatsApp.</p>
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
