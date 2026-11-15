// GERADO por "npm run sync:app" no painel (projetos/petGo360) para o site público (site/petGo), a partir de
// shared/compartilhado/guiaPet.ts — NÃO EDITAR AQUI: altere no painel e sincronize.

// GUIA PET (dono, 15/11/2026): busca "tipo Google" de tudo do mundo animal — veterinário, hospital 24 h, pet shop, banho e tosa,
// hotel/creche, adestrador, farmácia veterinária, ONG/adoção — num MAPA, no app e no site. Tocar num lugar mostra o TRAJETO com
// distância e tempo, telefone, WhatsApp, endereço, horário e nota, e abre a navegação no Google Maps ou no Waze.
// • Os lugares vêm do Google Places (a chave fica SÓ no back-end petall360 — o app e o site gravam um PEDIDO em `guia_buscas` e o
//   back-end responde). O trajeto (Routes API) só é calculado no toque — a lista usa a distância em linha reta (grátis).
// • "PARCEIRO PETGO" aparece PRIMEIRO, com selo: os parceiros do Programa de indicação (`parceiros_indicacao`) marcados "No Guia",
//   com endereço e coordenadas (aba "Guia (mapa)" do painel). O mesmo lugar vindo do Google não se repete.
// • Cotas por mês (`cotas.ts`): `guia_buscas` e `guia_rotas`; visitante do site sem conta conta como "grátis" por navegador.
// • Pelas regras do Google, o resultado NÃO vira cadastro: o pedido é apagado pelo back-end depois de 24 h.
// TS puro (sync:app → app e site; cópia no back-end em src/produtos/petgo360/guia/regras.ts).

export const COLECAO_GUIA = "guia_buscas";
export const RAIO_PADRAO_KM = 10;
export const HORAS_GUARDA_PEDIDO = 24;

export type CategoriaGuia = { id: string; rotulo: string; icone: string; consulta: string; cor: string };
/** Atalhos da busca (ícone = MaterialCommunityIcons no app; consulta = o que vai para o Google). */
export const CATEGORIAS_GUIA: CategoriaGuia[] = [
  { id: "veterinario", rotulo: "Veterinário", icone: "stethoscope", consulta: "clínica veterinária", cor: "#6B46C1" },
  { id: "hospital_24h", rotulo: "Hospital 24 h", icone: "hospital-box-outline", consulta: "hospital veterinário 24 horas", cor: "#EA534A" },
  { id: "pet_shop", rotulo: "Pet shop", icone: "storefront-outline", consulta: "pet shop", cor: "#06B197" },
  { id: "banho_tosa", rotulo: "Banho e tosa", icone: "shower-head", consulta: "banho e tosa pet", cor: "#2B8CD6" },
  { id: "hotel_creche", rotulo: "Hotel e creche", icone: "home-heart", consulta: "hotel e creche para cachorro", cor: "#E89B1C" },
  { id: "adestrador", rotulo: "Adestrador", icone: "whistle-outline", consulta: "adestrador de cães", cor: "#8B5A2B" },
  { id: "farmacia", rotulo: "Farmácia vet", icone: "pill", consulta: "farmácia veterinária", cor: "#C2185B" },
  { id: "ong", rotulo: "ONG e adoção", icone: "hand-heart-outline", consulta: "ONG proteção animal adoção de animais", cor: "#3F7D20" },
];
export const categoriaGuia = (id: any) => CATEGORIAS_GUIA.find((c) => c.id === id) ?? null;
/** Pino do Parceiro PetGo: MAIOR, com anel dourado e estrela (a cor continua a da categoria). */
export const COR_PARCEIRO = "#F5B700";
export const COR_SEM_CATEGORIA = "#64748B";

/** Categoria de um lugar do Google pelo tipo/nome (para a cor do pino); sem pista = a categoria buscada. */
export function categoriaDoGoogle(tipos: string[] | null | undefined, nome: string, buscada: string | null): string | null {
  const t = (tipos ?? []).join(" ");
  const n = String(nome ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/24 ?h|24 horas|hospital/.test(n)) return "hospital_24h";
  if (/farmacia|drogaria/.test(n)) return "farmacia";
  if (/banho|tosa|groom/.test(n)) return "banho_tosa";
  if (/hotel|creche|hospedagem|daycare/.test(n)) return "hotel_creche";
  if (/adestra/.test(n)) return "adestrador";
  if (/\bong\b|protetor|adocao|abrigo|resgate/.test(n)) return "ong";
  if (/veterinary_care/.test(t) || /veterin|\bvet\b|clinica/.test(n)) return buscada === "hospital_24h" ? "hospital_24h" : "veterinario";
  if (/pet_store/.test(t) || /pet ?shop|racao|agropet/.test(n)) return buscada === "banho_tosa" ? "banho_tosa" : "pet_shop";
  return buscada;
}

