"use client";

// DISQUE DENÚNCIA PET no site (12/11/2026) — denúncia ANÔNIMA de maus-tratos a animais, serviço de utilidade pública.
// Grava em `denuncias_pet` SEM nenhum dado de quem denuncia (só o protocolo volta). Estado e município são obrigatórios: é por
// eles que a central encaminha ao órgão competente. Quem pode usar é decisão da plataforma (painel: livre ou só assinantes) —
// "só assinantes" esconde o formulário e indica o app. Regras em lib/compartilhado/denunciaPet.ts (cópia do painel).
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ConversaDenunciante from "@/components/site/ConversaDenunciante";
import { Camera, MapPin, Search, ShieldAlert, X } from "lucide-react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { BASE_SITE, filtrarOnce, gravarComId } from "@/lib/firebase/gen";
import {
  COLECOES_DENUNCIA, ESPECIES_DENUNCIA, FREQUENCIAS_DENUNCIA, GRUPO_PARAMETROS_DENUNCIA, LOCAIS_DENUNCIA, NOME_SERVICO, TIPOS_MAUS_TRATOS, UFS,
  ROTULOS_TIPO_PUC, acessoDenuncia, chaveMunicipio, lerProtocolo, nomePuc, planejarDenunciaPet, pucsDaRegiao, situacaoParaCidadao, tipoPuc, type AcessoDenuncia,
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
          <li>Se quiser, você <b>escolhe para quem enviar</b>: órgãos competentes e ONGs ou protetores da sua região. Senão, a central decide.</li>
          <li>Quem recebe trata na própria central e pode encaminhar a outros órgãos (delegacia, polícia ambiental, Ministério Público, secretaria de meio ambiente…).</li>
          <li>Você acompanha e <b>conversa</b> com a central pelo <b>protocolo</b>, sem se identificar.</li>
        </ol>
        <p className="texto-mut" style={{ fontSize: 13 }}>Em flagrante com risco de morte, ligue também para <b>190</b>.</p>
        {wa ? <a className="btn btn-outline" href={wa} target="_blank" rel="noreferrer">Denunciar pelo WhatsApp</a> : null}
        <Acompanhar />
        <p className="texto-mut" style={{ fontSize: 13, marginTop: 14 }}>É ONG ou protetor(a)? <Link href="/denuncia/ponto"><b>Cadastre-se para receber denúncias</b></Link> · <Link href="/denuncia/central">Central dos pontos</Link></p>
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
  // DESTINOS (dono, 18/11/2026): órgãos e ONGs/protetores da região — opcional, vários; nenhum = a central decide
  const [pucs, setPucs] = useState<any[]>([]);
  const [destinos, setDestinos] = useState<string[]>([]);
  useEffect(() => { if (!d.uf) { setPucs([]); return; } filtrarOnce(COLECOES_DENUNCIA.orgaos, "uf", d.uf).then(setPucs).catch(() => setPucs([])); }, [d.uf]);
  const regiao = useMemo(() => (d.uf && d.municipio.trim().length >= 2 ? pucsDaRegiao(pucs, d.uf, d.municipio) : { orgaos: [], ongs: [] }), [pucs, d.uf, d.municipio]);
  useEffect(() => { const ok = new Set([...regiao.orgaos, ...regiao.ongs].map((x) => String(x.id))); setDestinos((l) => l.filter((x) => ok.has(x))); }, [regiao]);
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
      const den = planejarDenunciaPet({ ...d, fotos, latitude: coord?.latitude ?? null, longitude: coord?.longitude ?? null, canal: "site", bytes, destinos });
      await gravarComId(COLECOES_DENUNCIA.denuncias, `site_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, { ...den, chave_origem: chaveNavegador() });
      guardarProtocolo(den.protocolo);
      setProtocolo(den.protocolo);
    } catch (e: any) { setErro(e?.message || "Não foi possível enviar. Tente de novo."); } finally { setSalvando(false); }
  };

  if (protocolo) return (
    <div className="ok-box">
      <b>Denúncia registrada! Protocolo {protocolo}.</b><br />
      Guarde o protocolo para acompanhar e conversar com a central (ele fica salvo neste navegador). {destinos.length ? `Enviada para: ${[...regiao.orgaos, ...regiao.ongs].filter((x) => destinos.includes(String(x.id))).map(nomePuc).join(", ")}.` : `A central encaminha ao órgão competente de ${d.municipio}/${d.uf.toUpperCase()}.`} Sua identidade não foi registrada. Obrigado por proteger os animais! 🐾
      <div className="acoes-form"><button type="button" className="btn btn-primary" onClick={() => { setD(vazio); setFotos([]); setCoord(null); setProtocolo(""); setDestinos([]); }}>Fazer outra denúncia</button></div>
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
      {d.uf && d.municipio.trim().length >= 2 ? (
        <div className="dp-destinos" style={{ margin: "14px 0", padding: 14, border: "1px solid #6B46C133", borderRadius: 14 }}>
          <b>Para quem enviar? <span className="texto-mut" style={{ fontWeight: 400 }}>(opcional — pode marcar vários)</span></b>
          {!regiao.orgaos.length && !regiao.ongs.length ? <p className="texto-mut" style={{ fontSize: 13, margin: "6px 0 0" }}>Nenhum ponto cadastrado em {d.municipio}/{d.uf}: a central do PetGo360 encaminha ao órgão competente.</p> : null}
          {([["Órgãos competentes", regiao.orgaos], ["ONGs e protetores", regiao.ongs]] as const).map(([t, l]) => l.length ? (
            <div key={t} style={{ marginTop: 10 }}>
              <div className="texto-mut" style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".04em" }}>{t.toUpperCase()}</div>
              {l.map((p: any) => (
                <label key={p.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={destinos.includes(String(p.id))} onChange={(e) => setDestinos((x) => (e.target.checked ? [...x, String(p.id)] : x.filter((i) => i !== String(p.id))))} style={{ marginTop: 4 }} />
                  <span><b>{nomePuc(p)}</b> <span className="texto-mut" style={{ fontSize: 12.5 }}>· {ROTULOS_TIPO_PUC[tipoPuc(p)]} · {p.municipio || "todo o estado"}</span>{p.descricao ? <div className="texto-mut" style={{ fontSize: 12.5 }}>{p.descricao}</div> : null}</span>
                </label>
              ))}
            </div>
          ) : null)}
          <p className="texto-mut" style={{ fontSize: 12.5, margin: "8px 0 0" }}>{destinos.length ? `${destinos.length} escolhido(s).` : "Nenhum marcado: a central do PetGo360 decide para quem encaminhar."}</p>
        </div>
      ) : null}
      <p className="texto-mut" style={{ fontSize: 12.5 }}>🔒 Anônimo: não pedimos nem guardamos o seu nome, e-mail ou telefone. {AVISO_ANTITROTE}</p>
      {erro ? <p className="erro">{erro}</p> : null}
      <div className="acoes-form"><button type="button" className="btn btn-primary" onClick={enviar} disabled={salvando || enviandoFoto}>{salvando ? "Enviando…" : "Enviar denúncia"}</button></div>
    </div>
  );
}

// protocolos deste navegador (para voltar à conversa sem digitar)
const CHAVE_PROTOCOLOS = "petgo_denuncias_protocolos";
const lerProtocolos = (): string[] => { try { return JSON.parse(localStorage.getItem(CHAVE_PROTOCOLOS) || "[]"); } catch { return []; } };
function guardarProtocolo(p: string) { try { localStorage.setItem(CHAVE_PROTOCOLOS, JSON.stringify([p, ...lerProtocolos().filter((x) => x !== p)].slice(0, 20))); } catch { /* sem storage */ } }

function Acompanhar() {
  const [texto, setTexto] = useState("");
  const [res, setRes] = useState("");
  const [den, setDen] = useState<any | null>(null);
  const [meus, setMeus] = useState<string[]>([]);
  useEffect(() => setMeus(lerProtocolos()), []);
  const consultar = async (valor = texto) => {
    const p = lerProtocolo(valor);
    setDen(null);
    if (!p) { setRes("Digite o protocolo (ex.: DP2026-ABC123)."); return; }
    try {
      const [d] = await filtrarOnce(COLECOES_DENUNCIA.denuncias, "protocolo", p);
      setRes(d ? `${p}: ${situacaoParaCidadao(d)}` : "Protocolo não encontrado.");
      if (d) { setDen(d); guardarProtocolo(p); setMeus(lerProtocolos()); }
    } catch { setRes("Não foi possível consultar agora."); }
  };
  return (
    <div className="dp-acompanhar">
      <h3><Search size={18} /> Acompanhar</h3>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="DP2026-ABC123" aria-label="Protocolo" style={{ flex: 1 }} />
        <button type="button" className="btn btn-primary" onClick={() => consultar()}>Consultar</button>
      </div>
      {meus.length && !den ? <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>{meus.slice(0, 5).map((p) => <button key={p} type="button" className="btn btn-outline" style={{ padding: "4px 10px", fontSize: 12.5 }} onClick={() => { setTexto(p); void consultar(p); }}>{p}</button>)}</div> : null}
      {res ? <p className="texto-mut" style={{ marginTop: 8 }}>{res}</p> : null}
      {den ? <ConversaDenunciante denuncia={den} /> : null}
    </div>
  );
}
