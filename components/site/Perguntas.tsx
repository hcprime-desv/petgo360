"use client";

// Perguntas frequentes do /admin (busca + duas colunas, layout do site padrão). Sem perguntas publicadas, a seção some.
import { useState } from "react";
import Markdown from "@/components/public/Markdown";
import { usePerguntas } from "@/lib/siteAoVivo";

export default function Perguntas() {
  const perguntas = usePerguntas();
  const [busca, setBusca] = useState("");
  if (!perguntas.length) return null;
  const termo = busca.trim().toLowerCase();
  const lista = termo ? perguntas.filter((p) => `${p.pergunta} ${p.resposta} ${p.categoria}`.toLowerCase().includes(termo)) : perguntas;
  return (
    <section className="section" id="perguntas">
      <div className="container">
        <div className="section-head">
          <div><div className="eyebrow">Perguntas frequentes</div><h2>Ficou com <span className="destaque">dúvida?</span></h2></div>
          <p>As respostas mais procuradas por tutores e veterinários.</p>
        </div>
        <label className="busca-faq">
          <span className="sr">Buscar nas perguntas</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por palavra-chave" />
        </label>
        <div className="faq">
          {lista.map((p, i) => <details key={p.id} open={i === 0 && !busca}><summary>{p.pergunta}</summary><div className="markdown-body"><Markdown>{p.resposta}</Markdown></div></details>)}
        </div>
        {lista.length === 0 && <div className="notice">Não achamos nada com “{busca}”. Fale com a gente pelo chat ou pelo formulário abaixo.</div>}
      </div>
    </section>
  );
}
