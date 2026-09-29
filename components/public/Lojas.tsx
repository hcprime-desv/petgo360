import { Apple, Play } from "lucide-react";
import type { Configuracao } from "@/types/conteudo";

// Botões das lojas (links em Portal Pet → Configuração do site). Sem link
// cadastrado o botão aparece como "em breve", sem levar a lugar nenhum.
export default function Lojas({ configuracao }: { configuracao: Configuracao }) {
  const lojas = [
    { url: configuracao.appStoreUrl, icone: <Apple size={24} />, pequeno: "Baixar na", nome: "App Store" },
    { url: configuracao.googlePlayUrl, icone: <Play size={22} />, pequeno: "Disponível no", nome: "Google Play" },
  ];
  return (
    <div className="lojas">
      {lojas.map((l) =>
        l.url ? (
          <a key={l.nome} href={l.url} target="_blank" rel="noreferrer" className="loja">{l.icone}<span><small>{l.pequeno}</small><b>{l.nome}</b></span></a>
        ) : (
          <span key={l.nome} className="loja breve" aria-disabled="true">{l.icone}<span><small>Em breve na</small><b>{l.nome}</b></span></span>
        ),
      )}
    </div>
  );
}
