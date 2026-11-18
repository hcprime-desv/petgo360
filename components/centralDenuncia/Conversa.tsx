"use client";
// GERADO por "npm run sync:app" no painel PetGo360 a partir de shared/centralDenuncia/Conversa.tsx — NÃO EDITAR AQUI.
// CONVERSA PELO PROTOCOLO (dono, 18/11/2026): a central/PUC fala com o denunciante SEM saber quem é. Tudo o que o chat dos
// sites tem: texto, foto, vídeo, ÁUDIO gravado na hora, documento e LOCALIZAÇÃO (a minha, a da denúncia ou um link do mapa).
// O denunciante vê e responde no app (Acompanhar), no site (/denuncia → Acompanhar) e no WhatsApp (consulta pelo protocolo).
import React, { useEffect, useRef, useState } from "react";
import type { FonteCentral } from "./fonte";
import { COLECOES_DENUNCIA, planejarMensagemDenuncia, tipoPorMime, type MensagemDenuncia } from "@/lib/compartilhado/denunciaPet";

const RAPIDAS = ["Pode enviar mais fotos ou um vídeo?", "Qual o endereço exato ou um ponto de referência?", "O animal ainda está no local?", "Já encaminhamos ao órgão competente.", "Obrigado! Sua denúncia está sendo tratada."];
const hora = (ms: any) => (Number(ms) ? new Date(Number(ms)).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "");
/** "-3.1, -60.0" ou link do Google Maps → coordenadas */
function lerCoordenadas(t: string): { latitude: number; longitude: number } | null {
  const m = t.match(/(-?\d{1,2}\.\d+)\s*[, ]\s*(-?\d{1,3}\.\d+)/) || t.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || t.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  return m ? { latitude: Number(m[1]), longitude: Number(m[2]) } : null;
}

