import type { Metadata } from "next";
import PortalPuc from "@/components/site/PortalPuc";

// Central dos pontos que recebem as denúncias (órgãos, ONGs, protetores) — login + a mesma central do painel PetGo360.
export const metadata: Metadata = { title: "Central de denúncias — órgãos, ONGs e protetores", robots: { index: false, follow: false } };

export default function CentralPucPage() {
  return <PortalPuc />;
}
