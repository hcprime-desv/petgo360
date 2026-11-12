"use client";

// Página do QR PERMANENTE do passaporte do pet (/p/<token>). Quem acha o pet lê o QR impresso e vê SÓ a identificação
// (foto, nome, espécie/raça, nº do passaporte) — nada de saúde nem telefone do tutor. "Encontrei este pet" grava o contato
// de quem achou em `passaportes_avisos` e o back-end petall360 avisa o tutor no app e no WhatsApp. Vacinas e saúde
// continuam no QR temporário do veterinário (/c/<token>).
import { useEffect, useState } from "react";
import { CheckCircle2, MapPin, PawPrint } from "lucide-react";
import { getDocOnce, gravarComId } from "@/lib/firebase/gen";

const digitos = (s: string) => s.replace(/\D/g, "");

export default function PassaportePublico({ token }: { token: string }) {
  const [pet, setPet] = useState<any | null | undefined>(undefined);
  const [aberto, setAberto] = useState(false);
  const [f, setF] = useState({ nome: "", telefone: "", onde: "", mensagem: "" });
  const [local, setLocal] = useState<{ latitude: number; longitude: number } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);

  useEffect(() => { getDocOnce("passaportes_publicos", token).then((d) => setPet(d && d.status !== "inativo" ? d : null)).catch(() => setPet(null)); }, [token]);

  const pegarLocal = () => navigator.geolocation?.getCurrentPosition((p) => setLocal({ latitude: p.coords.latitude, longitude: p.coords.longitude }), () => setErro("Não consegui pegar a localização — escreva onde o pet está."));
  const enviar = async () => {
    setErro("");
    if (digitos(f.telefone).length < 10) return setErro("Informe um telefone com DDD para o tutor falar com você.");
    setEnviando(true);
    try {
      const id = `site_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await gravarComId("passaportes_avisos", id, {
        id, token, nome: f.nome.trim().slice(0, 80), telefone: digitos(f.telefone).slice(0, 13), onde: f.onde.trim().slice(0, 200), mensagem: f.mensagem.trim().slice(0, 500),
        latitude: local?.latitude ?? null, longitude: local?.longitude ?? null, status: "pendente", canal: "site", created_at: Date.now(),
      });
      setEnviado(true);
    } catch { setErro("Não foi possível enviar agora. Tente de novo em instantes."); }
    setEnviando(false);
  };

  const topo = <div className="vet-topo"><span className="marca">PetGo360 · Passaporte do pet</span></div>;
  if (pet === undefined) return <div className="vet">{topo}<div className="card">Abrindo o passaporte…</div></div>;
  if (!pet) return <div className="vet">{topo}<div className="erro-box">Passaporte não encontrado.</div></div>;

  return (
    <div className="vet">
      {topo}
      <div className="card">
        <div className="ficha">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {pet.foto_url ? <img src={pet.foto_url} alt={pet.nome} /> : <span className="sem-foto"><PawPrint size={36} /></span>}
          <div>
            <h1>{pet.nome}</h1>
            <p>{[pet.especie, pet.raca, pet.sexo === "macho" ? "Macho" : pet.sexo === "femea" ? "Fêmea" : ""].filter(Boolean).join(" · ")}</p>
            <p className="texto-mut">Passaporte nº {pet.numero}</p>
          </div>
        </div>
      </div>

      {enviado ? (
        <div className="ok-box"><CheckCircle2 size={18} style={{ display: "inline", verticalAlign: "-3px" }} /> Obrigado! O tutor de {pet.nome} foi avisado e vai falar com você pelo telefone informado.</div>
      ) : (
        <div className="card">
          <h2>Encontrou {pet.nome}?</h2>
          <p className="texto-mut">Deixe o seu contato: avisamos o tutor na hora, pelo app e pelo WhatsApp. O telefone dele não aparece aqui.</p>
          {!aberto ? (
            <button type="button" className="btn btn-primary" onClick={() => setAberto(true)}><PawPrint size={18} /> Encontrei este pet</button>
          ) : (
            <>
              <div className="grade-form">
                <label className="campo">Seu nome<input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></label>
                <label className="campo">Seu telefone (WhatsApp) *<input value={f.telefone} inputMode="tel" placeholder="(92) 99999-9999" onChange={(e) => setF({ ...f, telefone: e.target.value })} /></label>
                <label className="campo largo">Onde o pet está<input value={f.onde} placeholder="Bairro, rua ou ponto de referência" onChange={(e) => setF({ ...f, onde: e.target.value })} /></label>
                <label className="campo largo">Mensagem para o tutor<textarea rows={3} value={f.mensagem} onChange={(e) => setF({ ...f, mensagem: e.target.value })} /></label>
              </div>
              <div className="acoes-form" style={{ marginTop: 12 }}>
                <button type="button" className="btn btn-outline" onClick={pegarLocal}><MapPin size={16} /> {local ? "Localização incluída" : "Incluir minha localização"}</button>
                <button type="button" className="btn btn-primary" onClick={enviar} disabled={enviando}>{enviando ? "Enviando…" : "Avisar o tutor"}</button>
              </div>
            </>
          )}
          {erro ? <div className="erro-box" style={{ marginTop: 12 }}>{erro}</div> : null}
        </div>
      )}
      <p className="texto-mut" style={{ textAlign: "center", fontSize: 13 }}>PetGo360 — o passaporte de saúde do seu pet · petgo360.com.br</p>
    </div>
  );
}
