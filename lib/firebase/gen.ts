// Camada de dados do site PetHub360, no mesmo padrão do `shared/gen/gen.ts`
// do painel (petGo360): getAll com onSnapshot, id sequencial via
// dados/{tenant}/incrementKey/{colecao}.
//
// O tenant é fixo por implantação: `NEXT_PUBLIC_PETHUB_PATH` (env,
// case-sensitive — o mesmo `path` do cliente PetGo360/Portal Pet na coleção
// `cliente` do painel). Sem valor padrão de propósito: nunca ler/gravar no
// tenant errado por engano.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./client";

const TENANT_PATH = process.env.NEXT_PUBLIC_PETHUB_PATH;

function tenantColRef(colecao: string) {
  if (!TENANT_PATH) {
    throw new Error(
      "NEXT_PUBLIC_PETHUB_PATH não configurado — defina no .env.local (ou nas env vars do deploy) qual é o tenant deste site antes de ler/gravar no Firestore.",
    );
  }
  return collection(db, `dados/${TENANT_PATH}/${colecao}`);
}

// Listener em tempo real de uma coleção inteira — mesmo formato do
// `getAll` do hcCore.
export function getAll(colecao: string, callback: (docs: any[]) => void): Unsubscribe {
  return onSnapshot(tenantColRef(colecao), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Leitura pontual (sem listener) — usada quando não precisa ficar
// "escutando" mudanças, só ler uma vez (ex: páginas de conteúdo público).
export async function getAllOnce(colecao: string): Promise<any[]> {
  const snap = await getDocs(tenantColRef(colecao));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getDocOnce(colecao: string, id: string): Promise<any | null> {
  const snap = await getDoc(doc(tenantColRef(colecao), id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Listener em tempo real de um único doc — usado por quem já tem o id em
// mãos (ex: acompanhamento de denúncia por protocolo) e quer ver mudanças
// de status feitas na apuração operacional sem precisar recarregar.
export function getDocOn(colecao: string, id: string, callback: (doc: any | null) => void): Unsubscribe {
  return onSnapshot(doc(tenantColRef(colecao), id), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

// Cria um documento com id sequencial — mesma mecânica do `onSaveIncrement`
// do painel (transação em incrementKey/{colecao}, id = número em texto,
// created_at/updated_at carimbados). Usado pelo formulário "Quero ser
// parceiro" (leads_parceiros), pra o lead nascer igual a um criado no painel.
export async function criarComIdSequencial(colecao: string, data: Record<string, any>): Promise<string> {
  if (!TENANT_PATH) throw new Error("NEXT_PUBLIC_PETHUB_PATH não configurado.");
  const counterRef = doc(db, `dados/${TENANT_PATH}/incrementKey`, colecao);
  const id = await runTransaction(db, async (t) => {
    const snap = await t.get(counterRef);
    const proximo = ((snap.data()?.countKey as number | undefined) ?? 0) + 1;
    if (snap.exists()) t.update(counterRef, { countKey: proximo });
    else t.set(counterRef, { countKey: proximo });
    return String(proximo);
  });
  const agora = new Date();
  // Livro-razão/log (transacoes, auditoria…) só recebe created_at.
  const imutavel = ["auditoria", "favoritos", "cupons_utilizacoes", "assinaturas_consumos", "fidelidade_movimentos", "transacoes", "mensagens", "historicos_pesos", "vantagens_utilizacoes"].includes(colecao);
  await setDoc(doc(tenantColRef(colecao), id), imutavel ? { ...data, created_at: agora } : { ...data, created_at: agora, updated_at: agora });
  return id;
}

// Leitura pontual filtrada por um campo (ex.: sessão de checkout pelo token).
export async function filtrarOnce(colecao: string, campo: string, valor: any): Promise<any[]> {
  const snap = await getDocs(query(tenantColRef(colecao), where(campo, "==", valor)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function atualizar(colecao: string, id: string, dados: Record<string, any>): Promise<void> {
  await updateDoc(doc(tenantColRef(colecao), id), { ...dados, updated_at: new Date() });
}

export function tenantDocPath(colecao: string, id: string): string {
  if (!TENANT_PATH) throw new Error("NEXT_PUBLIC_PETHUB_PATH não configurado.");
  return `dados/${TENANT_PATH}/${colecao}/${id}`;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
