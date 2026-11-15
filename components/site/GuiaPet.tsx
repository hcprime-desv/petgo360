"use client";
// GUIA PET (dono, 15/11/2026): a mesma busca do app, no site — tudo do mundo animal num MAPA DO GOOGLE (exigência do Google para
// mostrar dados do Places). Cada categoria com a sua cor no pino; PARCEIRO PETGO primeiro, maior, com anel dourado e estrela.
// Clicar num lugar: trajeto desenhado com distância e tempo, telefone, WhatsApp, endereço, horário e navegação (Google Maps/Waze).
// O site grava o PEDIDO em `guia_buscas` e o back-end petall360 responde (a chave do Places fica no servidor). A chave do mapa
// (JavaScript) é NEXT_PUBLIC_GOOGLE_MAPS_KEY — sem ela, o mapa aparece em quadro simples (sem pinos).
import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Navigation, Phone, Search, Globe, Star } from "lucide-react";
import { gravarComId, getDocOn } from "@/lib/firebase/gen";
import {
  CATEGORIAS_GUIA, COLECAO_GUIA, COR_PARCEIRO, COR_SEM_CATEGORIA, RAIO_PADRAO_KM, categoriaGuia, decodificarPolyline, linksLugar,
  planejarBusca, planejarRota, textoDistancia, textoDuracao, type LugarGuia, type Ponto,
} from "@/lib/compartilhado/guiaPet";

const CHAVE_MAPA = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";
const corDe = (l: LugarGuia) => categoriaGuia(l.categoria)?.cor ?? COR_SEM_CATEGORIA;

function chaveNavegador(): string {
  const k = "petgo-guia-navegador";
  try {
    let v = localStorage.getItem(k);
    if (!v) { v = Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join(""); localStorage.setItem(k, v); }
    return v;
  } catch { return `s${Date.now()}`; }
}
let carregando: Promise<any> | null = null;
function carregarMapa(): Promise<any> {
  const w = window as any;
  if (w.google?.maps) return Promise.resolve(w.google);
  if (!carregando) carregando = new Promise((ok, erro) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(CHAVE_MAPA)}&v=weekly&language=pt-BR&region=BR`;
    s.async = true; s.onload = () => ok(w.google); s.onerror = () => erro(new Error("mapa"));
    document.head.appendChild(s);
  });
  return carregando;
}
function usePedido(id: string | null) {
  const [doc, setDoc] = useState<any | null>(null);
  useEffect(() => { setDoc(null); if (!id) return; return getDocOn(COLECAO_GUIA, id, setDoc); }, [id]);
  return doc;
}
async function gravarPedido(dados: Record<string, any>): Promise<string> {
  const id = `site_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await gravarComId(COLECAO_GUIA, id, { ...dados, id });
  return id;
}