export function Conversa({ fonte, denuncia, aoResponder }: { fonte: FonteCentral; denuncia: any; aoResponder: () => Promise<void> | void }) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState("");
  const [erro, setErro] = useState("");
  const [menuLocal, setMenuLocal] = useState(false);
  const [gravando, setGravando] = useState<{ rec: MediaRecorder; inicio: number } | null>(null);
  const [, tique] = useState(0);
  const fim = useRef<HTMLDivElement>(null);
  const arquivo = useRef<HTMLInputElement>(null);

  useEffect(() => fonte.ouvir(COLECOES_DENUNCIA.mensagens, ["id_denuncias_pet", "==", String(denuncia.id)], (l) => setMsgs([...l].sort((a, b) => Number(a.criado_em) - Number(b.criado_em)))), [denuncia.id]); // eslint-disable-line
  useEffect(() => { fim.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);
  // o que o denunciante mandou fica "lido" pela central
  useEffect(() => { msgs.filter((m) => m.de === "denunciante" && !m.lida_central).forEach((m) => void fonte.atualizar(COLECOES_DENUNCIA.mensagens, String(m.id), { lida_central: true })); }, [msgs]); // eslint-disable-line
  useEffect(() => { if (!gravando) return; const t = setInterval(() => tique((n) => n + 1), 500); return () => clearInterval(t); }, [gravando]);

  const enviar = async (m: MensagemDenuncia) => {
    setErro("");
    try {
      const doc = planejarMensagemDenuncia({ denuncia, de: fonte.puc ? "puc" : "central", m, autor: fonte.usuario.nome, idPuc: fonte.puc ? String(fonte.puc.id) : null, pucNome: fonte.puc?.nome, canal: "central" });
      await fonte.adicionar(COLECOES_DENUNCIA.mensagens, doc);
      await fonte.atualizar(COLECOES_DENUNCIA.denuncias, String(denuncia.id), { ultima_mensagem_em: doc.criado_em, mensagens_nao_lidas_denunciante: (Number(denuncia.mensagens_nao_lidas_denunciante) || 0) + 1 });
      await aoResponder();
    } catch (e: any) { setErro(e?.message || String(e)); }
  };
  const enviarTexto = async () => { const t = texto.trim(); if (!t) return; setTexto(""); await enviar({ type: "text", body: t }); };
  const subirEEnviar = async (blob: Blob, nome: string, mime: string) => {
    setEnviando(nome);
    try { const url = await fonte.subir(blob, nome); await enviar({ type: tipoPorMime(mime), file: url, mime_type: mime, nome_file: nome, body: nome }); }
    catch (e: any) { setErro("Não foi possível enviar o arquivo: " + (e?.message || e)); }
    finally { setEnviando(""); }
  };
  const escolheu = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fs = Array.from(e.target.files ?? []); e.target.value = "";
    for (const f of fs) {
      if (f.size > 64 * 1024 * 1024) { setErro(`${f.name}: arquivo maior que 64 MB.`); continue; }
      await subirEEnviar(f, f.name, f.type || "application/octet-stream");
    }
  };
  // ÁUDIO: grava pelo microfone do navegador (webm/ogg) e envia ao soltar "Parar"
  const gravar = async () => {
    setErro("");
    if (gravando) { gravando.rec.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tipo = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm", "audio/mp4"].find((t) => (window as any).MediaRecorder?.isTypeSupported?.(t)) || "";
      const rec = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
      const partes: Blob[] = [];
      rec.ondataavailable = (ev) => ev.data.size && partes.push(ev.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop()); setGravando(null);
        const mime = (rec.mimeType || "audio/webm").split(";")[0];
        const blob = new Blob(partes, { type: mime });
        if (blob.size > 800) await subirEEnviar(blob, `audio-${Date.now()}.${mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "m4a" : "webm"}`, mime);
      };
      rec.start(); setGravando({ rec, inicio: Date.now() });
    } catch { setErro("Não foi possível usar o microfone (permita o acesso no navegador)."); }
  };
  const cancelarGravacao = () => { if (!gravando) return; gravando.rec.ondataavailable = null; gravando.rec.onstop = () => gravando.rec.stream.getTracks().forEach((t) => t.stop()); gravando.rec.stop(); setGravando(null); };
  // LOCALIZAÇÃO: a minha (GPS do navegador), a da denúncia ou colar um link/coordenadas do mapa
  const localMeu = () => {
    setMenuLocal(false);
    if (!navigator.geolocation) { setErro("Navegador sem localização."); return; }
    navigator.geolocation.getCurrentPosition((p) => void enviar({ type: "location", latitude: p.coords.latitude, longitude: p.coords.longitude, endereco: "Localização de quem atende" }),
      () => setErro("Não foi possível obter a localização (permita o acesso)."), { enableHighAccuracy: true, timeout: 15000 });
  };
  const localDenuncia = () => {
    setMenuLocal(false);
    if (denuncia.latitude == null) { setErro("A denúncia não tem coordenadas — cole um link do mapa."); return; }
    void enviar({ type: "location", latitude: Number(denuncia.latitude), longitude: Number(denuncia.longitude), endereco: denuncia.endereco || "Local da denúncia" });
  };
  const localColar = () => {
    setMenuLocal(false);
    const t = window.prompt("Cole o link do Google Maps ou as coordenadas (ex.: -3.1190, -60.0217):", ""); if (!t) return;
    const c = lerCoordenadas(t); if (!c) { setErro("Não reconheci as coordenadas nesse texto."); return; }
    const end = window.prompt("Descrição do local (opcional):", "") ?? "";
    void enviar({ type: "location", ...c, endereco: end });
  };

  const segundos = gravando ? Math.floor((Date.now() - gravando.inicio) / 1000) : 0;
  return (
    <div className="cdp-conversa">
      <div className="cdp-msgs">
        <div className="cdp-rot" style={{ marginBottom: 10 }}>CONVERSA COM O DENUNCIANTE <span style={{ fontWeight: 600 }}>· anônimo, pelo protocolo</span></div>
        {!msgs.length ? <p className="cdp-sub">Nenhuma mensagem ainda. O denunciante vê o que você escrever no app, no site e no WhatsApp (ao consultar o protocolo {denuncia.protocolo}).</p> : null}
        {msgs.map((m) => {
          const meu = m.de !== "denunciante";
          return (
            <div key={m.id} className={`cdp-bolha ${meu ? "eu" : ""}`}>
              <Conteudo m={m} />
              <div className="cdp-bolha-rodape">{meu ? `${m.autor || "Central"}${m.puc_nome ? ` · ${m.puc_nome}` : ""}` : `Denunciante${m.canal ? ` · ${m.canal === "whatsapp" ? "WhatsApp" : m.canal}` : ""}`} · {hora(m.criado_em)}{meu ? (m.lida_denunciante ? " ✓✓" : " ✓") : ""}</div>
            </div>
          );
        })}
        <div ref={fim} />
      </div>
      <div className="cdp-compor">
        <div className="cdp-chips" style={{ marginBottom: 8 }}>{RAPIDAS.map((r) => <button key={r} className="cdp-chip" onClick={() => setTexto(r)}>{r}</button>)}</div>
        {erro ? <div className="cdp-erro">{erro}</div> : null}
        {enviando ? <div className="cdp-sub" style={{ marginBottom: 6 }}>Enviando {enviando}…</div> : null}
        {gravando ? (
          <div className="cdp-linha cdp-gravando">
            <span><span className="cdp-rec" /> Gravando áudio… {Math.floor(segundos / 60)}:{String(segundos % 60).padStart(2, "0")}</span>
            <span style={{ display: "flex", gap: 8 }}><button className="cdp-btn" onClick={cancelarGravacao}>Cancelar</button><button className="cdp-btn cdp-btn-p" onClick={gravar}>■ Parar e enviar</button></span>
          </div>
        ) : (
          <div className="cdp-linha" style={{ gap: 8 }}>
            <input ref={arquivo} type="file" multiple hidden accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={escolheu} />
            <button className="cdp-icone" title="Foto, vídeo, áudio ou documento" onClick={() => arquivo.current?.click()}>📎</button>
            <div style={{ position: "relative" }}>
              <button className="cdp-icone" title="Localização" onClick={() => setMenuLocal((v) => !v)}>📍</button>
              {menuLocal ? (
                <div className="cdp-menu">
                  <button onClick={localMeu}>Minha localização atual</button>
                  <button onClick={localDenuncia}>Local da denúncia</button>
                  <button onClick={localColar}>Colar link ou coordenadas…</button>
                </div>
              ) : null}
            </div>
            <textarea className="cdp-input cdp-texto" rows={1} placeholder="Escreva para o denunciante…" title="Enter envia · Shift+Enter quebra a linha" value={texto}
              onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void enviarTexto(); } }} />
            {texto.trim() ? <button className="cdp-btn cdp-btn-p" onClick={enviarTexto}>Enviar</button>
              : <button className="cdp-icone cdp-mic" title="Gravar áudio" onClick={gravar}>🎤</button>}
          </div>
        )}
      </div>
    </div>
  );
}

/** Conteúdo de uma mensagem conforme o tipo (também usado em outras telas). */
export function Conteudo({ m }: { m: any }) {
  if (m.type === "image") return <a href={m.file} target="_blank" rel="noreferrer"><img src={m.file} alt="" className="cdp-midia" /></a>;
  if (m.type === "video") return <video src={m.file} controls className="cdp-midia" />;
  if (m.type === "audio") return <audio src={m.file} controls style={{ width: 260, maxWidth: "100%" }} />;
  if (m.type === "document") return <a href={m.file} target="_blank" rel="noreferrer" className="cdp-doc">📄 {m.nome_file || "Arquivo"}</a>;
  if (m.type === "location") return (
    <a href={`https://maps.google.com/?q=${m.latitude},${m.longitude}`} target="_blank" rel="noreferrer" className="cdp-doc">
      <iframe title="local" className="cdp-mapa" style={{ height: 130, width: 240, pointerEvents: "none" }} src={`https://maps.google.com/maps?q=${m.latitude},${m.longitude}&z=16&output=embed`} />
      <div>📍 {m.endereco || "Localização"}</div>
    </a>
  );
  return <span style={{ whiteSpace: "pre-wrap" }}>{m.body}</span>;
}
