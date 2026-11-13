"use client";

// DISQUE DENÚNCIA PET no site (12/11/2026) — denúncia ANÔNIMA de maus-tratos a animais, serviço de utilidade pública.
// Grava em `denuncias_pet` SEM nenhum dado de quem denuncia (só o protocolo volta). Estado e município são obrigatórios: é por
// eles que a central encaminha ao órgão competente. Quem pode usar é decisão da plataforma (painel: livre ou só assinantes) —
// "só assinantes" esconde o formulário e indica o app. Regras em lib/compartilhado/denunciaPet.ts (cópia do painel).
import { useEffect, useState } from "react";
import { Camera, MapPin, Search, ShieldAlert, X } from "lucide-react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { BASE_SITE, filtrarOnce, gravarComId } from "@/lib/firebase/gen";
import {
  COLECOES_DENUNCIA, ESPECIES_DENUNCIA, FREQUENCIAS_DENUNCIA, GRUPO_PARAMETROS_DENUNCIA, LOCAIS_DENUNCIA, NOME_SERVICO, TIPOS_MAUS_TRATOS, UFS,
  acessoDenuncia, lerProtocolo, planejarDenunciaPet, situacaoParaCidadao, type AcessoDenuncia,
} from "@/lib/compartilhado/denunciaPet";
import { AVISO_ANTITROTE } from "@/lib/compartilhado/analiseDenuncias";

// ANTI-TROTE: chave ALEATÓRIA deste navegador (não identifica a pessoa). O back-end a troca pelo identificador cifrado (HMAC no
// servidor, não reversível) e apaga a chave.
function chaveNavegador(): string {
  try {
    const k = "petgo_denuncia_origem";
    let v = localStorage.getItem(k);
    if (!v) { v = Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join(""); localStorage.setItem(k, v); }
    return v;
  } catch { return ""; }
}

export default function DenunciaPet({ whatsapp }: { whatsapp?: string }) {
  const [acesso, setAcesso] = useState<AcessoDenuncia | null>(null);
  useEffect(() => { filtrarOnce("configuracoes", "grupo", GRUPO_PARAMETROS_DENUNCIA).then((c) => setAcesso(acessoDenuncia(c))).catch(() => setAcesso("todos")); }, []);
  const wa = whatsapp ? `https://wa.me/55${whatsapp.replace(/\D/g, "").replace(/^55/, "")}` : "";
  return (
    <div className="dp-grade">
      <div>
        {acesso === null ? <p className="texto-mut">Carregando…</p> : acesso === "assinantes" ? (
          <div className="ok-box">O {NOME_SERVICO} está disponível para assinantes do PetGo360. Baixe o app, crie sua conta e assine (com dias grátis) para denunciar pelo app ou pelo WhatsApp.</div>
        ) : <Formulario />}
      </div>
      <aside className="dp-lado">
        <h3><ShieldAlert size={18} /> Como funciona</h3>
        <ol>
          <li>Você conta o que viu, onde (estado e município) e, se puder, manda fotos.</li>
          <li>A denúncia chega à nossa <b>central</b> — sem o seu nome, e-mail ou telefone.</li>
          <li>A central encaminha por e-mail, com um documento completo, ao <b>órgão competente</b> do município (delegacia, polícia ambiental, Ministério Público, secretaria de meio ambiente…).</li>
          <li>Você acompanha pelo <b>protocolo</b>.</li>
        </ol>
        <p className="texto-mut" style={{ fontSize: 13 }}>Em flagrante com risco de morte, ligue também para <b>190</b>.</p>
        {wa ? <a className="btn btn-outline" href={wa} target="_blank" rel="noreferrer">Denunciar pelo WhatsApp</a> : null}
        <Acompanhar />
      </aside>
    </div>
  );
}

