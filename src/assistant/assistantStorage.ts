import type { SupabaseClient } from "@supabase/supabase-js";
import { appMode, supabase } from "../lib/config";
import type { ChatReply } from "./assistantApi";

export type ChatItem = { id: string; role: "user" | "assistant"; text: string; sources?: ChatReply["sources"]; plan?: ChatReply["plan"] };
export type AssistantThread = { threadId: string; messages: ChatItem[]; draft: string };
const prefix = "mzansimotorstack.assistant.v1.";
export function clearSessionThread(identity: string) { sessionStorage.removeItem(prefix + identity); }

function readSession(identity: string): AssistantThread | null {
  try {
    const raw = sessionStorage.getItem(prefix + identity);
    return raw ? JSON.parse(raw) as AssistantThread : null;
  } catch { return null; }
}

export async function loadThread(identity: string): Promise<AssistantThread | null> {
  if (identity === "anonymous" || appMode !== "production" || !supabase) return readSession(identity);
  const { data: profile } = await supabase.from("profiles").select("id").maybeSingle();
  if (!profile) return readSession(identity);
  const db = supabase as unknown as SupabaseClient;
  const { data, error } = await db.from("assistant_conversations")
    .select("thread_id,messages,draft").eq("user_id", profile.id).gt("expires_at", new Date().toISOString())
    .order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  if (!data) return readSession(identity);
  return { threadId: data.thread_id, messages: data.messages as ChatItem[], draft: data.draft };
}

export async function saveThread(identity: string, thread: AssistantThread) {
  sessionStorage.setItem(prefix + identity, JSON.stringify({ ...thread, messages: thread.messages.slice(-40) }));
  if (identity === "anonymous" || appMode !== "production" || !supabase) return;
  const { data: profile } = await supabase.from("profiles").select("id").maybeSingle();
  if (!profile) return;
  const db = supabase as unknown as SupabaseClient;
  const { error } = await db.from("assistant_conversations").upsert({
    user_id: profile.id, thread_id: thread.threadId, messages: thread.messages.slice(-40), draft: thread.draft.slice(0, 800),
    updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
  }, { onConflict: "user_id,thread_id" });
  if (error) throw error;
}
