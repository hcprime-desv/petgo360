// "Quero ser parceiro" → dados/{tenant}/leads_parceiros. Mesmas regras do
// LeadParceiroShema do painel (petGo360 shared/shemas/petgo360): ao menos um
// contato, aceite de LGPD obrigatório para origem "site". O comercial trata
// o lead em Portal Pet → Interessados em ser parceiro (converte em empresa).
import { z } from "zod";
import { criarComIdSequencial } from "@/lib/firebase/gen";

export const TIPOS_EMPRESA = [
  "clinica_veterinaria", "hospital_veterinario", "consultorio_veterinario", "pet_shop",
  "hotel_creche", "banho_tosa", "adestramento", "transporte_pet", "profissional_autonomo", "outro",
] as const;

const soDigitos = (v: string) => v.replace(/\D/g, "");

export const LeadSchema = z
  .object({
    nome_responsavel: z.string().trim().min(2, "Informe seu nome").max(120),
    nome_empresa: z.string().trim().min(2, "Informe o nome do negócio").max(150),
    tipo_empresa: z.enum(TIPOS_EMPRESA, { errorMap: () => ({ message: "Escolha o tipo de negócio" }) }),
    cnpj: z.string().trim().max(18).default(""),
    email: z.string().trim().max(150).refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "E-mail inválido").default(""),
    whatsapp: z.string().trim().max(20).default(""),
    municipio: z.string().trim().max(80).default(""),
    uf: z.string().trim().max(2, "UF com 2 letras").default(""),
    mensagem: z.string().trim().max(2000).default(""),
    aceite_lgpd: z.boolean().refine((v) => v, "É preciso aceitar a política de privacidade"),
  })
  .superRefine((d, ctx) => {
    if (!d.email && !soDigitos(d.whatsapp)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["email"], message: "Informe e-mail ou WhatsApp" });
    if (d.whatsapp && soDigitos(d.whatsapp).length < 10) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["whatsapp"], message: "WhatsApp com DDD" });
  });

export type LeadForm = z.input<typeof LeadSchema>;

export async function enviarLead(form: LeadForm): Promise<string> {
  const d = LeadSchema.parse(form);
  const agora = new Date();
  return criarComIdSequencial("leads_parceiros", {
    nome_responsavel: d.nome_responsavel,
    nome_empresa: d.nome_empresa,
    tipo_empresa: d.tipo_empresa,
    cnpj: d.cnpj,
    email: d.email || null,
    telefone: "",
    whatsapp: soDigitos(d.whatsapp),
    municipio: d.municipio,
    uf: d.uf.toUpperCase(),
    mensagem: d.mensagem || null,
    origem: "site",
    aceite_lgpd: true,
    aceite_em: agora,
    status: "novo",
    observacoes: null,
    contatado_em: null,
    convertido_em: null,
    id_empresas: null,
    recebido_em: agora,
  });
}
