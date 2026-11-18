"use client";
// GERADO por "npm run sync:app" no painel PetGo360 a partir de shared/centralDenuncia/Encaminhar.tsx — NÃO EDITAR AQUI.
// ENCAMINHAR (trâmite): a central ou o PUC escolhe UM OU MAIS pontos (órgãos competentes, ONGs, protetores) — cada um recebe a
// denúncia na própria central (trâmite) e, se tiver e-mail, o PDF por e-mail (pedido em `denuncias_pet_encaminhamentos`, o
// back-end envia). A denúncia passa a listar esses PUCs (`pucs`).
import React, { useMemo, useState } from "react";
import type { FonteCentral } from "./fonte";
import {
  COLECOES_DENUNCIA, ROTULOS_TIPO_PUC, avancarTramite, chaveMunicipio, emailsDoOrgao, nomePuc, nomeUf, planejarTramite, pucAtivo, tipoPuc,
} from "@/lib/compartilhado/denunciaPet";

export function Encaminhar({ fonte, denuncia, pucs, jaTem, meuTramite, aoFechar }: {
  fonte: FonteCentral; denuncia: any; pucs: any[]; jaTem: string[]; meuTramite: any | null; aoFechar: (msg?: string) => void;
}) {
  const [marcados, setMarcados] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [todosUf, setTodosUf] = useState(false);
  const [nota, setNota] = useState("");
  const [gravando, setGravando] = useState(false);
  const [erro, setErro] = useState("");
  const meuId = fonte.puc ? String(fonte.puc.id) : "";
  const grupos = useMemo(() => {
    const m = chaveMunicipio(denuncia.municipio), q = busca.trim().toLowerCase();
    const ok = pucs.filter((p) => pucAtivo(p) && String(p.id) !== meuId && (todosUf || q ? true : String(p.uf) === String(denuncia.uf) || (tipoPuc(p) === "central" && !String(p.uf ?? "").trim())))
      .filter((p) => !q || [p.nome, p.sigla, p.municipio, p.uf].join(" ").toLowerCase().includes(q));
    const regiao = (p: any) => String(p.uf) === String(denuncia.uf) && (!String(p.municipio ?? "").trim() || chaveMunicipio(p.municipio) === m);
    const ord = (a: any, b: any) => Number(regiao(b)) - Number(regiao(a)) || String(a.nome).localeCompare(String(b.nome));
    return [["Órgãos competentes", ok.filter((p) => tipoPuc(p) === "orgao").sort(ord)], ["ONGs e protetores", ok.filter((p) => tipoPuc(p) === "ong" || tipoPuc(p) === "protetor").sort(ord)], ["Centrais do Disque Denúncia Pet", ok.filter((p) => tipoPuc(p) === "central").sort(ord)]] as const;
  }, [pucs, busca, todosUf, denuncia, meuId]);
  const alternar = (id: string) => setMarcados((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  const confirmar = async () => {
    if (!marcados.length) { setErro("Escolha pelo menos um destino."); return; }
    setGravando(true); setErro("");
    try {
      const escolhidos = pucs.filter((p) => marcados.includes(String(p.id)));
      const origem = fonte.puc ? "puc" : "central";
      const deNome = fonte.puc ? `${fonte.puc.nome} — ${fonte.usuario.nome}` : `Central PetGo — ${fonte.usuario.nome}`;
      for (const p of escolhidos) {
        const t = planejarTramite({ denuncia, puc: p, origem, deNome, idPucOrigem: meuId || null, nota });
        const { id, ...dados } = t;
        await fonte.definir(COLECOES_DENUNCIA.tramites, id, dados);
      }
      const novos = [...new Set([...(denuncia.pucs ?? []).map(String), ...marcados])];
      await fonte.atualizar(COLECOES_DENUNCIA.denuncias, String(denuncia.id), {
        pucs: novos, ...(fonte.puc ? {} : { status: "difundida", difundida_em: Date.now() }),
      });
      if (meuTramite) await fonte.definir(COLECOES_DENUNCIA.tramites, String(meuTramite.id), avancarTramite(meuTramite, "encaminhada", fonte.usuario.nome, `Encaminhou para ${escolhidos.map(nomePuc).join(", ")}`));
      // e-mail com o PDF para quem tem e-mail (o back-end envia)
      const comEmail = escolhidos.filter((p) => emailsDoOrgao(p).length).map((p) => String(p.id));
      if (comEmail.length) await fonte.adicionar(COLECOES_DENUNCIA.encaminhamentos, {
        id_denuncias_pet: String(denuncia.id), protocolo: denuncia.protocolo, destinos: comEmail, origem, origem_nome: deNome, id_orgaos_denuncia_origem: meuId || null, nota, status: "pedido", erro: "", created_at: Date.now(),
      });
      fonte.auditar?.(`Denúncia ${denuncia.protocolo} encaminhada para ${escolhidos.map(nomePuc).join(", ")}`, { destinos: marcados, nota });
      aoFechar(`Encaminhada para ${escolhidos.map(nomePuc).join(", ")}${comEmail.length ? " — o e-mail com o PDF sai em instantes." : "."}`);
    } catch (e: any) { setErro(e?.message || String(e)); setGravando(false); }
  };

  return (
    <div className="cdp-modal" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="cdp-card cdp-modal-caixa">
        <div className="cdp-linha"><h2>Encaminhar {denuncia.protocolo}</h2><button className="cdp-icone" onClick={() => aoFechar()}>✕</button></div>
        <p className="cdp-sub">Cada destino recebe a denúncia na própria central (e por e-mail, com o PDF, se tiver e-mail). Sempre anônima.</p>
        <div className="cdp-linha" style={{ gap: 8, margin: "10px 0" }}>
          <input className="cdp-input" placeholder="🔍 Buscar órgão, ONG, sigla, município…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <label className="cdp-sub" style={{ whiteSpace: "nowrap" }}><input type="checkbox" checked={todosUf} onChange={(e) => setTodosUf(e.target.checked)} /> outros estados</label>
        </div>
        <div className="cdp-modal-lista">
          {grupos.map(([titulo, l]) => (
            <div key={titulo}>
              <div className="cdp-rot" style={{ margin: "10px 0 6px" }}>{titulo.toUpperCase()} · {nomeUf(denuncia.uf)}</div>
              {!l.length ? <p className="cdp-sub">Nenhum cadastrado{todosUf ? "" : " neste estado"}.</p> : l.map((p) => {
                const id = String(p.id), ja = jaTem.includes(id), on = marcados.includes(id);
                return (
                  <label key={id} className={`cdp-destino ${on ? "on" : ""} ${ja ? "ja" : ""}`}>
                    <input type="checkbox" disabled={ja} checked={on || ja} onChange={() => alternar(id)} />
                    <span><b>{nomePuc(p)}</b><div className="cdp-sub">{ROTULOS_TIPO_PUC[tipoPuc(p)]} · {p.municipio || "todo o estado"}/{p.uf}{emailsDoOrgao(p).length ? " · e-mail" : ""}{ja ? " · já recebeu" : ""}</div></span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
        <textarea className="cdp-input" rows={2} placeholder="Nota para quem recebe (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} style={{ marginTop: 10 }} />
        {erro ? <div className="cdp-erro">{erro}</div> : null}
        <div className="cdp-linha" style={{ marginTop: 12, justifyContent: "flex-end", gap: 8 }}>
          <button className="cdp-btn" onClick={() => aoFechar()}>Cancelar</button>
          <button className="cdp-btn cdp-btn-p" disabled={gravando || !marcados.length} onClick={confirmar}>➜ Encaminhar{marcados.length ? ` (${marcados.length})` : ""}</button>
        </div>
      </div>
    </div>
  );
}
