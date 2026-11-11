"use client";

// Página do profissional aberta pelo QR Code do app (/c/<token>). Mostra a
// CÓPIA temporária da carteira (os dados do pet podem estar só no celular do
// tutor) e deixa o profissional registrar/validar — vai para a caixa de
// entrada (`registros_profissionais`), que o app do tutor importa, e o tutor
// recebe um aviso. Regras: lib/compartilhado/carteiraDigital.ts.
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, PawPrint, Plus, Stethoscope, Syringe } from "lucide-react";
import { atualizar, criarComIdSequencial, filtrarOnce, getAllOnce } from "@/lib/firebase/gen";
import {
  ROTULOS_ALIMENTO, ROTULOS_REGISTRO_SAUDE, TIPOS_REGISTRO_SAUDE, acessoWebValido, notificacaoAtualizacao, planejarAberturaWeb, planejarEntrada,
  planejarRegistroSaude, planejarVacinaProfissional, planejarValidacaoVacina, statusSaude, type Profissional,
} from "@/lib/compartilhado/carteiraDigital";

const dataBr = (t: any) => (t ? new Date(Number(t)).toLocaleDateString("pt-BR") : "—");
const lerData = (s: string): number | null => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12);
  return d.getDate() === Number(m[1]) ? d.getTime() : null;
};
const hoje = () => new Date().toLocaleDateString("pt-BR");
const ESPECIE: Record<string, string> = { cao: "Cão", gato: "Gato", ave: "Ave", roedor: "Roedor", reptil: "Réptil", peixe: "Peixe", outro: "Outro" };
const CHAVE_PROF = "petgo360-profissional";

