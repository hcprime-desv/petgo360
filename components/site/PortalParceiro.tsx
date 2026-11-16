"use client";
// PORTAL DO PARCEIRO PetGo (dono, 15/11/2026) — área restrita no site (/parceiro): o parceiro se CADASTRA (fica aguardando a
// aprovação da equipe), ENTRA (e-mail + senha, PBKDF2) e vê: resumo, VENDAS (cobranças pagas pelo app), EXTRATO da conta corrente
// (a liberar / disponível), REPASSES (pede o repasse — ou recebe automático, se a plataforma ligar), CONTA BANCÁRIA para receber,
// COBRAR (cria a cobrança que o cliente paga pelo app) e CUPONS (propõe ofertas e compra pacotes de distribuição).
// Quem mexe em dinheiro é o servidor (petall360 + bank-manager): aqui só se lê e se pede.
import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgePercent, Banknote, CreditCard, LogOut, QrCode, Receipt, Store, Wallet } from "lucide-react";
import { atualizar, criarComIdSequencial, filtrarOnce, gravarComId } from "@/lib/firebase/gen";
import { conferirSenha, gerarHashSenha, normalizarEmail } from "@/lib/admin/senhas";
import { COLECOES_REPASSE, TIPOS_CHAVE_PIX, problemaContaBancaria, saldoRecebedor } from "@/lib/gatewayContrato";
import CobrancaParceiro from "./CobrancaParceiro";

const brl = (v: any) => `R$ ${(Number(v) || 0).toFixed(2).replace(".", ",")}`;
const dt = (v: any) => (v ? new Date(Number(v)).toLocaleDateString("pt-BR") : "—");
const CHAVE = "petgo-portal-parceiro";
const CATEGORIAS = [["veterinario", "Veterinário"], ["hospital_24h", "Hospital 24 h"], ["pet_shop", "Pet shop"], ["banho_tosa", "Banho e tosa"], ["hotel_creche", "Hotel e creche"], ["adestrador", "Adestrador"], ["farmacia", "Farmácia vet"], ["ong", "ONG"]];
type Aba = "resumo" | "vendas" | "extrato" | "repasses" | "conta" | "cobrar" | "cupons";
const bytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));

export default function PortalParceiro() {
  const [sessao, setSessao] = useState<{ id: string; nome: string; codigo: string } | null>(null);
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem(CHAVE) || "null"); if (s?.id && s.ate > Date.now()) setSessao(s); } catch { /* sem sessão */ } }, []);
  const sair = () => { try { localStorage.removeItem(CHAVE); } catch { /* ok */ } setSessao(null); };
  if (sessao) return <Painel sessao={sessao} sair={sair} />;
  return modo === "entrar" ? <Entrar aoEntrar={setSessao} cadastrar={() => setModo("cadastrar")} /> : <Cadastrar voltar={() => setModo("entrar")} />;
}

function Entrar({ aoEntrar, cadastrar }: { aoEntrar: (s: any) => void; cadastrar: () => void }) {
  const [email, setEmail] = useState(""); const [senha, setSenha] = useState(""); const [erro, setErro] = useState(""); const [ok, setOk] = useState(false);
  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setErro(""); setOk(true);
    try {
      const [p] = await filtrarOnce("parceiros_indicacao", "email_acesso", normalizarEmail(email));
      if (!p || !(await conferirSenha(senha, p))) { setErro("E-mail ou senha incorretos."); return; }
      if (p.aprovacao === "pendente") { setErro("Seu cadastro está em análise pela equipe PetGo360. Você recebe um aviso quando for liberado."); return; }
      if (p.status !== "ativo") { setErro("Parceria inativa. Fale com a central do PetGo360."); return; }
      const s = { id: String(p.id), nome: p.nome, codigo: p.codigo, ate: Date.now() + 12 * 3600_000 };
      try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch { /* ok */ }
      aoEntrar(s);
    } finally { setOk(false); }
  }
  return (
    <form className="parc-cartao" onSubmit={enviar}>
      <Store size={34} aria-hidden />
      <h2>Portal do Parceiro PetGo360</h2>
      <p className="parc-sub">Suas vendas pelo app, o que você tem a receber, repasses para a sua conta, cobranças e cupons.</p>
      <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
      <label>Senha<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required /></label>
      {erro ? <p className="parc-erro" role="alert">{erro}</p> : null}
      <button className="btn btn-primary" disabled={ok}>{ok ? "Entrando…" : "Entrar"}</button>
      <button type="button" className="parc-link" onClick={cadastrar}>Ainda não é parceiro? Cadastre a sua empresa</button>
    </form>
  );
}

