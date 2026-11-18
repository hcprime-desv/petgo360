"use client";
// CONVERSA DO DENUNCIANTE PELO PROTOCOLO (dono, 18/11/2026) — no "Acompanhar" do site. Quem denunciou continua ANÔNIMO: fala com
// a central/ponto que recebeu a denúncia só pelo protocolo. Texto, foto, vídeo, áudio (gravado na hora), arquivo e localização.
import { useEffect, useRef, useState } from "react";
import { addDoc, collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import { BASE_SITE } from "@/lib/firebase/gen";
import { COLECOES_DENUNCIA, planejarMensagemDenuncia, tipoPorMime, type MensagemDenuncia } from "@/lib/compartilhado/denunciaPet";

const hora = (ms: any) => (Number(ms) ? new Date(Number(ms)).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "");
const ROXO = "#6B46C1";

export default function ConversaDenunciante({ denuncia }: { denuncia: any }) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState("");
  const [gravando, setGravando] = useState<MediaRecorder | null>(null);
  const arquivo = useRef<HTMLInputElement>(null);
  const fim = useRef<HTMLDivElement>(null);
  const col = (c: string) => collection(db, `${BASE_SITE}/${c}`);

  useEffect(() => onSnapshot(query(col(COLECOES_DENUNCIA.mensagens), where("id_denuncias_pet", "==", String(denuncia.id))),
    (s) => setMsgs(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => Number(a.criado_em) - Number(b.criado_em))), () => setMsgs([])), [denuncia.id]); // eslint-disable-line
  useEffect(() => { fim.current?.scrollIntoView({ block: "nearest" }); }, [msgs.length]);
  // o que a central mandou fica "lido pelo denunciante"
  useEffect(() => {
    const novas = msgs.filter((m) => m.de !== "denunciante" && !m.lida_denunciante);
    novas.forEach((m) => void updateDoc(doc(db, `${BASE_SITE}/${COLECOES_DENUNCIA.mensagens}/${m.id}`), { lida_denunciante: true }).catch(() => {}));
    if (novas.length) void updateDoc(doc(db, `${BASE_SITE}/${COLECOES_DENUNCIA.denuncias}/${denuncia.id}`), { mensagens_nao_lidas_denunciante: 0 }).catch(() => {});
  }, [msgs]); // eslint-disable-line

  const enviar = async (m: MensagemDenuncia) => {
    setErro("");
    try {
      const doc_ = planejarMensagemDenuncia({ denuncia, de: "denunciante", m, canal: "site" });
      await addDoc(col(COLECOES_DENUNCIA.mensagens), doc_);
      await updateDoc(doc(db, `${BASE_SITE}/${COLECOES_DENUNCIA.denuncias}/${denuncia.id}`), { ultima_mensagem_em: doc_.criado_em, mensagens_nao_lidas_central: (Number(denuncia.mensagens_nao_lidas_central) || 0) + 1 }).catch(() => {});
    } catch (e: any) { setErro(e?.message || String(e)); }
  };
  const subir = async (blob: Blob, nome: string, mime: string) => {
    setEnviando(nome);
    try {
      const r = ref(storage, `uploads/petgo/${BASE_SITE.split("/").pop()}/denuncias/conversa-${Date.now()}${Math.random().toString(36).slice(2, 6)}-${nome}`);
      await uploadBytes(r, blob, { contentType: mime });
      await enviar({ type: tipoPorMime(mime), file: await getDownloadURL(r), mime_type: mime, nome_file: nome, body: nome });
    } catch { setErro("Não foi possível enviar o arquivo."); } finally { setEnviando(""); }
  };
  const gravar = async () => {
    if (gravando) { gravando.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tipo = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find((t) => (window as any).MediaRecorder?.isTypeSupported?.(t)) || "";
      const rec = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
      const partes: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && partes.push(e.data);
      rec.onstop = () => { stream.getTracks().forEach((t) => t.stop()); setGravando(null); const mime = (rec.mimeType || "audio/webm").split(";")[0]; const b = new Blob(partes, { type: mime }); if (b.size > 800) void subir(b, `audio-${Date.now()}.${mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm"}`, mime); };
      rec.start(); setGravando(rec);
    } catch { setErro("Não foi possível usar o microfone."); }
  };
  const localizar = () => {
    if (!navigator.geolocation) { setErro("Navegador sem localização."); return; }
    navigator.geolocation.getCurrentPosition((p) => void enviar({ type: "location", latitude: p.coords.latitude, longitude: p.coords.longitude, endereco: "Minha localização" }),
      () => setErro("Não foi possível pegar a localização."), { enableHighAccuracy: true, timeout: 15000 });
  };

  const icone: React.CSSProperties = { border: 0, background: "#6B46C11a", borderRadius: 10, width: 40, height: 40, fontSize: 18, cursor: "pointer", flex: "none" };
  return (
    <div style={{ marginTop: 12, border: "1px solid #6B46C133", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "8px 12px", background: "#6B46C114", fontWeight: 700, fontSize: 13 }}>💬 Conversa com a central (você continua anônimo)</div>
      <div style={{ maxHeight: 360, overflow: "auto", padding: 12 }}>
        {!msgs.length ? <p className="texto-mut" style={{ fontSize: 13 }}>Ainda não há mensagens. Se quiser, mande mais detalhes, fotos, vídeo, áudio ou a localização.</p> : msgs.map((m) => {
          const eu = m.de === "denunciante";
          return (
            <div key={m.id} style={{ maxWidth: "82%", marginLeft: eu ? "auto" : 0, background: eu ? ROXO : "#6B46C114", color: eu ? "#fff" : "inherit", padding: "8px 11px", borderRadius: eu ? "14px 14px 4px 14px" : "14px 14px 14px 4px", marginBottom: 8 }}>
              {m.type === "image" ? <a href={m.file} target="_blank" rel="noreferrer">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={m.file} alt="" style={{ maxWidth: 220, borderRadius: 8, display: "block" }} /></a>
                : m.type === "video" ? <video src={m.file} controls style={{ maxWidth: 240, borderRadius: 8 }} />
                : m.type === "audio" ? <audio src={m.file} controls style={{ width: 220 }} />
                : m.type === "document" ? <a href={m.file} target="_blank" rel="noreferrer" style={{ color: "inherit", fontWeight: 700 }}>📄 {m.nome_file || "Arquivo"}</a>
                : m.type === "location" ? <a href={`https://maps.google.com/?q=${m.latitude},${m.longitude}`} target="_blank" rel="noreferrer" style={{ color: "inherit", fontWeight: 700 }}>📍 {m.endereco || "Localização"}</a>
                : <span style={{ whiteSpace: "pre-wrap" }}>{m.body}</span>}
              <div style={{ fontSize: 11, opacity: 0.7, textAlign: "right", marginTop: 3 }}>{eu ? "Você" : m.puc_nome || "Central"} · {hora(m.criado_em)}</div>
            </div>
          );
        })}
        <div ref={fim} />
      </div>
      {erro ? <p className="erro" style={{ margin: "0 12px 6px" }}>{erro}</p> : null}
      {enviando ? <p className="texto-mut" style={{ margin: "0 12px 6px", fontSize: 13 }}>Enviando {enviando}…</p> : null}
      <div style={{ display: "flex", gap: 6, padding: 10, borderTop: "1px solid #6B46C122", alignItems: "center" }}>
        <input ref={arquivo} type="file" hidden accept="image/*,video/*,audio/*,.pdf" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) { if (f.size > 64 * 1024 * 1024) setErro("Arquivo maior que 64 MB."); else void subir(f, f.name, f.type || "application/octet-stream"); } }} />
        <button type="button" style={icone} title="Foto, vídeo ou arquivo" onClick={() => arquivo.current?.click()}>📎</button>
        <button type="button" style={icone} title="Enviar minha localização" onClick={localizar}>📍</button>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && texto.trim()) { void enviar({ type: "text", body: texto }); setTexto(""); } }} placeholder={gravando ? "Gravando áudio…" : "Escreva…"} style={{ flex: 1, minWidth: 0 }} disabled={!!gravando} />
        {texto.trim() ? <button type="button" className="btn btn-primary" onClick={() => { void enviar({ type: "text", body: texto }); setTexto(""); }}>Enviar</button>
          : <button type="button" style={{ ...icone, background: gravando ? "#EA534A" : ROXO, color: "#fff" }} title={gravando ? "Parar e enviar" : "Gravar áudio"} onClick={gravar}>{gravando ? "■" : "🎤"}</button>}
      </div>
    </div>
  );
}