export default function CarteiraVet({ token }: { token: string }) {
  const [acesso, setAcesso] = useState<any | null>(null);
  const [erro, setErro] = useState("");
  const [agora, setAgora] = useState(Date.now());
  const [prof, setProf] = useState<Profissional>({ nome: "", registro: "", estabelecimento: "" });
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [form, setForm] = useState<"vacina" | "registro" | null>(null);
  const [aviso, setAviso] = useState("");
  const [extras, setExtras] = useState<{ vacinas: any[]; registros: any[]; validadas: string[] }>({ vacinas: [], registros: [], validadas: [] });

  useEffect(() => { try { const p = JSON.parse(localStorage.getItem(CHAVE_PROF) || "null"); if (p) setProf(p); } catch { /* sem storage */ } }, []);
  useEffect(() => { const t = setInterval(() => setAgora(Date.now()), 15000); return () => clearInterval(t); }, []);
  useEffect(() => {
    (async () => {
      try {
        const [a] = await filtrarOnce("acessos_carteiras_pets", "token", token);
        const patch = planejarAberturaWeb(a ?? null);
        const atual = patch ? { ...a, ...patch } : a;
        if (patch) await atualizar("acessos_carteiras_pets", String(a.id), patch);
        if (!atual.copia) throw new Error("A carteira deste QR Code não está mais disponível. Peça ao tutor para gerar outro.");
        setAcesso(atual);
        getAllOnce("vacinas_catalogo").then((c) => setCatalogo(c.filter((v) => v.status !== "inativo"))).catch(() => {});
      } catch (e: any) { setErro(e?.message ?? "Não foi possível abrir a carteira."); }
    })();
  }, [token]);

  const copia = acesso?.copia;
  const vacinas = useMemo(() => [...(copia?.vacinacoes ?? []).map((v: any) => (extras.validadas.includes(String(v.id)) ? { ...v, validada: true, profissional_nome: prof.nome } : v)), ...extras.vacinas].sort((a, b) => (b.aplicada_em ?? 0) - (a.aplicada_em ?? 0)), [copia, extras, prof.nome]);
  const registros = useMemo(() => [...(copia?.registros ?? []), ...extras.registros].sort((a, b) => (b.data_em ?? 0) - (a.data_em ?? 0)), [copia, extras]);
  const st = statusSaude(vacinas, agora);
  const valido = acesso ? acessoWebValido(acesso, agora) : false;
  const minutos = acesso ? Math.max(0, Math.round((Number(acesso.acesso_ate) - agora) / 60000)) : 0;

  const salvarProf = (p: Profissional) => { setProf(p); try { localStorage.setItem(CHAVE_PROF, JSON.stringify(p)); } catch { /* ok */ } };
  const enviar = async (tipo: "vacina" | "registro" | "validacao", dados: { registro?: any; idAlvo?: string; patch?: any }, oQue: string) => {
    const entrada = planejarEntrada({ acesso, tipo, registro: dados.registro, idAlvo: dados.idAlvo, patch: dados.patch });
    await criarComIdSequencial("registros_profissionais", entrada);
    await criarComIdSequencial("notificacoes", notificacaoAtualizacao({ pet: { id: copia.pet.id, id_clientes: String(acesso.id_clientes), nome: copia.pet.nome }, profissional: prof, oQue }));
  };
  const validar = async (v: any) => {
    setAviso("");
    try {
      const patch = planejarValidacaoVacina(acesso, { ...v, id_pets: acesso.id_pets }, prof);
      await enviar("validacao", { idAlvo: String(v.id), patch }, `vacina ${v.nome_vacina} validada`);
      setExtras((x) => ({ ...x, validadas: [...x.validadas, String(v.id)] }));
      setAviso(`Vacina ${v.nome_vacina} validada. O tutor foi avisado.`);
    } catch (e: any) { setAviso("Erro: " + (e?.message ?? "não foi possível validar.")); }
  };

  if (erro) return <div className="vet"><Topo /><div className="erro-box">{erro}</div></div>;
  if (!copia) return <div className="vet"><Topo /><div className="card">Abrindo a carteira…</div></div>;
  const pet = copia.pet;

  return (
    <div className="vet">
      <Topo tempo={valido ? `Acesso liberado por mais ${minutos} min` : "Acesso encerrado"} />
      <div className="card">
        <div className="ficha">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {pet.foto ? <img src={pet.foto} alt="" /> : <span className="sem-foto"><PawPrint size={36} /></span>}
          <div>
            <h1>{pet.nome}</h1>
            <p>{[ESPECIE[pet.especie], pet.raca, pet.sexo === "macho" ? "Macho" : pet.sexo === "femea" ? "Fêmea" : "", pet.peso ? `${String(pet.peso).replace(".", ",")} kg` : "", pet.castrado ? "Castrado(a)" : "Não castrado(a)"].filter(Boolean).join(" · ")}</p>
            <p>{[pet.data_nascimento ? `Nascimento ${dataBr(pet.data_nascimento)}` : pet.idade_aproximada ? `~${pet.idade_aproximada} ano(s)` : "", pet.microchip ? `Microchip ${pet.microchip}` : "", copia.tutor?.nome ? `Tutor: ${copia.tutor.nome}` : ""].filter(Boolean).join(" · ")}</p>
            <span className={`selo-saude ${st.nivel}`}>{st.texto}</span>
          </div>
        </div>
        {(pet.alergias ?? []).length ? <div className="alergia" style={{ marginTop: 14 }}>⚠ Alergias: {pet.alergias.join(", ")}</div> : null}
        {pet.observacoes ? <p className="texto-mut" style={{ marginBottom: 0 }}>{pet.observacoes}</p> : null}
      </div>

      {aviso ? <div className={aviso.startsWith("Erro") ? "erro-box" : "ok-box"}>{aviso}</div> : null}

      <div className="card">
        <h2>Profissional</h2>
        <div className="grade-form">
          <label className="campo">Seu nome *<input value={prof.nome} onChange={(e) => salvarProf({ ...prof, nome: e.target.value })} /></label>
          <label className="campo">CRMV (opcional)<input value={prof.registro ?? ""} onChange={(e) => salvarProf({ ...prof, registro: e.target.value })} placeholder="CRMV-AM 0000" /></label>
          <label className="campo largo">Clínica / pet shop<input value={prof.estabelecimento ?? ""} onChange={(e) => salvarProf({ ...prof, estabelecimento: e.target.value })} /></label>
        </div>
        {valido ? (
          <div className="acoes-vet" style={{ marginTop: 14 }}>
            <button type="button" className="btn btn-primary" onClick={() => setForm("vacina")}><Syringe size={18} /> Registrar vacina aplicada</button>
            <button type="button" className="btn btn-outline" onClick={() => setForm("registro")}><Stethoscope size={18} /> Registrar atendimento</button>
          </div>
        ) : <p className="texto-mut">O acesso terminou; peça ao tutor para gerar outro QR Code para registrar.</p>}
      </div>

      {form === "vacina" ? <FormVacina catalogo={catalogo.filter((c) => !(c.especies ?? []).length || c.especies.includes(pet.especie))} onCancelar={() => setForm(null)} onSalvar={async (d) => {
        const cat = d.idCatalogo ? catalogo.find((c) => String(c.id) === d.idCatalogo) ?? null : null;
        const registro = planejarVacinaProfissional({ acesso, pet: { id: String(pet.id), id_clientes: String(acesso.id_clientes) }, profissional: prof, vacinacoesDoPet: vacinas, catalogo: cat ? { ...cat, id: String(cat.id) } : null, dados: d });
        await enviar("vacina", { registro }, `vacina ${registro.nome_vacina} aplicada`);
        setExtras((x) => ({ ...x, vacinas: [...x.vacinas, { ...registro, id: `novo${Date.now()}` }] }));
        setForm(null); setAviso(`Vacina ${registro.nome_vacina} registrada. O tutor foi avisado.`);
      }} /> : null}
      {form === "registro" ? <FormRegistro onCancelar={() => setForm(null)} onSalvar={async (d) => {
        const registro = planejarRegistroSaude({ pet: { id: String(pet.id), id_clientes: String(acesso.id_clientes) }, dados: d, origem: "profissional", profissional: prof, idAcesso: String(acesso.id) });
        await enviar("registro", { registro }, registro.titulo);
        setExtras((x) => ({ ...x, registros: [...x.registros, { ...registro, id: `novo${Date.now()}` }] }));
        setForm(null); setAviso(`${registro.titulo} registrado. O tutor foi avisado.`);
      }} /> : null}

      <div className="card">
        <h2>Vacinas</h2>
        {vacinas.length ? (
          <div className="tabela-caixa"><table className="tabela tabela-cartoes"><thead><tr><th>Vacina</th><th>Aplicação</th><th>Lote</th><th>Próxima</th><th></th></tr></thead><tbody>
            {vacinas.map((v) => (
              <tr key={v.id}>
                <td className="cel-titulo"><b>{v.nome_vacina}</b><br /><small className="texto-mut">{v.dose}</small></td>
                <td data-rotulo="Aplicação">{dataBr(v.aplicada_em)}</td><td data-rotulo="Lote">{v.lote || "—"}</td><td data-rotulo="Próxima">{dataBr(v.proxima_dose_em)}</td>
                <td className="cel-acao">{v.validada ? <span className="mini-selo">Validado{v.profissional_nome ? ` · ${v.profissional_nome}` : ""}</span>
                  : valido && !String(v.id).startsWith("novo") ? <button type="button" className="btn btn-outline" style={{ padding: "6px 10px", fontSize: 13 }} onClick={() => validar(v)}><CheckCircle2 size={14} /> Validar</button>
                  : <span className="mini-selo t">Declarado pelo tutor</span>}</td>
              </tr>
            ))}
          </tbody></table></div>
        ) : <p className="texto-mut">Nenhuma vacina registrada.</p>}
      </div>

      {registros.length ? (
        <div className="card">
          <h2>Histórico de saúde</h2>
          <div className="tabela-caixa"><table className="tabela tabela-cartoes"><thead><tr><th>Registro</th><th>Data</th><th>Detalhes</th><th></th></tr></thead><tbody>
            {registros.map((r) => (
              <tr key={r.id}><td className="cel-titulo"><b>{r.titulo}</b></td><td data-rotulo="Data">{dataBr(r.data_em)}</td><td className="cel-texto">{r.descricao}{r.proxima_em ? <><br /><small>Próxima: {dataBr(r.proxima_em)}</small></> : null}</td>
                <td className="cel-acao"><span className={`mini-selo${r.validado ? "" : " t"}`}>{r.validado ? "Validado" : "Declarado"}</span></td></tr>
            ))}
          </tbody></table></div>
        </div>
      ) : null}

      {(copia.alimentacoes ?? []).length ? (
        <div className="card">
          <h2>Alimentação</h2>
          {copia.alimentacoes.map((a: any, i: number) => <p key={i} style={{ margin: "4px 0" }}><b>{a.marca} {a.produto}</b> — {[ROTULOS_ALIMENTO[a.tipo] ?? a.tipo, a.quantidade_diaria && `${a.quantidade_diaria}/dia`, a.vezes_ao_dia && `${a.vezes_ao_dia}× ao dia`, a.observacoes].filter(Boolean).join(" · ")}</p>)}
        </div>
      ) : null}
      <p className="texto-mut" style={{ fontSize: 12, textAlign: "center" }}>Dados compartilhados pelo tutor por QR Code (PetGo360). Use só para o atendimento deste pet.</p>
    </div>
  );
}

