"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { subscribeConfiguracao, subscribeVitrine } from "@/lib/data";
import type { Configuracao, Vitrine } from "@/types/conteudo";

// Dados ao vivo do site (padrão portal181): o servidor manda o estado atual
// no HTML e, no navegador, um único conjunto de listeners (onSnapshot) mantém
// configuração e vitrine sincronizadas com o Firestore para todas as páginas.
// Editou no painel → muda na tela aberta, sem recarregar.
type Estado = { configuracao: Configuracao; vitrine: Vitrine };
const Contexto = createContext<Estado | null>(null);

export function AoVivoProvider({ configuracao, vitrine, children }: Estado & { children: React.ReactNode }) {
  const [c, setC] = useState(configuracao);
  const [v, setV] = useState(vitrine);
  useEffect(() => subscribeConfiguracao(setC), []);
  useEffect(() => subscribeVitrine(setV), []);
  // Cores da Configuração do site sobrescrevem --g/--o (globals.css).
  const tema = { ["--g" as any]: c.corPrimaria, ["--o" as any]: c.corDestaque } as React.CSSProperties;
  return (
    <Contexto.Provider value={{ configuracao: c, vitrine: v }}>
      <div style={tema}>{children}</div>
    </Contexto.Provider>
  );
}

function useAoVivo(): Estado {
  const e = useContext(Contexto);
  if (!e) throw new Error("useAoVivo fora do AoVivoProvider (app/(public)/layout.tsx).");
  return e;
}
export const useConfiguracao = () => useAoVivo().configuracao;
export const useVitrine = () => useAoVivo().vitrine;
