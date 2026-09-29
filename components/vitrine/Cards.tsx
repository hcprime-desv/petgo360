import Link from "next/link";
import {
  Stethoscope, Bath, Home, Car, Syringe, MapPin, PawPrint, Hospital, Scissors, GraduationCap, Pill, FlaskConical, Heart, Star, Ticket, Crown,
} from "lucide-react";
import type { Beneficio, Categoria, Parceiro } from "@/types/conteudo";
import { ROTULOS_TIPO_EMPRESA, dataCurta, formatarKm } from "@/lib/util";
import { moeda } from "@/lib/data";

// `icone` da categoria (painel → Catálogo → Categorias) é um nome livre;
// os conhecidos viram ícone, o resto cai na pata.
const ICONES: Record<string, any> = {
  stethoscope: Stethoscope, clinica: Stethoscope, bath: Bath, banho: Bath, home: Home, hotel: Home, car: Car, transporte: Car,
  syringe: Syringe, vacina: Syringe, "map-pin": MapPin, domiciliar: MapPin, hospital: Hospital, scissors: Scissors, tosa: Scissors,
  "graduation-cap": GraduationCap, adestramento: GraduationCap, pill: Pill, farmacia: Pill, flask: FlaskConical, laboratorio: FlaskConical, heart: Heart,
};

export function IconeCategoria({ icone, size = 22 }: { icone: string; size?: number }) {
  const Icone = ICONES[icone?.toLowerCase?.()] ?? PawPrint;
  return <Icone size={size} aria-hidden="true" />;
}

export function CardCategoria({ categoria }: { categoria: Categoria }) {
  return (
    <Link href={`/servicos?categoria=${categoria.id}`} className="categoria">
      <div className="foto">
        {categoria.imagemUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={categoria.imagemUrl} alt="" />
        ) : (
          <IconeCategoria icone={categoria.icone} size={34} />
        )}
      </div>
      <div className="corpo">
        <h3>{categoria.nome}</h3>
        <p>{categoria.descricao}</p>
        <span className="card-link">Ver parceiros →</span>
      </div>
    </Link>
  );
}

const iniciais = (nome: string) => nome.split(/\s+/).filter((p) => /[A-Za-zÀ-ú]/.test(p[0] ?? "")).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

export function Nota({ media, quantidade }: { media: number; quantidade: number }) {
  if (!quantidade) return <span className="mut">Novo na rede</span>;
  return (
    <span aria-label={`Nota ${media.toFixed(1)} de 5, ${quantidade} avaliações`}>
      <Star size={14} className="estrela" fill="currentColor" style={{ display: "inline", verticalAlign: "-2px" }} /> <b>{media.toFixed(1)}</b> <span className="mut">({quantidade})</span>
    </span>
  );
}

export function CardParceiro({ parceiro, beneficios = 0, distancia, categorias }: { parceiro: Parceiro; beneficios?: number; distancia?: number | null; categorias?: Categoria[] }) {
  const u = parceiro.unidades[0];
  const bairros = Array.from(new Set(parceiro.unidades.map((x) => x.bairro).filter(Boolean)));
  const nomesCat = (categorias ?? []).filter((c) => parceiro.categorias.includes(c.id)).map((c) => c.nome);
  const aPartir = parceiro.servicos.length ? Math.min(...parceiro.servicos.map((s) => s.valorBase).filter((v) => v > 0)) : Infinity;
  return (
    <Link href={`/parceiros/${parceiro.id}`} className="parceiro">
      <div className="capa">
        {parceiro.capaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={parceiro.capaUrl} alt="" />
        )}
        <div className="logo-p">
          {parceiro.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={parceiro.logoUrl} alt="" />
          ) : iniciais(parceiro.nome)}
        </div>
      </div>
      <div className="corpo">
        <h3>{parceiro.nome}</h3>
        <div className="meta">
          <span>{ROTULOS_TIPO_EMPRESA[parceiro.tipo] ?? "Parceiro"}</span>
          <Nota media={parceiro.avaliacaoMedia} quantidade={parceiro.quantidadeAvaliacoes} />
        </div>
        <div className="meta">
          <MapPin size={13} aria-hidden="true" />
          {u ? `${bairros.slice(0, 2).join(", ")}${bairros.length > 2 ? "…" : ""} — ${u.municipio}/${u.uf}` : ""}
          {typeof distancia === "number" && <b style={{ color: "var(--g)" }}>{formatarKm(distancia)}</b>}
        </div>
        {nomesCat.length > 0 && <div className="servicos-p">{nomesCat.join(" · ")}</div>}
        <div className="rodape-p">
          {Number.isFinite(aPartir) && <span className="selo">a partir de {moeda(aPartir)}</span>}
          {beneficios > 0 && <span className="selo selo-laranja"><Ticket size={12} /> {beneficios} benefício{beneficios > 1 ? "s" : ""}</span>}
        </div>
      </div>
    </Link>
  );
}

export function CardBeneficio({ beneficio, parceiro }: { beneficio: Beneficio; parceiro?: Parceiro }) {
  return (
    <div className="cupom">
      <strong>{beneficio.selo}</strong>
      <span className="titulo-cupom">{beneficio.titulo}</span>
      {parceiro && <Link href={`/parceiros/${parceiro.id}`} className="onde">{parceiro.nome}</Link>}
      {beneficio.descricao && <span className="onde">{beneficio.descricao}</span>}
      <div className="rodape-cupom">
        {beneficio.soMembros
          ? <span className="selo"><Crown size={12} /> Membros do Clube</span>
          : <span className="selo selo-laranja"><Ticket size={12} /> Cupom OFF{beneficio.restantes !== null ? ` · ${beneficio.restantes} restantes` : ""}</span>}
        {beneficio.fimEm && <span className="selo">até {dataCurta(beneficio.fimEm)}</span>}
      </div>
    </div>
  );
}