function Topo({ tempo }: { tempo?: string }) {
  return (
    <div className="vet-topo">
      <span className="marca">PetGo360 · Carteira do pet</span>
      {tempo ? <span className="tempo"><Clock size={14} style={{ display: "inline", verticalAlign: "-2px" }} /> {tempo}</span> : null}
    </div>
  );
}

function FormVacina({ catalogo, onSalvar, onCancelar }: { catalogo: any[]; onSalvar: (d: any) => Promise<void>; onCancelar: () => void }) {
  const [idCatalogo, setIdCatalogo] = useState("");
  const [nome, setNome] = useState("");
  const [data, setData] = useState(hoje());
  const [proxima, setProxima] = useState("");
  const [lote, setLote] = useState("");
  const [dose, setDose] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const salvar = async () => {
    setErro("");
    const aplicadaEm = lerData(data);
    if (!aplicadaEm) return setErro("Data da aplicação: DD/MM/AAAA.");
    const proximaDoseEm = proxima.trim() ? lerData(proxima) : null;
    if (proxima.trim() && !proximaDoseEm) return setErro("Próxima dose: DD/MM/AAAA.");
    setSalvando(true);
    try { await onSalvar({ idCatalogo, nome, aplicadaEm, proximaDoseEm, lote, dose }); } catch (e: any) { setErro(e?.message ?? "Não foi possível salvar."); } finally { setSalvando(false); }
  };
  return (
    <div className="card">
      <h2>Vacina aplicada</h2>
      <div className="grade-form">
        <label className="campo">Vacina<select value={idCatalogo} onChange={(e) => setIdCatalogo(e.target.value)}><option value="">Outra (digitar)</option>{catalogo.map((c) => <option key={c.id} value={String(c.id)}>{c.nome}</option>)}</select></label>
        {!idCatalogo ? <label className="campo">Nome da vacina<input value={nome} onChange={(e) => setNome(e.target.value)} /></label> : <span />}
        <label className="campo">Aplicação (DD/MM/AAAA)<input value={data} onChange={(e) => setData(e.target.value)} /></label>
        <label className="campo">Próxima dose (opcional)<input value={proxima} onChange={(e) => setProxima(e.target.value)} placeholder="Em branco: pelo protocolo" /></label>
        <label className="campo">Lote<input value={lote} onChange={(e) => setLote(e.target.value)} /></label>
        <label className="campo">Dose<input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="Ex.: 2ª dose, reforço anual" /></label>
      </div>
      {erro ? <p className="erro" style={{ marginTop: 10 }}>{erro}</p> : null}
      <div className="acoes-form"><button type="button" className="btn btn-outline" onClick={onCancelar}>Cancelar</button><button type="button" className="btn btn-primary" onClick={salvar} disabled={salvando}><Plus size={16} /> {salvando ? "Salvando…" : "Registrar"}</button></div>
    </div>
  );
}