export type Ponto = { latitude: number; longitude: number };
export type LugarGuia = {
  id: string;                 // "g:<place_id>" (Google) ou "p:<id do parceiro>"
  placeId: string | null;
  nome: string;
  endereco: string;
  latitude: number;
  longitude: number;
  telefone: string;
  whatsapp: string;
  site: string;
  nota: number | null;
  avaliacoes: number;
  abertoAgora: boolean | null;
  horarios: string[];         // "segunda-feira: 08:00–18:00"...
  tipo: string;               // "Clínica veterinária", "Pet shop"...
  categoria: string | null;   // id de CATEGORIAS_GUIA — dá a COR e o ÍCONE do pino
  linkGoogle: string;
  parceiro: boolean;          // Parceiro PetGo (aparece primeiro, com selo)
  descricao: string;
  distanciaKm: number | null;
};
export type ResultadoBusca = { lugares: LugarGuia[]; avisos: string[] };
export type ResultadoRota = { distanciaM: number; duracaoS: number; polyline: string };

// ── distância e ordem ─────────────────────────────────────────────────────
export function distanciaKm(a: Ponto | null | undefined, b: Ponto | null | undefined): number | null {
  if (!a || !b || !isFinite(a.latitude) || !isFinite(b.latitude)) return null;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude), dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
export const textoDistancia = (km: number | null | undefined) =>
  km === null || km === undefined ? "" : km < 1 ? `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m` : `${km.toFixed(km < 10 ? 1 : 0).replace(".", ",")} km`;
export function textoDuracao(segundos: number | null | undefined): string {
  const min = Math.max(1, Math.round(Number(segundos || 0) / 60));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ""}`;
}
const semAcento = (s: any) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/** Parceiros PetGo primeiro (por distância), depois os demais por distância; o mesmo lugar do Google não se repete. */
export function juntarResultados(parceiros: LugarGuia[], google: LugarGuia[], origem: Ponto | null): LugarGuia[] {
  const comDist = (l: LugarGuia) => ({ ...l, distanciaKm: distanciaKm(origem, l) });
  const ps = parceiros.map(comDist);
  const repetido = (g: LugarGuia) => ps.some((p) => (p.placeId && g.placeId && p.placeId === g.placeId)
    || (semAcento(p.nome) === semAcento(g.nome) && (distanciaKm(p, g) ?? 99) < 0.2));
  const gs = google.filter((g) => !repetido(g)).map(comDist);
  const porDist = (a: LugarGuia, b: LugarGuia) => (a.distanciaKm ?? 9e9) - (b.distanciaKm ?? 9e9);
  return [...ps.sort(porDist), ...gs.sort(porDist)];
}

// ── parceiros PetGo no Guia ───────────────────────────────────────────────
const num = (v: any) => (v === null || v === undefined || v === "" ? NaN : Number(String(v).replace(",", ".")));
/** O parceiro aparece no Guia? (ativo, "No Guia" = sim e com coordenadas válidas) */
export function parceiroNoGuia(p: any): boolean {
  return p?.status === "ativo" && (p?.no_guia === true || p?.no_guia === "sim") && isFinite(num(p?.latitude)) && isFinite(num(p?.longitude));
}
export const categoriasDoParceiro = (p: any): string[] =>
  (Array.isArray(p?.categorias_guia) ? p.categorias_guia : String(p?.categorias_guia ?? "").split(/[,;]/)).map((x: any) => String(x).trim()).filter(Boolean);

/** O parceiro entra nesta busca? (categoria marcada OU texto que bate com nome/descrição/categoria; dentro do raio) */
export function parceiroCasaBusca(p: any, b: { categoria?: string | null; texto?: string | null; origem?: Ponto | null; raioKm?: number }): boolean {
  if (!parceiroNoGuia(p)) return false;
  const d = distanciaKm(b.origem ?? null, { latitude: num(p.latitude), longitude: num(p.longitude) });
  if (d !== null && d > (b.raioKm ?? RAIO_PADRAO_KM) * 1.5) return false;
  const cats = categoriasDoParceiro(p);
  if (b.categoria) return cats.includes(b.categoria);
  const t = semAcento(b.texto);
  if (!t) return true;
  const alvo = semAcento([p.nome, p.descricao_guia, ...cats.map((c) => categoriaGuia(c)?.rotulo ?? c)].join(" "));
  return t.split(" ").filter((w) => w.length >= 3).some((w) => alvo.includes(w));
}
export function parceiroParaLugar(p: any): LugarGuia {
  const cats = categoriasDoParceiro(p);
  return {
    id: `p:${p.id}`, placeId: String(p.place_id ?? "").trim() || null, nome: String(p.nome ?? ""), endereco: String(p.endereco ?? [p.cidade, p.uf].filter(Boolean).join(" - ")),
    latitude: num(p.latitude), longitude: num(p.longitude), telefone: String(p.telefone ?? ""), whatsapp: String(p.whatsapp ?? p.telefone ?? ""),
    site: String(p.site ?? p.instagram ?? ""), nota: null, avaliacoes: 0, abertoAgora: null,
    horarios: String(p.horario_guia ?? "").split(/\n|;/).map((x) => x.trim()).filter(Boolean),
    tipo: cats.map((c) => categoriaGuia(c)?.rotulo ?? c).join(" · ") || "Parceiro PetGo", categoria: cats[0] ?? null, linkGoogle: "", parceiro: true,
    descricao: String(p.descricao_guia ?? ""), distanciaKm: null,
  };
}

// ── links de navegação (grátis) ───────────────────────────────────────────
const digitos = (s: any) => String(s ?? "").replace(/\D/g, "");
export function linksLugar(l: LugarGuia) {
  const dest = `${l.latitude},${l.longitude}`;
  const w = digitos(l.whatsapp);
  const zap = w.length >= 10 ? (w.length <= 11 ? `55${w}` : w) : "";
  return {
    googleMaps: l.placeId
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(l.nome)}&destination_place_id=${encodeURIComponent(l.placeId)}`
      : `https://www.google.com/maps/dir/?api=1&destination=${dest}`,
    waze: `https://waze.com/ul?ll=${dest}&navigate=yes`,
    telefone: digitos(l.telefone) ? `tel:${digitos(l.telefone)}` : "",
    whatsapp: zap && l.parceiro ? `https://wa.me/${zap}?text=${encodeURIComponent("Olá! Encontrei vocês no Guia do PetGo360.")}` : "",
    site: /^https?:\/\//i.test(l.site) ? l.site : "",
  };
}

