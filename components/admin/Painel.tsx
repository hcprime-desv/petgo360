"use client";
// CÓPIA gerada por scripts/copiar-admin-site.py — NÃO edite aqui: altere em packages/layout/src/sites/admin e copie de novo.

// /admin dos SITES — Painel: um cartão por cadastro que o usuário pode abrir (quantidade de registros, ao vivo).
import Link from "next/link";
import { useEffect, useState } from "react";
import { ouvir } from "@/lib/admin/banco";
import { pode } from "@/lib/admin/sessao";
import { SITE_ADMIN } from "@/lib/admin/site";
import { useAdmin, useTituloAdmin } from "./AdminShell";

function Cartao({ id, titulo, colecao, icone }: { id: string; titulo: string; colecao: string; icone: React.ReactNode }) {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => { try { return ouvir(colecao, (d) => setN(d.length)); } catch { setN(0); } }, [colecao]);
  return (
    <Link href={`/admin/${id}`} className="card kpi adm-kpi">
      <span className="adm-kpi-ic">{icone}</span>
      <div><strong>{n ?? "…"}</strong><span>{titulo}</span></div>
    </Link>
  );
}

export default function Painel() {
  useTituloAdmin("Painel");
  const { sessao } = useAdmin();
  const icones = new Map(SITE_ADMIN.menu.flatMap((g) => g.itens.map((i) => [i.href, i.icone] as const)));
  const visiveis = SITE_ADMIN.cadastros.filter((c) => !c.unico && pode(sessao, c.permissao));
  const Extra = SITE_ADMIN.PainelExtra;
  return (
    <>
      {Extra && <Extra />}
      <p className="texto-mut" style={{ margin: 0 }}>
        Tudo o que você salvar aqui aparece no site na mesma hora. O mesmo conteúdo também pode ser gerenciado pelo painel AdmSite360.
      </p>
      <div className="kpis">{visiveis.map((c) => <Cartao key={c.id} id={c.id} titulo={c.titulo} colecao={c.colecao} icone={icones.get(`/admin/${c.id}`)} />)}</div>
    </>
  );
}