function FormRegistro({ onSalvar, onCancelar }: { onSalvar: (d: any) => Promise<void>; onCancelar: () => void }) {
  const [tipo, setTipo] = useState<string>("consulta");
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState(hoje());
  const [proxima, setProxima] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const salvar = async () => {
    setErro("");
    const dataEm = lerData(data);
    if (!dataEm) return setErro("Data: DD/MM/AAAA.");
    const proximaEm = proxima.trim() ? lerData(proxima) : null;
    if (proxima.trim() && !proximaEm) return setErro("Próxima: DD/MM/AAAA.");
    setSalvando(true);
    try { await onSalvar({ tipo, titulo, dataEm, proximaEm, descricao }); } catch (e: any) { setErro(e?.message ?? "Não foi possível salvar."); } finally { setSalvando(false); }
  };
  return (
    <div className="card">
      <h2>Atendimento</h2>
      <div className="grade-form">
        <label className="campo">Tipo<select value={tipo} onChange={(e) => setTipo(e.target.value)}>{TIPOS_REGISTRO_SAUDE.map((t) => <option key={t} value={t}>{ROTULOS_REGISTRO_SAUDE[t]}</option>)}</select></label>
        <label className="campo">Título (opcional)<input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></label>
        <label className="campo">Data (DD/MM/AAAA)<input value={data} onChange={(e) => setData(e.target.value)} /></label>
        <label className="campo">Próxima (opcional)<input value={proxima} onChange={(e) => setProxima(e.target.value)} /></label>
        <label className="campo largo">Detalhes (diagnóstico, produto, orientação)<textarea rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)} /></label>
      </div>
      {erro ? <p className="erro" style={{ marginTop: 10 }}>{erro}</p> : null}
      <div className="acoes-form"><button type="button" className="btn btn-outline" onClick={onCancelar}>Cancelar</button><button type="button" className="btn btn-primary" onClick={salvar} disabled={salvando}><Plus size={16} /> {salvando ? "Salvando…" : "Registrar"}</button></div>
    </div>
  );
}
