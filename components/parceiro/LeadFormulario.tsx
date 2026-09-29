"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Send } from "lucide-react";
import Captcha, { type CaptchaHandle } from "@/components/common/Captcha";
import { LeadSchema, TIPOS_EMPRESA, enviarLead, type LeadForm } from "@/lib/leads";
import { ROTULOS_TIPO_EMPRESA } from "@/lib/util";

// Formulário "Quero ser parceiro" → leads_parceiros (origem "site"). O
// comercial vê em Portal Pet → Interessados em ser parceiro e converte em
// empresa (que ainda passa pela aprovação normal).
export default function LeadFormulario() {
  const [captchaOk, setCaptchaOk] = useState(false);
  const captcha = useRef<CaptchaHandle>(null);
  const [enviado, setEnviado] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<LeadForm>({
    resolver: zodResolver(LeadSchema),
    defaultValues: { nome_responsavel: "", nome_empresa: "", tipo_empresa: undefined as any, cnpj: "", email: "", whatsapp: "", municipio: "", uf: "", mensagem: "", aceite_lgpd: false },
  });

  const enviar = handleSubmit(async (dados) => {
    setErroEnvio("");
    if (!captchaOk) { setErroEnvio("Resolva a conta de verificação antes de enviar."); return; }
    try {
      await enviarLead(dados);
      setEnviado(true);
      reset();
    } catch {
      setErroEnvio("Não foi possível enviar agora. Tente de novo em instantes ou fale com a gente pelo WhatsApp.");
    } finally {
      captcha.current?.regenerar();
    }
  });

  if (enviado) {
    return (
      <div className="alerta alerta-ok" role="status">
        <CheckCircle2 size={20} style={{ display: "inline", marginRight: 8, verticalAlign: "-4px" }} />
        <b>Recebemos seu interesse!</b> Nosso time comercial entra em contato em até 2 dias úteis pelo e-mail ou WhatsApp informado.
        <div className="acoes" style={{ marginTop: 14 }}><button type="button" className="btn btn-contorno btn-sm" onClick={() => setEnviado(false)}>Enviar outro cadastro</button></div>
      </div>
    );
  }

  const campo = (nome: keyof LeadForm) => `campo${errors[nome] ? " invalido" : ""}`;
  const erro = (nome: keyof LeadForm) => errors[nome] ? <span className="erro" id={`erro-${nome}`}>{String(errors[nome]?.message)}</span> : null;

  return (
    <form onSubmit={enviar} noValidate className="form-grade">
      <div className={campo("nome_empresa")}>
        <label htmlFor="nome_empresa">Nome do negócio *</label>
        <input id="nome_empresa" {...register("nome_empresa")} aria-invalid={!!errors.nome_empresa} aria-describedby="erro-nome_empresa" autoComplete="organization" />
        {erro("nome_empresa")}
      </div>
      <div className={campo("tipo_empresa")}>
        <label htmlFor="tipo_empresa">Tipo de negócio *</label>
        <select id="tipo_empresa" {...register("tipo_empresa")} aria-invalid={!!errors.tipo_empresa} defaultValue="">
          <option value="" disabled>Selecione…</option>
          {TIPOS_EMPRESA.map((t) => <option key={t} value={t}>{ROTULOS_TIPO_EMPRESA[t]}</option>)}
        </select>
        {erro("tipo_empresa")}
      </div>
      <div className={campo("nome_responsavel")}>
        <label htmlFor="nome_responsavel">Seu nome *</label>
        <input id="nome_responsavel" {...register("nome_responsavel")} aria-invalid={!!errors.nome_responsavel} autoComplete="name" />
        {erro("nome_responsavel")}
      </div>
      <div className={campo("cnpj")}>
        <label htmlFor="cnpj">CNPJ (se tiver)</label>
        <input id="cnpj" {...register("cnpj")} inputMode="numeric" placeholder="00.000.000/0000-00" />
      </div>
      <div className={campo("email")}>
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" {...register("email")} aria-invalid={!!errors.email} autoComplete="email" />
        {erro("email")}
      </div>
      <div className={campo("whatsapp")}>
        <label htmlFor="whatsapp">WhatsApp (com DDD)</label>
        <input id="whatsapp" type="tel" {...register("whatsapp")} aria-invalid={!!errors.whatsapp} autoComplete="tel" placeholder="(92) 99999-9999" />
        {erro("whatsapp")}
      </div>
      <div className={campo("municipio")}>
        <label htmlFor="municipio">Cidade</label>
        <input id="municipio" {...register("municipio")} autoComplete="address-level2" />
      </div>
      <div className={campo("uf")}>
        <label htmlFor="uf">UF</label>
        <input id="uf" {...register("uf")} maxLength={2} autoComplete="address-level1" style={{ textTransform: "uppercase" }} />
        {erro("uf")}
      </div>
      <div className={`${campo("mensagem")} inteiro`}>
        <label htmlFor="mensagem">Conte sobre o seu negócio</label>
        <textarea id="mensagem" rows={4} {...register("mensagem")} placeholder="Serviços, bairros atendidos, quantas unidades…" />
      </div>
      <div className="inteiro">
        <label className="check">
          <input type="checkbox" {...register("aceite_lgpd")} aria-invalid={!!errors.aceite_lgpd} />
          <span>Autorizo o uso destes dados para contato comercial, conforme a <Link href="/paginas/privacidade" style={{ color: "var(--g)", textDecoration: "underline" }}>política de privacidade</Link>. *</span>
        </label>
        {errors.aceite_lgpd && <span className="erro" style={{ color: "#b42318", fontSize: 13 }}>{String(errors.aceite_lgpd.message)}</span>}
      </div>
      <div className="inteiro"><Captcha ref={captcha} onChange={setCaptchaOk} className="campo" /></div>
      {erroEnvio && <div className="inteiro alerta alerta-erro" role="alert">{erroEnvio}</div>}
      <div className="inteiro">
        <button type="submit" className="btn btn-primario" disabled={isSubmitting}><Send size={18} /> {isSubmitting ? "Enviando…" : "Quero ser parceiro"}</button>
      </div>
    </form>
  );
}
