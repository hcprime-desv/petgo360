"use client";

// Conteúdo do site AO VIVO no navegador (editou no /admin ou no admsite360, muda na tela). Regras de leitura em lib/site.ts.
import { useEffect, useState } from "react";
import { getAll } from "@/lib/firebase/gen";
import { mapearAvisos, mapearConfig, mapearPerguntas, type Aviso, type ConfigSite, type Pergunta } from "./site";

function useColecao<T>(colecao: string, mapear: (docs: any[]) => T, inicial: T): T {
  const [v, setV] = useState<T>(inicial);
  useEffect(() => {
    try { return getAll(colecao, (docs) => setV(mapear(docs))); } catch { return undefined; } // sem banco configurado: fica o inicial
  }, [colecao]); // eslint-disable-line react-hooks/exhaustive-deps
  return v;
}
export const useConfigSite = (inicial: ConfigSite) => useColecao("configuracoes_site", mapearConfig, inicial);
export const useAvisos = () => useColecao<Aviso[]>("avisos_site", mapearAvisos, []);
export const usePerguntas = () => useColecao<Pergunta[]>("perguntas_frequentes", mapearPerguntas, []);