function Cadastrar({ voltar }: { voltar: () => void }) {
  const [d, setD] = useState({ nome: "", documento: "", tipo: "pet_shop", telefone: "", email: "", cidade: "", uf: "", endereco: "", senha: "", senha2: "" });
  const [cats, setCats] = useState<string[]>([]); const [erro, setErro] = useState(""); const [feito, setFeito] = useState(false); const [ok, setOk] = useState(false);
  const muda = (k: keyof typeof d) => (e: any) => setD({ ...d, [k]: e.target.value });
  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setErro("");
    if (d.senha.length < 8 || !/[a-zA-Z]/.test(d.senha) || !/\d/.test(d.senha)) return setErro("Senha: mínimo 8 caracteres, com letras e números.");
    if (d.senha !== d.senha2) return setErro("As senhas não conferem.");
    if (d.documento.replace(/\D/g, "").length < 11) return setErro("Informe o CNPJ ou CPF.");
    setOk(true);
    try {
      const email = normalizarEmail(d.email);
      if ((await filtrarOnce("parceiros_indicacao", "email_acesso", email)).length) return setErro("Já existe um parceiro com este e-mail. Entre ou recupere a senha com a central.");
      const base = d.nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) || "PARCEIRO";
      const codigo = `${base}${String(bytes(1)[0] % 90 + 10)}`;
      await criarComIdSequencial("parceiros_indicacao", {
        nome: d.nome.trim(), tipo: d.tipo, codigo, documento: d.documento.replace(/\D/g, ""), telefone: d.telefone, whatsapp: d.telefone, email, email_acesso: email,
        cidade: d.cidade, uf: d.uf.toUpperCase().slice(0, 2), endereco: d.endereco, categorias_guia: cats, no_guia: "nao", comissao_tipo: "percentual", comissao_percentual: 0, bonus_tutor_dias: 15,
        ...(await gerarHashSenha(d.senha, bytes(16))), aprovacao: "pendente", origem_cadastro: "portal", status: "inativo", created_at: Date.now(),
      });
      setFeito(true);
    } catch { setErro("Não foi possível enviar o cadastro. Tente de novo."); } finally { setOk(false); }
  }
  if (feito) return (
    <div className="parc-cartao parc-centro"><Store size={40} aria-hidden /><h2>Cadastro recebido!</h2>
      <p>A equipe PetGo360 analisa os seus dados e libera o acesso. Depois, entre com o seu e-mail e a senha.</p>
      <button className="btn btn-primary" onClick={voltar}>Voltar para entrar</button></div>
  );
  return (
    <form className="parc-cartao" style={{ maxWidth: 720 }} onSubmit={enviar}>
      <h2>Cadastre a sua empresa</h2>
      <p className="parc-sub">Apareça no Guia do app, receba pelo app com cupons e pontos dos clientes e acompanhe tudo aqui.</p>
      <div className="parc-campos">
        <label>Nome da empresa<input value={d.nome} onChange={muda("nome")} required /></label>
        <label>CNPJ / CPF<input value={d.documento} onChange={muda("documento")} required /></label>
        <label>Tipo<select value={d.tipo} onChange={muda("tipo")}><option value="pet_shop">Pet shop</option><option value="clinica">Clínica veterinária</option><option value="outro">Outro serviço pet</option></select></label>
        <label>Telefone / WhatsApp<input value={d.telefone} onChange={muda("telefone")} required /></label>
        <label>E-mail (acesso)<input type="email" value={d.email} onChange={muda("email")} required /></label>
        <label>Cidade<input value={d.cidade} onChange={muda("cidade")} required /></label>
        <label>UF<input value={d.uf} onChange={muda("uf")} maxLength={2} required /></label>
        <label style={{ gridColumn: "1 / -1" }}>Endereço<input value={d.endereco} onChange={muda("endereco")} /></label>
        <label>Senha<input type="password" value={d.senha} onChange={muda("senha")} autoComplete="new-password" required /></label>
        <label>Repita a senha<input type="password" value={d.senha2} onChange={muda("senha2")} autoComplete="new-password" required /></label>
      </div>
      <div className="parc-cats">{CATEGORIAS.map(([v, r]) => <label key={v}><input type="checkbox" checked={cats.includes(v)} onChange={(e) => setCats(e.target.checked ? [...cats, v] : cats.filter((x) => x !== v))} /> {r}</label>)}</div>
      {erro ? <p className="parc-erro" role="alert">{erro}</p> : null}
      <button className="btn btn-primary" disabled={ok}>{ok ? "Enviando…" : "Enviar cadastro"}</button>
      <button type="button" className="parc-link" onClick={voltar}>Já tenho cadastro</button>
    </form>
  );
}

