"use client";

import Link from "next/link";
import { useEffect } from "react";

// Falha ao ler o Firebase (ou outro erro inesperado) numa página do site.
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[pethub] erro na página", error);
  }, [error]);
  return (
    <section className="secao">
      <div className="wrap" style={{ maxWidth: 640, textAlign: "center" }}>
        <h1 className="titulo">Não foi possível carregar esta página</h1>
        <p className="sub" style={{ margin: "0 auto" }}>Tente de novo em instantes. Se continuar, fale com a gente.</p>
        <div className="acoes" style={{ justifyContent: "center" }}>
          <button type="button" className="btn btn-primario" onClick={reset}>Tentar de novo</button>
          <Link href="/" className="btn btn-contorno">Ir para o início</Link>
        </div>
      </div>
    </section>
  );
}
