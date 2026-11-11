"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, Eye, HeartHandshake, MapPin, PawPrint, Search, X } from "lucide-react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { BASE_SITE, getAll, gravarComId } from "@/lib/firebase/gen";
import { COLECAO_CONTATOS, COLECAO_OCORRENCIAS, ocorrenciaPublica, planejarOcorrencia, protocoloOcorrencia } from "@/lib/compartilhado/achados";

// PETS PERDIDOS E ENCONTRADOS (serviço GRATUITO do PetGo360 — regras em lib/compartilhado/achados.ts, cópia do painel).
// Lista em tempo real os registros abertos (como os "procurados"); "Vi este pet" e "Registrar" gravam a ocorrência
// (canal "site") e o back-end petall360 faz o reconhecimento da foto e avisa o tutor/quem encontrou pelo WhatsApp.
// O telefone de quem registrou NUNCA aparece aqui (fica em pets_ocorrencias_contatos).
const ESPECIES: Record<string, string> = { cao: "Cão", gato: "Gato", ave: "Ave", outro: "Outro" };
const ha = (v: any) => { const d = Math.floor((Date.now() - Number(v || 0)) / 86400000); return d <= 0 ? "hoje" : d === 1 ? "ontem" : `há ${d} dias`; };

export default function PetsPerdidos() {
  const [todas, setTodas] = useState<any[] | null>(null);
  const [aba, setAba] = useState<"perdido" | "encontrado">("perdido");
  const [busca, setBusca] = useState("");
  const [vendo, setVendo] = useState<any | null>(null);
  const [form, setForm] = useState<{ tipo: "perdido" | "encontrado"; alvo?: any } | null>(null);

  useEffect(() => {
    if (!BASE_SITE) { setTodas([]); return; }
    try { return getAll(COLECAO_OCORRENCIAS, (d) => setTodas(d.map(ocorrenciaPublica))); } catch { setTodas([]); }
  }, []);
  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return (todas ?? [])
      .filter((o) => o.tipo === aba && (o.status === "aberta" || o.status === "processando"))
      .filter((o) => !t || [o.nome_pet, o.endereco, o.cor, o.descricao, ESPECIES[o.especie]].some((x) => String(x ?? "").toLowerCase().includes(t)))
      .sort((a, b) => Number(b.criado_em || 0) - Number(a.criado_em || 0));
  }, [todas, aba, busca]);
  const reencontrados = (todas ?? []).filter((o) => o.status === "reencontrado").length;

  return (
    <>
      <div className="pp-acoes">
        <button type="button" className="pp-acao perdi" onClick={() => setForm({ tipo: "perdido" })}><PawPrint size={26} /><b>Perdi meu pet</b><span>Registre com foto e onde ele foi visto</span></button>
        <button type="button" className="pp-acao achei" onClick={() => setForm({ tipo: "encontrado" })}><HeartHandshake size={26} /><b>Encontrei um pet</b><span>Mande a foto: avisamos o tutor</span></button>
        <div className="pp-acao info"><Search size={26} /><b>{reencontrados} reencontro{reencontrados === 1 ? "" : "s"}</b><span>com a ajuda do reconhecimento pela foto</span></div>
      </div>

      <div className="pp-barra">
        <div className="pp-abas" role="tablist">
          <button type="button" role="tab" aria-selected={aba === "perdido"} className={aba === "perdido" ? "ativa" : ""} onClick={() => setAba("perdido")}>Perdidos</button>
          <button type="button" role="tab" aria-selected={aba === "encontrado"} className={aba === "encontrado" ? "ativa" : ""} onClick={() => setAba("encontrado")}>Encontrados</button>
        </div>
        <input className="pp-busca" placeholder="Buscar por nome, bairro, cor…" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar" />
      </div>

      {todas === null ? <p className="texto-mut">Carregando…</p> : !lista.length ? (
        <div className="notice">{aba === "perdido" ? "Nenhum pet perdido registrado agora." : "Nenhum pet encontrado aguardando o tutor agora."}</div>
      ) : (
        <div className="pp-grade">
          {lista.map((o) => (
            <article className="pp-cartao" key={o.id}>
              <button type="button" className="pp-foto" onClick={() => setVendo(o)} aria-label={`Ver ${o.nome_pet || "o pet"}`}>
                {o.fotos?.[0] ? <img src={o.fotos[0]} alt={o.nome_pet || "Pet"} /> : <PawPrint size={48} />}
                <span className={`pp-tag ${o.tipo}`}>{o.tipo === "perdido" ? "PERDIDO" : "ENCONTRADO"}</span>
              </button>
              <div className="pp-info">
                <strong>{o.nome_pet || ESPECIES[o.especie] || "Pet"}</strong>
                <p><MapPin size={13} /> {o.endereco?.split(",").slice(0, 2).join(",") || "Local não informado"}</p>
                <p>{[ESPECIES[o.especie], o.cor].filter(Boolean).join(" · ")} · {ha(o.visto_em)}</p>
                {o.tipo === "perdido"
                  ? <button type="button" className="btn btn-primary" onClick={() => setForm({ tipo: "encontrado", alvo: o })}><Eye size={16} /> Vi este pet</button>
                  : <button type="button" className="btn btn-outline" onClick={() => setForm({ tipo: "perdido", alvo: null })}><PawPrint size={16} /> É o meu pet</button>}
              </div>
            </article>
          ))}
        </div>
      )}

      {vendo ? (
        <div className="modal-fundo" onClick={() => setVendo(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="fechar" onClick={() => setVendo(null)} aria-label="Fechar"><X size={18} /></button>
            {vendo.fotos?.[0] ? <img src={vendo.fotos[0]} alt={vendo.nome_pet || "Pet"} style={{ maxHeight: 340 }} /> : null}
            <div className="corpo-m">
              <span className={`pp-tag ${vendo.tipo} estatica`}>{vendo.tipo === "perdido" ? "PERDIDO" : "ENCONTRADO"}</span>
              <h2>{vendo.nome_pet || ESPECIES[vendo.especie] || "Pet"}</h2>
              <p className="texto-mut">{[ESPECIES[vendo.especie], vendo.cor, vendo.porte].filter(Boolean).join(" · ")}</p>
              <p><MapPin size={14} /> {vendo.endereco || "Local não informado"} · visto {ha(vendo.visto_em)}</p>
              {vendo.descricao ? <p>{vendo.descricao}</p> : null}
              <p className="texto-mut" style={{ fontSize: 13 }}>Registrado por {vendo.contato_primeiro_nome || "um tutor"} · {protocoloOcorrencia(vendo.id, Number(vendo.criado_em) || Date.now())}</p>
              {vendo.tipo === "perdido" ? <button type="button" className="btn btn-primary" onClick={() => { const alvo = vendo; setVendo(null); setForm({ tipo: "encontrado", alvo }); }}><Eye size={16} /> Vi este pet</button> : null}
            </div>
          </div>
        </div>
      ) : null}
      {form ? <Formulario tipo={form.tipo} alvo={form.alvo} onFechar={() => setForm(null)} /> : null}
    </>
  );
}

function Formulario({ tipo, alvo, onFechar }: { tipo: "perdido" | "encontrado"; alvo?: any; onFechar: () => void }) {
  const [fotos, setFotos] = useState<string[]>([]);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [d, setD] = useState({ especie: alvo?.especie ?? "cao", nome_pet: "", cor: "", endereco: "", descricao: "", contato_nome: "", contato_telefone: "" });
  const [local, setLocal] = useState<{ latitude: number; longitude: number } | null>(null);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [salvando, setSalvando] = useState(false);
  const campo = (k: keyof typeof d) => ({ value: d[k], onChange: (e: any) => setD({ ...d, [k]: e.target.value }) });

  const subir = async (f: File | undefined) => {
    if (!f) return;
    setErro("");
    if (f.size > 10 * 1024 * 1024) { setErro("Foto muito grande (máximo 10 MB)."); return; }
    setEnviandoFoto(true);
    try {
      const destino = ref(storage, `uploads/petgo/${BASE_SITE.split("/").pop()}/achados/site-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${(f.name.split(".").pop() || "jpg").toLowerCase()}`);
      const snap = await uploadBytes(destino, f, { contentType: f.type || "image/jpeg" });
      const url = await getDownloadURL(snap.ref);
      setFotos((x) => (x.length >= 4 ? x : [...x, url]));
    } catch { setErro("Não foi possível enviar a foto. Tente de novo."); } finally { setEnviandoFoto(false); }
  };
  const usarLocal = () => {
    if (!navigator.geolocation) { setErro("Seu navegador não informa a localização — escreva o endereço."); return; }
    navigator.geolocation.getCurrentPosition((p) => setLocal({ latitude: p.coords.latitude, longitude: p.coords.longitude }), () => setErro("Não foi possível pegar a localização — escreva o endereço."), { enableHighAccuracy: true, timeout: 10000 });
  };
  const salvar = async () => {
    setErro(""); setSalvando(true);
    try {
      const { ocorrencia, contato } = planejarOcorrencia({ tipo, ...d, fotos, latitude: local?.latitude ?? null, longitude: local?.longitude ?? null, visto_em: Date.now(), canal: "site", id_alvo: alvo?.id ?? null });
      const id = `site_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await gravarComId(COLECAO_CONTATOS, id, contato);
      await gravarComId(COLECAO_OCORRENCIAS, id, { ...ocorrencia, id });
      setOk(alvo
        ? `Obrigado! Avisamos o tutor de ${alvo.nome_pet || "o pet"} com o seu contato. Protocolo ${protocoloOcorrencia(id)}.`
        : tipo === "perdido"
          ? `Registrado (protocolo ${protocoloOcorrencia(id)}). Estamos comparando a foto e avisamos você pelo WhatsApp se aparecer um pet parecido.`
          : `Obrigado por ajudar! (protocolo ${protocoloOcorrencia(id)}). Se a foto for parecida com um pet procurado, o tutor recebe o seu contato.`);
    } catch (e: any) { setErro(e?.message ?? "Não foi possível registrar."); } finally { setSalvando(false); }
  };

  return (
    <div className="modal-fundo" onClick={onFechar}>
      <div className="modal modal-form" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="fechar" onClick={onFechar} aria-label="Fechar"><X size={18} /></button>
        <span className="eyebrow">Grátis</span>
        <h2>{alvo ? `Vi ${alvo.nome_pet || "este pet"}` : tipo === "perdido" ? "Perdi meu pet" : "Encontrei um pet"}</h2>
        {ok ? (<><div className="ok-box">{ok}</div><div className="acoes-form"><button type="button" className="btn btn-primary" onClick={onFechar}>Fechar</button></div></>) : (
          <>
            <p className="texto-mut" style={{ marginTop: 0 }}>{alvo ? "O tutor recebe o seu contato e onde você viu o pet. Uma foto ajuda a confirmar." : "Com a foto, o reconhecimento compara com os pets registrados e avisa as duas pessoas."}</p>
            <div className="pp-fotos">
              {fotos.map((f) => <span key={f} className="pp-mini"><img src={f} alt="" /><button type="button" onClick={() => setFotos(fotos.filter((x) => x !== f))} aria-label="Remover foto"><X size={12} /></button></span>)}
              {fotos.length < 4 ? <label className="pp-mini add"><Camera size={20} /><small>{enviandoFoto ? "Enviando…" : "Foto"}</small><input type="file" accept="image/*" capture="environment" hidden onChange={(e) => subir(e.target.files?.[0])} /></label> : null}
            </div>
            <div className="grade-form">
              <label className="campo">Espécie<select {...campo("especie")}>{Object.entries(ESPECIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
              {tipo === "perdido" ? <label className="campo">Nome do pet *<input {...campo("nome_pet")} /></label> : <label className="campo">Cor / sinais<input {...campo("cor")} /></label>}
              {tipo === "perdido" ? <label className="campo largo">Cor / sinais (coleira, manchas)<input {...campo("cor")} /></label> : null}
              <label className="campo largo">{tipo === "perdido" ? "Onde foi visto pela última vez" : "Onde você viu/encontrou"}<input {...campo("endereco")} placeholder="Rua, bairro, cidade" /></label>
              <div className="campo largo"><button type="button" className="btn btn-outline" onClick={usarLocal}><MapPin size={16} /> {local ? "Localização marcada ✓" : "Usar minha localização"}</button></div>
              <label className="campo largo">Detalhes<textarea rows={3} {...campo("descricao")} /></label>
              <label className="campo">Seu nome *<input {...campo("contato_nome")} /></label>
              <label className="campo">Seu WhatsApp (com DDD) *<input {...campo("contato_telefone")} inputMode="tel" placeholder="(92) 99999-9999" /></label>
            </div>
            <p className="texto-mut" style={{ fontSize: 12.5 }}>Seu telefone não aparece no site: só é enviado ao tutor/quem encontrou quando houver correspondência.</p>
            {erro ? <p className="erro">{erro}</p> : null}
            <div className="acoes-form"><button type="button" className="btn btn-outline" onClick={onFechar}>Cancelar</button><button type="button" className="btn btn-primary" onClick={salvar} disabled={salvando || enviandoFoto}>{salvando ? "Enviando…" : "Registrar"}</button></div>
          </>
        )}
      </div>
    </div>
  );
}
