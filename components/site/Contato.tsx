"use client";

// Formulário de contato → leads_site (Interessados no /admin e no admsite360), com aceite de LGPD e id sequencial.
import Link from "next/link";
import { useState } from "react";
import { enviarContato, validarContato, type ConfigSite, type DadosContato } from "@/lib/site";
import { useConfigSite } from "@/lib/siteAoVivo";

const VAZIO: DadosContato = { nome: "", email: "", telefone: "", organizacao: "", assunto: "", mensagem: "", aceite: false };
const mascaraFone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export default function Contato({ config }: { config: ConfigSite }) {
  const c = useConfigSite(config);
  const [d, setD] = useState<DadosContato>({ ...VAZIO, assunto: c.contatoAssuntos[0] ?? "" });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [protocolo, setProtocolo] = useState<string | null>(null);
  const [falha, setFalha] = useState("");
  if (!c.contatoAtivo) return null;
  const muda = (campo: keyof DadosContato, valor: any) => setD((x) => ({ ...x, [campo]: valor }));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = validarContato(d);
    setErros(p);
    if (Object.keys(p).length) return;
    setEnviando(true); setFalha("");
    try { setProtocolo(await enviarContato({ ...d, assunto: d.assunto || c.contatoAssuntos[0] || "" }, location.pathname)); }
    catch (err) { console.error("[site] contato", err); setFalha("Não foi possível enviar agora. Tente de novo em instantes."); }
    finally { setEnviando(false); }
  };

  const campo = (nome: keyof DadosContato, rotulo: string, extra: { tipo?: string; fone?: boolean; largo?: boolean; auto?: string } = {}) => (
    <label className={`campo${extra.largo ? " largo" : ""}`}>
      <span>{rotulo}</span>
      <input type={extra.tipo ?? "text"} value={String(d[nome] ?? "")} autoComplete={extra.auto}
        onChange={(e) => muda(nome, extra.fone ? mascaraFone(e.target.value) : e.target.value)} aria-invalid={!!erros[nome]} />
      {erros[nome] && <em>{erros[nome]}</em>}
    </label>
  );

  return (
    <section className="section soft" id="contato">
      <div className="container two-col">
        <div>
          <div className="eyebrow">Contato</div>
          <h2 className="h2-grande">Fale com a <span className="destaque">equipe {c.nomeSite}</span></h2>
          <p className="texto-mut">Dúvidas sobre o app, clínicas e pet shops que querem usar o QR Code, parcerias de planos e serviços para pets: escreva para a gente.</p>
          <ul className="lista-check">
            {c.email && <li>E-mail: <a href={`mailto:${c.email}`}>{c.email}</a></li>}
            {c.whatsapp && <li>WhatsApp: <a href={`https://wa.me/55${c.whatsapp.replace(/\D/g, "").replace(/^55/, "")}`} target="_blank" rel="noreferrer">{c.whatsapp}</a></li>}
            {c.telefone && <li>Telefone: {c.telefone}</li>}
            <li>Resposta em até 1 dia útil.</li>
          </ul>
        </div>
        <div className="panel card-form">
          <div className="panel-body">
            {protocolo ? (
              <div className="form-ok">
                <div className="ok-circulo">✓</div>
                <h3>Recebemos a sua mensagem!</h3>
                <p>Número do registro: <b>{protocolo}</b>. A equipe {c.nomeSite} vai falar com você em breve.</p>
                <button type="button" className="btn btn-outline" onClick={() => { setProtocolo(null); setD({ ...VAZIO, assunto: c.contatoAssuntos[0] ?? "" }); }}>Enviar outra mensagem</button>
              </div>
            ) : (
              <form className="form-contato" onSubmit={enviar} noValidate>
                <div className="grade-form">
                  {campo("nome", "Nome *", { largo: true, auto: "name" })}
                  {campo("email", "E-mail", { tipo: "email", auto: "email" })}
                  {campo("telefone", "Telefone / WhatsApp", { fone: true, auto: "tel" })}
                  {campo("organizacao", "Clínica ou empresa (opcional)", { auto: "organization" })}
                  <label className="campo">
                    <span>Assunto</span>
                    <select value={d.assunto} onChange={(e) => muda("assunto", e.target.value)}>{c.contatoAssuntos.map((a) => <option key={a}>{a}</option>)}</select>
                  </label>
                  <label className="campo largo">
                    <span>Mensagem *</span>
                    <textarea rows={4} value={d.mensagem} onChange={(e) => muda("mensagem", e.target.value)} aria-invalid={!!erros.mensagem} />
                    {erros.mensagem && <em>{erros.mensagem}</em>}
                  </label>
                  <label className="aceite largo">
                    <input type="checkbox" checked={d.aceite} onChange={(e) => muda("aceite", e.target.checked)} />
                    <span>Concordo com a <Link href="/privacidade" target="_blank">Política de Privacidade</Link> e autorizo o contato da equipe {c.nomeSite}.</span>
                  </label>
                  {erros.aceite && <em className="largo erro">{erros.aceite}</em>}
                </div>
                {falha && <div className="chat-erro" role="alert">{falha}</div>}
                <button type="submit" className="btn btn-primary" disabled={enviando}>{enviando ? "Enviando..." : "Enviar mensagem"}</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