function Painel({ sessao, sair }: { sessao: { id: string; nome: string; codigo: string }; sair: () => void }) {
  const [aba, setAba] = useState<Aba>("resumo");
  const [parceiro, setParceiro] = useState<any | null>(null);
  const [vendas, setVendas] = useState<any[]>([]);
  const [lancs, setLancs] = useState<any[]>([]);
  const [saques, setSaques] = useState<any[]>([]);
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const carregar = useCallback(async () => {
    const [[p], v, l, s, o] = await Promise.all([
      filtrarOnce("parceiros_indicacao", "codigo", sessao.codigo), filtrarOnce("cobrancas_parceiros", "id_parceiros_indicacao", sessao.id),
      filtrarOnce(COLECOES_REPASSE.lancamentos, "id_recebedor", sessao.id), filtrarOnce(COLECOES_REPASSE.saques, "id_recebedor", sessao.id), filtrarOnce("ofertas_clube", "id_parceiros_indicacao", sessao.id),
    ]);
    setParceiro(p ?? null); setVendas(v.filter((x) => x.status === "paga").sort((a, b) => Number(b.pago_em) - Number(a.pago_em)));
    setLancs(l.sort((a, b) => Number(b.created_at) - Number(a.created_at))); setSaques(s.sort((a, b) => Number(b.created_at) - Number(a.created_at))); setOfertas(o);
  }, [sessao]);
  useEffect(() => { carregar(); const t = setInterval(carregar, 30_000); return () => clearInterval(t); }, [carregar]);
  const saldo = useMemo(() => saldoRecebedor(lancs), [lancs]);
  const mes = new Date(); mes.setDate(1); mes.setHours(0, 0, 0, 0);
  const vendasMes = vendas.filter((v) => Number(v.pago_em) >= mes.getTime());
  const ABAS: [Aba, string, any][] = [["resumo", "Resumo", Wallet], ["vendas", "Vendas", Receipt], ["extrato", "Extrato", Banknote], ["repasses", "Repasses", CreditCard], ["conta", "Conta para receber", Banknote], ["cobrar", "Cobrar", QrCode], ["cupons", "Cupons", BadgePercent]];

  return (
    <div className="portal">
      <div className="portal-topo">
        <div><h2 style={{ margin: 0 }}>{sessao.nome}</h2><span className="parc-sub">Parceiro PetGo · código {sessao.codigo}</span></div>
        <button className="parc-link" onClick={sair}><LogOut size={16} aria-hidden /> Sair</button>
      </div>
      <div className="portal-abas">{ABAS.map(([k, r, I]) => <button key={k} className={aba === k ? "ativa" : ""} onClick={() => setAba(k)}><I size={16} aria-hidden /> {r}</button>)}</div>
      {msg ? <p className="parc-sub" role="status">{msg}</p> : null}

      {aba === "resumo" ? (
        <div className="portal-kpis">
          <Kpi r="Disponível para repasse" v={brl(saldo.disponivel)} cor="#16a34a" />
          <Kpi r="A liberar" v={brl(saldo.aLiberar)} d={saldo.proximaLiberacao ? `próxima em ${dt(saldo.proximaLiberacao)}` : ""} cor="#2563eb" />
          <Kpi r="Vendas no mês (pelo app)" v={brl(vendasMes.reduce((a, v) => a + (Number(v.valor) || 0), 0))} d={`${vendasMes.length} venda(s)`} cor="#6b46c1" />
          <Kpi r="Já repassado" v={brl(saldo.totalSacado)} cor="#ea580c" />
        </div>
      ) : null}

      {aba === "vendas" ? <Tabela cab={["Data", "Cliente", "Descrição", "Valor", "Cupom", "Pontos", "Tarifa", "Você recebe"]} linhas={vendas.map((v) => [dt(v.pago_em), v.nome_cliente ?? "—", v.descricao ?? "", brl(v.valor), v.desconto_cupom ? `−${brl(v.desconto_cupom)}` : "—", v.desconto_pontos ? `${brl(v.desconto_pontos)} (PetGo)` : "—", brl(v.taxa), brl(v.valor_repasse)])} vazio="Nenhuma venda pelo app ainda." /> : null}

      {aba === "extrato" ? <Tabela cab={["Data", "Descrição", "Valor", "Situação"]} linhas={lancs.map((l) => [dt(l.created_at), l.descricao, `${l.tipo === "credito" ? "+" : "−"}${brl(l.valor)}`, l.tipo === "credito" ? (Number(l.liberar_em) > Date.now() ? `a liberar em ${dt(l.liberar_em)}` : "disponível") : "debitado"])} vazio="Sem lançamentos." /> : null}

      {aba === "repasses" ? <Repasses sessao={sessao} parceiro={parceiro} saldo={saldo.disponivel} saques={saques} recarregar={carregar} setMsg={setMsg} /> : null}
      {aba === "conta" ? <Conta parceiro={parceiro} recarregar={carregar} setMsg={setMsg} /> : null}
      {aba === "cobrar" ? <CobrancaParceiro codigoFixo={sessao.codigo} /> : null}
      {aba === "cupons" ? <Cupons sessao={sessao} ofertas={ofertas} recarregar={carregar} setMsg={setMsg} /> : null}
    </div>
  );
}