export default function GuiaPet() {
  const [origem, setOrigem] = useState<Ponto | null>(null);
  const [semGps, setSemGps] = useState(false);
  const [cidade, setCidade] = useState("");
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [raio, setRaio] = useState(RAIO_PADRAO_KM);
  const [idBusca, setIdBusca] = useState<string | null>(null);
  const [idRota, setIdRota] = useState<string | null>(null);
  const [sel, setSel] = useState<LugarGuia | null>(null);
  const [rotas, setRotas] = useState<Record<string, any>>({});
  const [erro, setErro] = useState("");
  const busca = usePedido(idBusca);
  const rota = usePedido(idRota);
  const caixa = useRef<HTMLDivElement>(null);
  const mapa = useRef<any>(null);
  const camadas = useRef<any[]>([]);
  const [mapaPronto, setMapaPronto] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) { setSemGps(true); return; }
    navigator.geolocation.getCurrentPosition((p) => setOrigem({ latitude: p.coords.latitude, longitude: p.coords.longitude }), () => setSemGps(true), { timeout: 10000, maximumAge: 600000 });
  }, []);
  useEffect(() => {
    if (!CHAVE_MAPA || !caixa.current) return;
    carregarMapa().then((g) => {
      if (!caixa.current || mapa.current) return;
      mapa.current = new g.maps.Map(caixa.current, { center: { lat: -3.1, lng: -60.02 }, zoom: 12, mapTypeControl: false, streetViewControl: false, fullscreenControl: false });
      setMapaPronto(true);
    }).catch(() => setErro("Não foi possível carregar o mapa."));
  }, []);
  useEffect(() => { if (rota?.status === "pronto" && sel) setRotas((r) => ({ ...r, [sel.id]: rota.resultado })); }, [rota?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const lugares: LugarGuia[] = busca?.status === "pronto" ? busca.resultado?.lugares ?? [] : [];
  const buscando = !!idBusca && (!busca || busca.status === "pedido" || busca.status === "buscando");
  const rotaSel = sel ? rotas[sel.id] : null;
  const trajeto = useMemo(() => (rotaSel?.polyline ? decodificarPolyline(rotaSel.polyline) : []), [rotaSel]);

  // desenha pinos, trajeto e enquadra
  useEffect(() => {
    const g = (window as any).google; const m = mapa.current;
    if (!mapaPronto || !g || !m) return;
    camadas.current.forEach((c) => c.setMap(null)); camadas.current = [];
    const limites = new g.maps.LatLngBounds();
    if (origem) {
      camadas.current.push(new g.maps.Marker({ map: m, position: { lat: origem.latitude, lng: origem.longitude }, title: "Você", icon: { path: g.maps.SymbolPath.CIRCLE, scale: 7, fillColor: "#2563EB", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 } }));
      limites.extend({ lat: origem.latitude, lng: origem.longitude });
    }
    for (const l of lugares) {
      const marcado = sel?.id === l.id;
      const mk = new g.maps.Marker({
        map: m, position: { lat: l.latitude, lng: l.longitude }, title: l.parceiro ? `★ Parceiro PetGo — ${l.nome}` : l.nome, zIndex: l.parceiro ? 1000 : marcado ? 900 : 1,
        label: l.parceiro ? { text: "★", color: "#FFFFFF", fontSize: "15px", fontWeight: "800" } : undefined,
        icon: { path: g.maps.SymbolPath.CIRCLE, scale: (l.parceiro ? 14 : 9) * (marcado ? 1.25 : 1), fillColor: corDe(l), fillOpacity: 1, strokeColor: l.parceiro ? COR_PARCEIRO : "#FFFFFF", strokeWeight: l.parceiro ? 4 : 2.5 },
      });
      mk.addListener("click", () => selecionar(l));
      camadas.current.push(mk);
      if (!trajeto.length) limites.extend({ lat: l.latitude, lng: l.longitude });
    }
    if (trajeto.length > 1 && sel) {
      camadas.current.push(new g.maps.Polyline({ map: m, path: trajeto.map((p) => ({ lat: p.latitude, lng: p.longitude })), strokeColor: corDe(sel), strokeWeight: 5, strokeOpacity: 0.9 }));
      trajeto.forEach((p) => limites.extend({ lat: p.latitude, lng: p.longitude }));
    }
    if (!limites.isEmpty()) m.fitBounds(limites, 50);
  }, [mapaPronto, lugares, sel, trajeto, origem]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onde(): Promise<Ponto | null> {
    if (origem) return origem;
    if (!cidade.trim() || !CHAVE_MAPA) return null;
    const g = await carregarMapa();
    const r = await new g.maps.Geocoder().geocode({ address: `${cidade}, Brasil` }).catch(() => null);
    const loc = r?.results?.[0]?.geometry?.location;
    if (!loc) return null;
    const p = { latitude: loc.lat(), longitude: loc.lng() };
    setOrigem(p);
    return p;
  }
  async function buscar(cat: string | null = categoria) {
    setErro("");
    try {
      const o = await onde();
      if (!o) { setErro("Libere a localização do navegador ou digite a sua cidade."); return; }
      setSel(null); setIdRota(null);
      setIdBusca(await gravarPedido(planejarBusca({ texto, categoria: cat, origem: o, raioKm: raio, idClientes: null, chaveOrigem: chaveNavegador(), canal: "site" })));
    } catch (e: any) { setErro(e?.message || "Não foi possível buscar agora."); }
  }
  function selecionar(l: LugarGuia) {
    setSel(l);
    if (rotas[l.id] || !origem) return;
    gravarPedido(planejarRota({ origem, lugar: l, idClientes: null, chaveOrigem: chaveNavegador(), canal: "site" })).then(setIdRota).catch(() => {});
  }

  return (
    <div className="guia">
      <form className="guia-busca" onSubmit={(e) => { e.preventDefault(); buscar(); }}>
        <Search size={20} aria-hidden />
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Veterinário, pet shop, banho e tosa…" aria-label="O que você procura" />
        <select value={raio} onChange={(e) => setRaio(Number(e.target.value))} aria-label="Distância">{[5, 10, 20].map((r) => <option key={r} value={r}>até {r} km</option>)}</select>
        <button type="submit" className="btn btn-primary">Buscar</button>
      </form>
      <div className="guia-cats">
        {CATEGORIAS_GUIA.map((c) => {
          const ativa = categoria === c.id;
          return <button key={c.id} type="button" className="guia-cat" style={{ borderColor: c.cor, background: ativa ? c.cor : "transparent", color: ativa ? "#fff" : c.cor }} aria-pressed={ativa}
            onClick={() => { const nova = ativa ? null : c.id; setCategoria(nova); if (nova) buscar(nova); }}>{c.rotulo}</button>;
        })}
      </div>
      {semGps && !origem ? <div className="guia-cidade"><MapPin size={18} aria-hidden /><input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Sua cidade (ex.: Manaus - AM)" aria-label="Sua cidade" /></div> : null}
      {erro ? <p className="guia-erro" role="alert">{erro}</p> : null}

      <div className="guia-grade">
        <div className="guia-mapa">
          {CHAVE_MAPA ? <div ref={caixa} style={{ width: "100%", height: "100%" }} /> : (
            <iframe title="Mapa" style={{ border: 0, width: "100%", height: "100%" }} loading="lazy"
              src={`https://maps.google.com/maps?q=${sel ? `${sel.latitude},${sel.longitude}` : origem ? `${origem.latitude},${origem.longitude}` : "Brasil"}&z=${sel ? 16 : 12}&output=embed`} />
          )}
        </div>
        <div className="guia-lista">
          {buscando ? <p className="guia-sub">Procurando perto de você…</p> : null}
          {busca?.status === "erro" ? <p className="guia-erro">{busca.erro}</p> : null}
          {(busca?.resultado?.avisos ?? []).map((a: string, i: number) => <p key={i} className="guia-sub">{a}</p>)}
          {!idBusca ? <p className="guia-sub">Escolha uma categoria ou digite o que procura. Os <b>parceiros PetGo</b> aparecem primeiro, com a estrela dourada.</p> : null}

          {sel ? (
            <div className="guia-ficha" style={{ borderColor: sel.parceiro ? COR_PARCEIRO : corDe(sel) }}>
              {sel.parceiro ? <span className="guia-selo"><Star size={12} aria-hidden /> PARCEIRO PETGO</span> : null}
              <h3>{sel.nome}</h3>
              <p className="guia-sub">{[sel.tipo, sel.nota ? `★ ${sel.nota.toFixed(1).replace(".", ",")} (${sel.avaliacoes})` : "", sel.abertoAgora === true ? "Aberto agora" : sel.abertoAgora === false ? "Fechado agora" : ""].filter(Boolean).join(" · ")}</p>
              {sel.descricao ? <p>{sel.descricao}</p> : null}
              <p className="guia-rota"><Navigation size={16} aria-hidden /> {rotaSel ? `${textoDistancia(rotaSel.distanciaM / 1000)} · ${textoDuracao(rotaSel.duracaoS)} de carro` : rota?.status === "erro" ? rota.erro : idRota ? "Calculando o trajeto…" : `${textoDistancia(sel.distanciaKm)} em linha reta`}</p>
              <p className="guia-sub">📍 {sel.endereco}</p>
              {sel.horarios.length ? <p className="guia-sub" style={{ whiteSpace: "pre-line" }}>🕑 {sel.horarios.slice(0, 7).join("\n")}</p> : null}
              <div className="guia-botoes">
                {(() => { const k = linksLugar(sel); return (<>
                  {k.telefone ? <a className="guia-bt" style={{ background: "#16A34A" }} href={k.telefone}><Phone size={15} aria-hidden /> Ligar</a> : null}
                  {k.whatsapp ? <a className="guia-bt" style={{ background: "#25D366" }} href={k.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a> : null}
                  <a className="guia-bt" style={{ background: "#2563EB" }} href={k.googleMaps} target="_blank" rel="noreferrer">Google Maps</a>
                  <a className="guia-bt" style={{ background: "#06B6D4" }} href={k.waze} target="_blank" rel="noreferrer">Waze</a>
                  {k.site ? <a className="guia-bt" style={{ background: "#6B7280" }} href={k.site} target="_blank" rel="noreferrer"><Globe size={15} aria-hidden /> Site</a> : null}
                </>); })()}
              </div>
            </div>
          ) : null}

          {lugares.map((l) => (
            <button key={l.id} type="button" className={`guia-item${l.parceiro ? " parceiro" : ""}${sel?.id === l.id ? " ativo" : ""}`} onClick={() => selecionar(l)}>
              <span className="guia-pino" style={{ background: corDe(l), outline: l.parceiro ? `3px solid ${COR_PARCEIRO}` : "none" }}>{l.parceiro ? "★" : ""}</span>
              <span className="guia-item-txt">
                {l.parceiro ? <small className="guia-tag">★ PARCEIRO PETGO</small> : null}
                <strong>{l.nome}</strong>
                <small>{[l.tipo, l.nota ? `★ ${l.nota.toFixed(1).replace(".", ",")}` : "", l.abertoAgora === true ? "Aberto" : l.abertoAgora === false ? "Fechado" : ""].filter(Boolean).join(" · ")}</small>
                <small>{l.endereco}</small>
              </span>
              <span className="guia-dist" style={{ color: corDe(l) }}>{textoDistancia(l.distanciaKm)}</span>
            </button>
          ))}
          {lugares.length ? <p className="guia-sub" style={{ textAlign: "center" }}>Dados de lugares: Google</p> : null}
        </div>
      </div>
    </div>
  );
}
