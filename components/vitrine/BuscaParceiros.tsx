"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LocateFixed, Search, X } from "lucide-react";
import { distanciaKm } from "@/lib/util";
import { CardParceiro } from "./Cards";
import { useVitrine } from "@/components/public/AoVivo";

type Posicao = { latitude: number; longitude: number };

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Busca de parceiros/serviços (páginas /servicos e /parceiros). Tudo no
// navegador sobre a vitrine ao vivo (AoVivoProvider — atualiza sozinha):
// texto (nome do parceiro ou do serviço), categoria, cidade, "com
// benefício" e "perto de mim" (geolocalização → ordena pela unidade mais
// próxima). Filtros vão pra URL (?q=&categoria=&cidade=) pra poder compartilhar.
export default function BuscaParceiros({ inicial }: { inicial: { q?: string; categoria?: string; cidade?: string } }) {
  const vitrine = useVitrine(); // ao vivo (AoVivoProvider)
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(inicial.q ?? "");
  const [categoria, setCategoria] = useState(inicial.categoria ?? "");
  const [cidade, setCidade] = useState(inicial.cidade ?? "");
  const [soBeneficio, setSoBeneficio] = useState(false);
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const [geoMsg, setGeoMsg] = useState("");

  const cidades = useMemo(
    () => Array.from(new Set(vitrine.parceiros.flatMap((p) => p.unidades.map((u) => (u.municipio ? `${u.municipio}/${u.uf}` : ""))).filter(Boolean))).sort(),
    [vitrine],
  );
  const beneficiosPor = useMemo(() => {
    const m = new Map<string, number>();
    vitrine.beneficios.forEach((b) => m.set(b.idEmpresa, (m.get(b.idEmpresa) ?? 0) + 1));
    return m;
  }, [vitrine]);

  const sincronizarUrl = (patch: Record<string, string>) => {
    const atual = { q, categoria, cidade, ...patch };
    const sp = new URLSearchParams(Object.entries(atual).filter(([, v]) => v));
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  const resultado = useMemo(() => {
    const termo = normalizar(q.trim());
    return vitrine.parceiros
      .map((p) => {
        const unidades = cidade ? p.unidades.filter((u) => `${u.municipio}/${u.uf}` === cidade) : p.unidades;
        const comGeo = unidades.filter((u) => u.latitude !== null && u.longitude !== null);
        const distancia = posicao && comGeo.length
          ? Math.min(...comGeo.map((u) => distanciaKm(posicao, { latitude: u.latitude!, longitude: u.longitude! })))
          : null;
        return { p, unidades, distancia };
      })
      .filter(({ p, unidades }) =>
        unidades.length > 0 &&
        (!categoria || p.categorias.includes(categoria)) &&
        (!soBeneficio || (beneficiosPor.get(p.id) ?? 0) > 0) &&
        (!termo || normalizar(p.nome).includes(termo) || p.servicos.some((s) => normalizar(s.nome).includes(termo) || normalizar(s.descricao).includes(termo))),
      )
      .sort((a, b) => (a.distancia !== null && b.distancia !== null ? a.distancia - b.distancia : Number(b.p.destaque) - Number(a.p.destaque)));
  }, [vitrine, q, categoria, cidade, soBeneficio, posicao, beneficiosPor]);

  const pertoDeMim = () => {
    if (posicao) { setPosicao(null); setGeoMsg(""); return; }
    if (!("geolocation" in navigator)) { setGeoMsg("Seu navegador não informa a localização."); return; }
    setGeoMsg("Buscando sua localização…");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPosicao({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); setGeoMsg("Ordenado pela distância até você."); },
      () => setGeoMsg("Não foi possível obter sua localização. Filtre pela cidade."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  const limpar = () => { setQ(""); setCategoria(""); setCidade(""); setSoBeneficio(false); sincronizarUrl({ q: "", categoria: "", cidade: "" }); };
  const temFiltro = q || categoria || cidade || soBeneficio;

  return (
    <>
      <form className="busca-barra" role="search" onSubmit={(e) => { e.preventDefault(); sincronizarUrl({}); }}>
        <div className="campo">
          <label htmlFor="busca-q">O que seu pet precisa?</label>
          <input id="busca-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex.: banho e tosa, vacina, consulta, hotel…" />
        </div>
        <div className="campo">
          <label htmlFor="busca-cidade">Cidade</label>
          <select id="busca-cidade" value={cidade} onChange={(e) => { setCidade(e.target.value); sincronizarUrl({ cidade: e.target.value }); }}>
            <option value="">Todas</option>
            {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="busca-beneficio">Benefícios</label>
          <select id="busca-beneficio" value={soBeneficio ? "1" : ""} onChange={(e) => setSoBeneficio(e.target.value === "1")}>
            <option value="">Todos os parceiros</option>
            <option value="1">Só com cupom ou vantagem</option>
          </select>
        </div>
        <div className="campo" style={{ justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-primario"><Search size={18} /> Buscar</button>
        </div>
      </form>

      <div className="chips" role="group" aria-label="Categorias">
        <button type="button" className={`chip${!categoria ? " ativo" : ""}`} aria-pressed={!categoria} onClick={() => { setCategoria(""); sincronizarUrl({ categoria: "" }); }}>Todas</button>
        {vitrine.categorias.map((c) => (
          <button key={c.id} type="button" className={`chip${categoria === c.id ? " ativo" : ""}`} aria-pressed={categoria === c.id}
            onClick={() => { const v = categoria === c.id ? "" : c.id; setCategoria(v); sincronizarUrl({ categoria: v }); }}>
            {c.nome}
          </button>
        ))}
      </div>

      <div className="resultado-cab">
        <div aria-live="polite"><b>{resultado.length}</b> parceiro{resultado.length === 1 ? "" : "s"} encontrado{resultado.length === 1 ? "" : "s"}{geoMsg && <span className="mut"> · {geoMsg}</span>}</div>
        <div className="acoes" style={{ marginTop: 0 }}>
          {temFiltro && <button type="button" className="btn btn-contorno btn-sm" onClick={limpar}><X size={16} /> Limpar filtros</button>}
          <button type="button" className={`btn btn-sm ${posicao ? "btn-verde" : "btn-contorno"}`} onClick={pertoDeMim} aria-pressed={!!posicao}>
            <LocateFixed size={16} /> Perto de mim
          </button>
        </div>
      </div>

      {resultado.length ? (
        <div className="grade3">
          {resultado.map(({ p, distancia }) => (
            <CardParceiro key={p.id} parceiro={p} beneficios={beneficiosPor.get(p.id) ?? 0} distancia={distancia} categorias={vitrine.categorias} />
          ))}
        </div>
      ) : (
        <div className="vazio">Nenhum parceiro com esses filtros. Tente outra categoria ou cidade.</div>
      )}
    </>
  );
}