function Kpi({ r, v, d, cor }: { r: string; v: string; d?: string; cor: string }) {
  return <div className="portal-kpi" style={{ borderTopColor: cor }}><span>{r}</span><b style={{ color: cor }}>{v}</b>{d ? <small>{d}</small> : null}</div>;
}
function Tabela({ cab, linhas, vazio }: { cab: string[]; linhas: any[][]; vazio: string }) {
  if (!linhas.length) return <p className="parc-sub">{vazio}</p>;
  return <div className="portal-tabela"><table><thead><tr>{cab.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{linhas.map((l, i) => <tr key={i}>{l.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>;
}

function Repasses({ sessao, parceiro, saldo, saques, recarregar, setMsg }: { sessao: any; parceiro: any; saldo: number; saques: any[]; recarregar: () => void; setMsg: (m: string) => void }) {
  const [valor, setValor] = useState("");
  const aberto = saques.some((s) => ["pedido", "processando"].includes(s.status));
  async function pedir(e: React.FormEvent) {
    e.preventDefault();
    const v = Number(valor.replace(/\./g, "").replace(",", ".")) || saldo;
    const pc = problemaContaBancaria(parceiro?.conta_recebimento);
    if (pc) return setMsg(`${pc} (aba Conta para receber)`);
    const id = `portal_${sessao.id}_${Date.now()}`;
    await gravarComId(COLECOES_REPASSE.saques, id, { id, id_recebedor: sessao.id, valor: Math.round(v * 100) / 100, origem: "portal", status: "pedido", created_at: Date.now() });
    setMsg("Repasse pedido. Acompanhe abaixo — cai na sua conta pelo Pix."); setValor(""); setTimeout(recarregar, 3000);
  }
  return (
    <div className="parc-grade">
      <form className="parc-cartao" onSubmit={pedir}>
        <h3>Pedir repasse</h3>
        <p>Disponível: <b>{brl(saldo)}</b></p>
        <label>Valor (vazio = tudo)<input value={valor} onChange={(e) => setValor(e.target.value.replace(/[^\d,]/g, ""))} placeholder={saldo.toFixed(2).replace(".", ",")} inputMode="decimal" /></label>
        <button className="btn btn-primary" disabled={aberto || saldo <= 0}>{aberto ? "Já há um repasse em andamento" : "Pedir repasse"}</button>
        <p className="parc-sub">O valor de cada venda fica disponível no prazo da forma de pagamento. Se a plataforma usar o repasse automático, ele cai sozinho na sua conta.</p>
      </form>
      <div className="parc-cartao"><h3>Seus repasses</h3>
        {!saques.length ? <p className="parc-sub">Nenhum ainda.</p> : saques.map((s) => (
          <div key={s.id} className="parc-hist"><span>{dt(s.created_at)}<small>{s.origem === "automatico" ? "automático" : "pedido no portal"}</small></span>
            <span className={s.status === "pago" ? "parc-ok" : ""}>{s.status === "pago" ? "Pago" : s.status === "erro" ? `Erro: ${s.erro ?? ""}` : "Processando"} · {brl(s.valor)}</span></div>
        ))}
      </div>
    </div>
  );
}

function Conta({ parceiro, recarregar, setMsg }: { parceiro: any; recarregar: () => void; setMsg: (m: string) => void }) {
  const [c, setC] = useState<any>(parceiro?.conta_recebimento ?? { tipo: "pix", chave_pix: "", chave_pix_tipo: "cnpj", banco: "", agencia: "", conta: "", titular: parceiro?.nome ?? "", documento_titular: parceiro?.documento ?? "" });
  const muda = (k: string) => (e: any) => setC({ ...c, [k]: e.target.value });
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const p = problemaContaBancaria(c); if (p) return setMsg(p);
    await atualizar("parceiros_indicacao", String(parceiro.id), { conta_recebimento: c, updated_at: Date.now() });
    setMsg("Conta para receber salva."); recarregar();
  }
  if (!parceiro) return null;
  return (
    <form className="parc-cartao" style={{ maxWidth: 640 }} onSubmit={salvar}>
      <h3>Conta para receber os repasses</h3>
      <div className="parc-campos">
        <label>Receber por<select value={c.tipo} onChange={muda("tipo")}><option value="pix">Pix</option><option value="conta">Conta corrente</option></select></label>
        {c.tipo === "pix" ? (<>
          <label>Tipo da chave<select value={c.chave_pix_tipo} onChange={muda("chave_pix_tipo")}>{TIPOS_CHAVE_PIX.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}</select></label>
          <label style={{ gridColumn: "1 / -1" }}>Chave Pix<input value={c.chave_pix} onChange={muda("chave_pix")} /></label>
        </>) : (<>
          <label>Banco<input value={c.banco} onChange={muda("banco")} placeholder="Ex.: 001 - Banco do Brasil" /></label>
          <label>Agência<input value={c.agencia} onChange={muda("agencia")} /></label>
          <label>Conta (com dígito)<input value={c.conta} onChange={muda("conta")} /></label>
        </>)}
        <label>Titular<input value={c.titular} onChange={muda("titular")} /></label>
        <label>CPF/CNPJ do titular<input value={c.documento_titular} onChange={muda("documento_titular")} /></label>
      </div>
      <button className="btn btn-primary">Salvar conta</button>
    </form>
  );
}

function Cupons({ sessao, ofertas, recarregar, setMsg }: { sessao: any; ofertas: any[]; recarregar: () => void; setMsg: (m: string) => void }) {
  const [o, setO] = useState({ titulo: "", desconto_tipo: "percentual", desconto_valor: "10", por_mes: "1", regras: "" });
  const [pacote, setPacote] = useState("100");
  const muda = (k: string) => (e: any) => setO({ ...o, [k]: e.target.value });
  async function propor(e: React.FormEvent) {
    e.preventDefault();
    await criarComIdSequencial("ofertas_clube", { titulo: o.titulo, id_parceiros_indicacao: sessao.id, nome_parceiro: sessao.nome, desconto_tipo: o.desconto_tipo, desconto_valor: Number(o.desconto_valor.replace(",", ".")) || 0, brinde: "", regras: o.regras, por_mes: Number(o.por_mes) || 1, validade_dias: 30, uf: "", status: "inativo", aprovacao: "pendente", origem: "portal", created_at: Date.now() });
    setMsg("Oferta enviada para a equipe PetGo aprovar. Você banca o desconto; o cliente só usa pagando pelo app."); setO({ ...o, titulo: "", regras: "" }); recarregar();
  }
  async function comprar() {
    const id = `pacote_${sessao.id}_${Date.now()}`;
    await gravarComId("pedidos_parceiros", id, { id, tipo: "pacote_cupons", id_parceiros_indicacao: sessao.id, nome_parceiro: sessao.nome, quantidade: Number(pacote) || 100, status: "solicitado", created_at: Date.now() });
    setMsg(`Pedido de pacote de ${pacote} cupons enviado. A equipe PetGo confirma o valor e a cobrança.`);
  }
  return (
    <div className="parc-grade">
      <form className="parc-cartao" onSubmit={propor}>
        <h3>Propor uma oferta (cupom)</h3>
        <label>Título<input value={o.titulo} onChange={muda("titulo")} placeholder="Ex.: 15% no banho" required /></label>
        <div className="parc-campos">
          <label>Desconto<select value={o.desconto_tipo} onChange={muda("desconto_tipo")}><option value="percentual">%</option><option value="valor">R$</option></select></label>
          <label>Valor<input value={o.desconto_valor} onChange={muda("desconto_valor")} /></label>
          <label>Por cliente/mês<input value={o.por_mes} onChange={muda("por_mes")} /></label>
        </div>
        <label>Regras<input value={o.regras} onChange={muda("regras")} placeholder="Ex.: de terça a quinta" /></label>
        <button className="btn btn-primary">Enviar para aprovação</button>
        <h3 style={{ marginTop: 16 }}>Comprar pacote de cupons</h3>
        <p className="parc-sub">O PetGo distribui os seus cupons para os clientes da sua região (Clube e trocas de pontos).</p>
        <div className="parc-campos"><label>Quantidade<select value={pacote} onChange={(e) => setPacote(e.target.value)}><option>100</option><option>300</option><option>1000</option></select></label></div>
        <button type="button" className="btn btn-primary" onClick={comprar}>Pedir pacote</button>
      </form>
      <div className="parc-cartao"><h3>Suas ofertas</h3>
        {!ofertas.length ? <p className="parc-sub">Nenhuma ainda.</p> : ofertas.map((x) => (
          <div key={x.id} className="parc-hist"><span>{x.titulo}<small>{x.desconto_tipo === "percentual" ? `${x.desconto_valor}%` : brl(x.desconto_valor)} · {x.por_mes}/mês</small></span>
            <span className={x.status === "ativo" ? "parc-ok" : ""}>{x.status === "ativo" ? "No ar" : x.aprovacao === "pendente" ? "Em análise" : "Pausada"}</span></div>
        ))}
      </div>
    </div>
  );
}
