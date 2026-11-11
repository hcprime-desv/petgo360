"use client";

// Avisos do /admin (Avisos): no máximo uma faixa no topo e uma janela por vez — o de menor ordem de cada formato.
// Fechar grava id+versão no navegador: quem fechou só vê de novo se o aviso for editado.
import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Markdown from "@/components/public/Markdown";
import { useAvisos } from "@/lib/siteAoVivo";
import type { Aviso } from "@/lib/site";

const chave = (a: Aviso) => `site_aviso_${a.id}_${a.versao}`;
const foiFechado = (a: Aviso) => { try { return localStorage.getItem(chave(a)) === "1"; } catch { return false; } };
const marcarFechado = (a: Aviso) => { try { localStorage.setItem(chave(a), "1"); } catch { /* aba anônima */ } };

function LinkAviso({ aviso, className }: { aviso: Aviso; className: string }) {
  if (!aviso.linkUrl) return null;
  const texto = aviso.linkTexto || "Saiba mais";
  return /^https?:\/\//.test(aviso.linkUrl)
    ? <a href={aviso.linkUrl} className={className} target="_blank" rel="noreferrer">{texto}</a>
    : <Link href={aviso.linkUrl} className={className}>{texto}</Link>;
}

export default function Avisos() {
  const avisos = useAvisos();
  const [fechados, setFechados] = useState<Set<string> | null>(null);
  useEffect(() => setFechados(new Set(avisos.filter(foiFechado).map(chave))), [avisos]);
  if (!fechados) return null;
  const faixa = avisos.find((a) => a.tipo === "faixa" && !fechados.has(chave(a)));
  const modal = avisos.find((a) => a.tipo === "modal" && !fechados.has(chave(a)));
  const fechar = (a: Aviso) => { marcarFechado(a); setFechados(new Set([...fechados, chave(a)])); };
  return (
    <>
      {faixa && (
        <div className="aviso-faixa" role="region" aria-label="Aviso">
          <div className="container">
            <div className="texto"><strong>{faixa.titulo}</strong>{faixa.mensagem ? <> — <Markdown inline>{faixa.mensagem}</Markdown></> : null}</div>
            <LinkAviso aviso={faixa} className="link" />
            <button type="button" onClick={() => fechar(faixa)} aria-label="Fechar aviso"><X size={18} /></button>
          </div>
        </div>
      )}
      {modal && (
        <div className="modal-fundo" onClick={() => fechar(modal)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby={`aviso-${modal.id}`} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="fechar" onClick={() => fechar(modal)} aria-label="Fechar aviso"><X size={20} /></button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {modal.imagem && <img src={modal.imagem} alt="" />}
            <div className="corpo-m">
              <h2 id={`aviso-${modal.id}`}>{modal.titulo}</h2>
              <div className="markdown"><Markdown>{modal.mensagem}</Markdown></div>
              <div className="botoes" style={{ marginTop: 18 }}>
                <LinkAviso aviso={modal} className="btn btn-primary" />
                <button type="button" className="btn btn-outline" onClick={() => fechar(modal)}>Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
