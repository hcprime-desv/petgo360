// Utilitários do site: distância, WhatsApp e rótulos.

// Haversine — mesma conta do painel (petGo360 shared/shemas/petgo360/_endereco.ts#distanciaKm).
export function distanciaKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 6371;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const formatarKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`);

// Reserva é pelo app ou pelo WhatsApp (bot) — o site não tem checkout.
export function linkWhatsapp(numero: string, texto: string): string | null {
  const n = numero.replace(/\D/g, "");
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(texto)}`;
}

export const ROTULOS_TIPO_EMPRESA: Record<string, string> = {
  clinica_veterinaria: "Clínica veterinária", hospital_veterinario: "Hospital veterinário", consultorio_veterinario: "Consultório veterinário",
  pet_shop: "Pet shop", hotel_creche: "Hotel e creche", banho_tosa: "Banho e tosa", adestramento: "Adestramento",
  transporte_pet: "Transporte pet", profissional_autonomo: "Profissional autônomo", outro: "Outro",
};

export const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const dataCurta = (msData: number | null) => (msData ? new Date(msData).toLocaleDateString("pt-BR") : "");

export const ehExterno = (href: string) => /^https?:\/\//.test(href);
