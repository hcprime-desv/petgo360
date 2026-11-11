"use client";

// Chat flutuante do site no MESMO MOTOR do WhatsApp (chatbot do PetGo360, fila e atendente), no desenho do celular e com a
// cor do site. Liga com NEXT_PUBLIC_CHAT_PATH e "Mostrar o chat no site" (Configuração do site).
import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import ChatMotor from "@/components/chat/ChatMotor";
import { motorChat } from "@/lib/chatMotor";
import { useConfigSite } from "@/lib/siteAoVivo";
import type { ConfigSite } from "@/lib/site";

export default function ChatSite({ config }: { config: ConfigSite }) {
  const c = useConfigSite(config);
  const [aberto, setAberto] = useState(false);
  if (!motorChat || !c.chatAtivo) return null;
  const alternar = () => setAberto((v) => !v);
  return (
    <>
      <button className="chat-launch" onClick={alternar} aria-label={aberto ? "Fechar chat" : `Abrir: ${c.chatTitulo}`} aria-expanded={aberto}>
        {!aberto && <span className="chat-launch-balao">{c.chatTitulo}</span>}
        {aberto ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
      {aberto ? (
        <div role="dialog" aria-label={c.chatTitulo} style={{ position: "fixed", right: 20, bottom: 96, zIndex: 60, width: "min(380px, calc(100vw - 24px))" }}>
          <ChatMotor motor={motorChat} corSite="var(--blue, #0f766e)" celular={{ nome: c.chatTitulo, aoFechar: alternar, altura: 620 }} />
        </div>
      ) : null}
    </>
  );
}
