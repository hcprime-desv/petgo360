"use client";
// CADASTRO DE ONG OU PROTETOR (dono, 18/11/2026) — /denuncia/ponto. Vai para `pucs_pedidos` aguardando a APROVAÇÃO da central
// do PetGo360 (painel → Disque Denúncia Pet → Cadastros e acessos dos pontos). A senha vai só cifrada (PBKDF2) e vira o login
// do portal (/denuncia/central) quando aprovado.
import { useState } from "react";
import Link from "next/link";
import { gravarComId } from "@/lib/firebase/gen";
import { BYTES_SALT, gerarHashSenha, problemaSenhaUsuario } from "@/lib/admin/senhas";
import { COLECOES_DENUNCIA, UFS, planejarPedidoPuc } from "@/lib/compartilhado/denunciaPet";

export default function CadastroPuc() {
  const [f, setF] = useState({ tipo: "ong", nome: "", documento: "", responsavel: "", email: "", telefone: "", uf: "", municipio: "", descricao: "", site: "", senha: "", senha2: "", aceite: false });
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const campo = (k: keyof typeof f) => ({ value: f[k] as string, onChange: (e: any) => setF({ ...f, [k]: e.target.value }) });

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault(); setErro("");
    try {
      if (f.senha !== f.senha2) throw new Error("As senhas não conferem.");
      const prob = problemaSenhaUsuario(f.senha); if (prob) throw new Error(prob);
      if (!f.aceite) throw new Error("Confirme o compromisso de sigilo.");
      setEnviando(true);
      const senha = await gerarHashSenha(f.senha, crypto.getRandomValues(new Uint8Array(BYTES_SALT)));
      const pedido = planejarPedidoPuc({ ...f, senha });
      await gravarComId(COLECOES_DENUNCIA.pedidosPuc, `site_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, pedido);
      setOk(true);
    } catch (e: any) { setErro(e?.message || String(e)); } finally { setEnviando(false); }
  };

  if (ok) return (
    <div className="card" style={{ padding: 28, maxWidth: 620 }}>
      <h2>Cadastro enviado ✅</h2>
      <p>A central do PetGo360 vai conferir os dados. Quando for aprovado, você recebe as denúncias escolhidas para a sua região e entra em <Link href="/denuncia/central"><b>/denuncia/central</b></Link> com o e-mail <b>{f.email}</b> e a senha que criou.</p>
    </div>
  );
  return (
    <form onSubmit={enviar} className="card" style={{ padding: 28, maxWidth: 760, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 18 }}>
        <label><input type="radio" checked={f.tipo === "ong"} onChange={() => setF({ ...f, tipo: "ong" })} /> ONG (CNPJ)</label>
        <label><input type="radio" checked={f.tipo === "protetor"} onChange={() => setF({ ...f, tipo: "protetor" })} /> Protetor(a) independente (CPF)</label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
        <label className="campo">{f.tipo === "ong" ? "Nome da ONG" : "Seu nome"}<input required {...campo("nome")} /></label>
        <label className="campo">{f.tipo === "ong" ? "CNPJ" : "CPF"}<input required inputMode="numeric" {...campo("documento")} /></label>
        {f.tipo === "ong" ? <label className="campo">Responsável<input required {...campo("responsavel")} /></label> : null}
        <label className="campo">E-mail (será o login)<input type="email" required {...campo("email")} /></label>
        <label className="campo">Telefone / WhatsApp<input required inputMode="tel" {...campo("telefone")} /></label>
        <label className="campo">Estado<select required {...campo("uf")}><option value="">—</option>{UFS.map(([s, n]) => <option key={s} value={s}>{s} — {n}</option>)}</select></label>
        <label className="campo">Município (em branco = todo o estado)<input {...campo("municipio")} /></label>
        <label className="campo">Site ou rede social<input {...campo("site")} /></label>
      </div>
      <label className="campo">O que vocês fazem (aparece para quem denuncia escolher)<textarea rows={3} {...campo("descricao")} /></label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
        <label className="campo">Crie uma senha<input type="password" required autoComplete="new-password" {...campo("senha")} /></label>
        <label className="campo">Repita a senha<input type="password" required autoComplete="new-password" {...campo("senha2")} /></label>
      </div>
      <label style={{ fontSize: 14 }}><input type="checkbox" checked={f.aceite} onChange={(e) => setF({ ...f, aceite: e.target.checked })} /> Comprometo-me a manter o SIGILO das denúncias e a usá-las só para proteger os animais, encaminhando aos órgãos competentes quando for o caso.</label>
      {erro ? <div style={{ color: "#EA534A", fontWeight: 700 }}>{erro}</div> : null}
      <button className="btn btn-primary" disabled={enviando}>{enviando ? "Enviando…" : "Enviar cadastro para aprovação"}</button>
      <p style={{ fontSize: 14, opacity: 0.8 }}>Já tem acesso? <Link href="/denuncia/central"><b>Entrar na central</b></Link></p>
    </form>
  );
}