// ── polyline do Google → pontos (para desenhar o trajeto) ─────────────────
export function decodificarPolyline(codigo: string): Ponto[] {
  const pts: Ponto[] = [];
  let i = 0, lat = 0, lng = 0;
  while (i < (codigo ?? "").length) {
    for (const eixo of [0, 1]) {
      let res = 0, sh = 0, b: number;
      do { b = codigo.charCodeAt(i++) - 63; res |= (b & 0x1f) << sh; sh += 5; } while (b >= 0x20 && i <= codigo.length);
      const d = res & 1 ? ~(res >> 1) : res >> 1;
      if (eixo === 0) lat += d; else lng += d;
    }
    pts.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return pts;
}

// ── pedido (app/site → back-end) ──────────────────────────────────────────
export function planejarBusca(p: { texto?: string; categoria?: string | null; origem: Ponto; raioKm?: number; idClientes?: string | null; chaveOrigem?: string | null; canal: "app" | "site"; agora?: number }) {
  const texto = String(p.texto ?? "").trim().slice(0, 80);
  const cat = categoriaGuia(p.categoria);
  if (!texto && !cat) throw new Error("Digite o que procura ou escolha uma categoria.");
  if (!p.origem || !isFinite(p.origem.latitude) || !isFinite(p.origem.longitude)) throw new Error("Não sei onde você está. Libere a localização ou escolha a cidade.");
  return {
    tipo: "busca", status: "pedido", canal: p.canal, texto, categoria: cat?.id ?? null,
    origem: { latitude: p.origem.latitude, longitude: p.origem.longitude }, raio_km: Math.min(50, Math.max(1, p.raioKm ?? RAIO_PADRAO_KM)),
    id_clientes: p.idClientes ? String(p.idClientes) : null, chave_origem: p.chaveOrigem ?? null, created_at: p.agora ?? Date.now(),
  };
}
export function planejarRota(p: { origem: Ponto; lugar: LugarGuia; idClientes?: string | null; chaveOrigem?: string | null; canal: "app" | "site"; agora?: number }) {
  return {
    tipo: "rota", status: "pedido", canal: p.canal, origem: { latitude: p.origem.latitude, longitude: p.origem.longitude },
    destino: { latitude: p.lugar.latitude, longitude: p.lugar.longitude }, nome_destino: p.lugar.nome,
    id_clientes: p.idClientes ? String(p.idClientes) : null, chave_origem: p.chaveOrigem ?? null, created_at: p.agora ?? Date.now(),
  };
}
