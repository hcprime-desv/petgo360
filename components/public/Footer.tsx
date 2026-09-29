"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Instagram, Facebook, Youtube, Linkedin, Music2, Mail, Phone, MessageCircle, MapPin } from "lucide-react";
import type { Configuracao, Pagina } from "@/types/conteudo";
import { linkWhatsapp } from "@/lib/util";
import { subscribePaginasPublicadas } from "@/lib/data";
import { useConfiguracao } from "./AoVivo";

// Número para o link de ligação: 0800 cadastrado sem o zero (ex.: 8000923400)
// precisa do 0 na frente para discar.
const telDiscavel = (t: string) => {
  const d = t.replace(/\D/g, "");
  return /^800\d{7}$/.test(d) ? `0${d}` : d;
};

const ICONES_REDE = { instagram: Instagram, facebook: Facebook, youtube: Youtube, linkedin: Linkedin, tiktok: Music2 };
const NOMES_REDE = { instagram: "Instagram", facebook: "Facebook", youtube: "YouTube", linkedin: "LinkedIn", tiktok: "TikTok" };

// Rodapé: institucional, suporte, termos/privacidade/LGPD (páginas com
// local "rodape" no painel, em tempo real), redes sociais e acesso.
export default function Footer({ paginasIniciais }: { paginasIniciais: Pagina[] }) {
  const c = useConfiguracao();
  const [paginas, setPaginas] = useState<Pagina[]>(paginasIniciais);
  useEffect(() => subscribePaginasPublicadas(setPaginas), []);
  const doRodape = paginas.filter((p) => p.local === "rodape");
  const whats = linkWhatsapp(c.whatsapp, `Olá! Vim pelo site do ${c.nomeSite}.`);
  return (
    <footer className="rodape">
      <div className="wrap">
        <div className="rodape-grade">
          <div>
            <h4>{c.nomeSite}</h4>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{c.textoRodape || c.slogan}</p>
            {c.redes.length > 0 && (
              <div className="redes">
                {c.redes.map((r) => {
                  const Icone = ICONES_REDE[r.rede];
                  return <a key={r.rede} href={r.url} target="_blank" rel="noreferrer" aria-label={NOMES_REDE[r.rede]}><Icone size={18} /></a>;
                })}
              </div>
            )}
          </div>
          <div>
            <h4>Para você</h4>
            <Link href="/servicos">Buscar serviços</Link>
            <Link href="/clube">Clube Pet</Link>
            <Link href="/parceiros">Parceiros</Link>
            <Link href="/petgo360">App PetGo360</Link>
          </div>
          <div>
            <h4>Institucional</h4>
            {doRodape.map((p) => <Link key={p.id} href={`/paginas/${p.slug}`}>{p.titulo}</Link>)}
            <Link href="/quero-ser-parceiro">Quero ser parceiro</Link>
            <Link href="/entrar">Área do Parceiro</Link>
          </div>
          <div>
            <h4>Suporte</h4>
            {whats && <a href={whats} target="_blank" rel="noreferrer"><MessageCircle size={14} style={{ display: "inline", marginRight: 6 }} />WhatsApp</a>}
            {c.telefone && <a href={`tel:${telDiscavel(c.telefone)}`}><Phone size={14} style={{ display: "inline", marginRight: 6 }} />{c.telefone}</a>}
            {c.email && <a href={`mailto:${c.email}`}><Mail size={14} style={{ display: "inline", marginRight: 6 }} />{c.email}</a>}
            {c.endereco && <span style={{ display: "block", padding: "4px 0" }}><MapPin size={14} style={{ display: "inline", marginRight: 6 }} />{c.endereco}</span>}
          </div>
        </div>
        <div className="base">
          <span suppressHydrationWarning>© {new Date().getFullYear()} {c.nomeSite}. Todos os direitos reservados.</span>
          <span>{c.slogan}</span>
        </div>
      </div>
    </footer>
  );
}
