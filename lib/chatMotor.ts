// Chat do site no MESMO MOTOR do WhatsApp (componente do monorepo, copiado por scripts/copiar-chat-site.py): chatbot do
// PetGo360 (Chatbot Builder), mesma fila e mesmo atendente. Tenant = NEXT_PUBLIC_CHAT_PATH (ex.: dados/PETGO360 — o back-end
// petall360 atende o canal site); sem ela, o chat não aparece.
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebase/client";
import { criarMotorSite } from "@/components/chat/motorSite";

const TENANT = process.env.NEXT_PUBLIC_CHAT_PATH;
async function upload(f: File): Promise<string> {
  const r = ref(storage, `chat_site/${Date.now()}_${f.name}`);
  await uploadBytes(r, f);
  return getDownloadURL(r);
}

export const motorChat = TENANT ? criarMotorSite({ db, tenant: TENANT, upload, chaveLocal: "petgo360_contato_chat" }) : null;
