"use client";
// PORTAL DOS PONTOS QUE RECEBEM DENÚNCIAS (dono, 18/11/2026) — /denuncia/central: ONGs, protetores e órgãos que preferem o site.
// Login = `usuarios` do tenant (mesmo do painel e do /admin; perfil "puc" ligado ao ponto por `id_orgaos_denuncia`). Depois do
// login, a MESMA central do painel (components/centralDenuncia, gerada pelo sync:app). Cadastro novo: /denuncia/ponto.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addDoc, collection, doc, onSnapshot, query, setDoc, updateDoc, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import { BASE_SITE } from "@/lib/firebase/gen";
import { lerDoc } from "@/lib/admin/banco";
import { entrar, lerSessao, pode, registrarAuditoria, sair, type Sessao } from "@/lib/admin/sessao";
import CentralDenuncias from "@/components/centralDenuncia/CentralDenuncias";
import type { FonteCentral } from "@/components/centralDenuncia/fonte";
import { COLECOES_DENUNCIA, NOME_SERVICO, PERMISSAO_CENTRAL_PUC, ROTULOS_TIPO_PUC, tipoPuc } from "@/lib/compartilhado/denunciaPet";

const limpo = (d: Record<string, any>) => Object.fromEntries(Object.entries(d).filter(([k, v]) => v !== undefined && k !== "id"));

export default function PortalPuc() {
  const [sessao, setSessao] = useState<Sessao | null | undefined>(undefined);
  const [puc, setPuc] = useState<any | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);
  useEffect(() => setSessao(lerSessao()), []);
  useEffect(() => {
    if (!sessao) { setPuc(undefined); return; }
    (async () => {
      const u = await lerDoc("usuarios", sessao.id).catch(() => null);
      setPuc(u?.id_orgaos_denuncia ? await lerDoc(COLECOES_DENUNCIA.orgaos, String(u.id_orgaos_denuncia)).catch(() => null) : null);
    })();
  }, [sessao]);

  const fonte = useMemo<FonteCentral | null>(() => (!sessao || puc === undefined ? null : {
    ouvir: (colecao, filtro, cb) => {
      const col = collection(db, `${BASE_SITE}/${colecao}`);
      return onSnapshot(filtro ? query(col, where(filtro[0], filtro[1], filtro[2])) : col, (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => cb([]));
    },
    definir: (colecao, id, dados) => setDoc(doc(db, `${BASE_SITE}/${colecao}/${id}`), { ...limpo(dados), updated_at: Date.now() }, { merge: true }),
    adicionar: async (colecao, dados) => (await addDoc(collection(db, `${BASE_SITE}/${colecao}`), { ...limpo(dados), created_at: dados.created_at ?? Date.now() })).id,
    atualizar: (colecao, id, dados) => updateDoc(doc(db, `${BASE_SITE}/${colecao}/${id}`), { ...limpo(dados), updated_at: Date.now() }),
    subir: async (arquivo, nome) => {
      const r = ref(storage, `uploads/petgo/${BASE_SITE.split("/").pop()}/denuncias/${Date.now()}${Math.random().toString(36).slice(2, 6)}/${nome}`);
      await uploadBytes(r, arquivo, { contentType: arquivo.type || undefined });
      return getDownloadURL(r);
    },
    usuario: { id: sessao.id, nome: sessao.nome },
    puc,
    auditar: (descricao, dados) => void registrarAuditoria(sessao, { colecao: COLECOES_DENUNCIA.denuncias, id_registro: String(dados?.id ?? ""), acao: "alteracao", descricao }),
  }), [sessao, puc]);

  const fazerLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setErro(""); setEntrando(true);
    try {
      const r = await entrar(email, senha);
      if (!r.ok) { setErro(r.erro); return; }
      if (!pode(r.sessao, PERMISSAO_CENTRAL_PUC)) { setErro("Este usuário não tem acesso à central de denúncias."); sair(); return; }
      setSessao(r.sessao);
    } finally { setEntrando(false); }
  };

  if (sessao === undefined) return <div className="container" style={{ padding: 40 }}>Carregando…</div>;
  if (!sessao || !pode(sessao, PERMISSAO_CENTRAL_PUC)) return (
    <section className="section"><div className="container" style={{ maxWidth: 460 }}>
      <div className="card" style={{ padding: 28 }}>
        <span className="eyebrow">Órgãos, ONGs e protetores</span>
        <h1 style={{ fontSize: 26, margin: "6px 0 4px" }}>Central de denúncias</h1>
        <p style={{ opacity: 0.8, marginBottom: 18 }}>Entre para tratar as denúncias do {NOME_SERVICO} que chegaram a você: conversar com o denunciante (anônimo) e encaminhar aos órgãos competentes.</p>
        <form onSubmit={fazerLogin} style={{ display: "grid", gap: 10 }}>
          <label className="campo">E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" /></label>
          <label className="campo">Senha<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete="current-password" /></label>
          {erro ? <div style={{ color: "#EA534A", fontWeight: 700 }}>{erro}</div> : null}
          <button className="btn btn-primary" disabled={entrando}>{entrando ? "Entrando…" : "Entrar"}</button>
        </form>
        <p style={{ marginTop: 18, fontSize: 14 }}>É uma ONG ou protetor(a) e quer receber denúncias da sua região? <Link href="/denuncia/ponto"><b>Cadastre-se</b></Link> — a central do PetGo360 aprova o cadastro.</p>
      </div>
    </div></section>
  );
  if (!fonte) return <div className="container" style={{ padding: 40 }}>Carregando…</div>;
  return (
    <div style={{ padding: "12px clamp(8px, 2vw, 24px) 16px" }}>
      <CentralDenuncias fonte={fonte} tema="auto" titulo={`${NOME_SERVICO} — Central`} desconto={262} usuario={sessao.nome} aoFechar={() => { sair(); setSessao(null); }} />
    </div>
  );
}