function Formulario() {
  const vazio = { tipo: "", especie: "cao", especie_outra: "", uf: "", municipio: "", bairro: "", endereco: "", referencia: "", local: "privado", frequencia: "frequente", responsavel: "", descricao: "" };
  const [d, setD] = useState(vazio);
  const [fotos, setFotos] = useState<string[]>([]);
  const [coord, setCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [erro, setErro] = useState("");
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [protocolo, setProtocolo] = useState("");
  const campo = (k: keyof typeof vazio) => ({ value: d[k], onChange: (e: any) => setD({ ...d, [k]: e.target.value }) });

  const subir = async (f: File | undefined) => {
    if (!f) return;
    setErro("");
    if (f.size > 10 * 1024 * 1024) { setErro("Foto muito grande (máximo 10 MB)."); return; }
    setEnviandoFoto(true);
    try {
      const destino = ref(storage, `uploads/petgo/${BASE_SITE.split("/").pop()}/denuncias/site-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${(f.name.split(".").pop() || "jpg").toLowerCase()}`);
      const snap = await uploadBytes(destino, f, { contentType: f.type || "image/jpeg" });
      const url = await getDownloadURL(snap.ref);
      setFotos((x) => (x.length >= 4 ? x : [...x, url]));
    } catch { setErro("Não foi possível enviar a foto. Tente de novo."); } finally { setEnviandoFoto(false); }
  };
  const usarLocal = () => {
    if (!navigator.geolocation) { setErro("Seu navegador não informa a localização — escreva o endereço."); return; }
    navigator.geolocation.getCurrentPosition((p) => setCoord({ latitude: p.coords.latitude, longitude: p.coords.longitude }), () => setErro("Não foi possível pegar a localização — escreva o endereço."), { enableHighAccuracy: true, timeout: 10000 });
  };
  const enviar = async () => {
    setErro(""); setSalvando(true);
    try {
      const bytes = crypto.getRandomValues(new Uint8Array(8));
      const den = planejarDenunciaPet({ ...d, fotos, latitude: coord?.latitude ?? null, longitude: coord?.longitude ?? null, canal: "site", bytes });
      await gravarComId(COLECOES_DENUNCIA.denuncias, `site_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, { ...den, chave_origem: chaveNavegador() });
      setProtocolo(den.protocolo);
    } catch (e: any) { setErro(e?.message || "Não foi possível enviar. Tente de novo."); } finally { setSalvando(false); }
  };

  if (protocolo) return (
    <div className="ok-box">
      <b>Denúncia registrada! Protocolo {protocolo}.</b><br />
      Guarde o protocolo para acompanhar. A central encaminha ao órgão competente de {d.municipio}/{d.uf.toUpperCase()}. Sua identidade não foi registrada. Obrigado por proteger os animais! 🐾
      <div className="acoes-form"><button type="button" className="btn btn-primary" onClick={() => { setD(vazio); setFotos([]); setCoord(null); setProtocolo(""); }}>Fazer outra denúncia</button></div>
    </div>
  );
  return (
    <div className="dp-form">
      <div className="grade-form">
        <label className="campo largo">Tipo de maus-tratos *<select {...campo("tipo")}><option value="">Escolha…</option>{TIPOS_MAUS_TRATOS.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}</select></label>
        <label className="campo">Animal<select {...campo("especie")}>{ESPECIES_DENUNCIA.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}</select></label>
        {d.especie === "outro" ? <label className="campo">Qual animal?<input {...campo("especie_outra")} placeholder="Ex.: coelho" /></label> : null}
        <label className="campo">Quando<select {...campo("frequencia")}>{FREQUENCIAS_DENUNCIA.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}</select></label>
        <label className="campo">Estado *<select {...campo("uf")}><option value="">UF…</option>{UFS.map(([s, n]) => <option key={s} value={s}>{s} — {n}</option>)}</select></label>
        <label className="campo">Município *<input {...campo("municipio")} placeholder="Ex.: Manaus" /></label>
        <label className="campo">Bairro<input {...campo("bairro")} /></label>
        <label className="campo">Local<select {...campo("local")}>{LOCAIS_DENUNCIA.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}</select></label>
        <label className="campo largo">Endereço *<input {...campo("endereco")} placeholder="Rua, número" /></label>
        <label className="campo largo">Ponto de referência<input {...campo("referencia")} /></label>
        <div className="campo largo"><button type="button" className="btn btn-outline" onClick={usarLocal}><MapPin size={16} /> {coord ? "Localização marcada ✓" : "Usar minha localização"}</button></div>
        <label className="campo largo">O que está acontecendo? *<textarea rows={4} {...campo("descricao")} placeholder="Como o animal está, o que você viu, desde quando…" /></label>
        <label className="campo largo">Responsável (se souber)<input {...campo("responsavel")} placeholder="Nome, aparência, onde mora" /></label>
      </div>
      <div className="pp-fotos">
        {fotos.map((f) => <span key={f} className="pp-mini">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={f} alt="" /><button type="button" onClick={() => setFotos(fotos.filter((x) => x !== f))} aria-label="Remover foto"><X size={12} /></button></span>)}
        {fotos.length < 4 ? <label className="pp-mini add"><Camera size={20} /><small>{enviandoFoto ? "Enviando…" : "Foto"}</small><input type="file" accept="image/*" hidden onChange={(e) => subir(e.target.files?.[0])} /></label> : null}
      </div>
      <p className="texto-mut" style={{ fontSize: 12.5 }}>🔒 Anônimo: não pedimos nem guardamos o seu nome, e-mail ou telefone. {AVISO_ANTITROTE}</p>
      {erro ? <p className="erro">{erro}</p> : null}
      <div className="acoes-form"><button type="button" className="btn btn-primary" onClick={enviar} disabled={salvando || enviandoFoto}>{salvando ? "Enviando…" : "Enviar denúncia"}</button></div>
    </div>
  );
}

function Acompanhar() {
  const [texto, setTexto] = useState("");
  const [res, setRes] = useState("");
  const consultar = async () => {
    const p = lerProtocolo(texto);
    if (!p) { setRes("Digite o protocolo (ex.: DP2026-ABC123)."); return; }
    try {
      const [d] = await filtrarOnce(COLECOES_DENUNCIA.denuncias, "protocolo", p);
      setRes(d ? `${p}: ${situacaoParaCidadao(d)}` : "Protocolo não encontrado.");
    } catch { setRes("Não foi possível consultar agora."); }
  };
  return (
    <div className="dp-acompanhar">
      <h3><Search size={18} /> Acompanhar</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="DP2026-ABC123" aria-label="Protocolo" style={{ flex: 1 }} />
        <button type="button" className="btn btn-primary" onClick={consultar}>Consultar</button>
      </div>
      {res ? <p className="texto-mut" style={{ marginTop: 8 }}>{res}</p> : null}
    </div>
  );
}
