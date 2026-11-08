import { getClerkAccessToken, hasSupabaseConfig, supabasePublishableKey, supabaseUrl } from "../lib/config";
import type { PlanCode } from "../lib/onboarding";

export type SourceLink = { title: string; href: "/pricing" | "/#platform" | "/tutorial" | "/privacy" };
export type PlanCard = { code: PlanCode; name: string; monthly: number; annual: number; users: string; ai: string; website: string; social: string; support: string; href: "/pricing" };
export type ChatReply = { text: string; sources: SourceLink[]; plan: PlanCard | null; handoff: boolean };
export type WireMessage = { role: "user" | "assistant"; text: string };

async function callAssistant(body: unknown, signal?: AbortSignal) {
  if (!hasSupabaseConfig) throw new Error("AI chat is offline until the Supabase connection is configured. Pricing and setup links are still available.");
  const token = await getClerkAccessToken();
  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/motorstack-assistant`, {
      method: "POST", signal,
      headers: {
        "Content-Type": "application/json",
        apikey: supabasePublishableKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error("The assistant connection is unavailable. Please retry or use the pricing and setup pages.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "The assistant is unavailable. Please retry.");
  return data;
}

export async function askAssistant(messages: WireMessage[], path: string, signal?: AbortSignal): Promise<ChatReply> {
  const data = await callAssistant({ action: "chat", messages: messages.slice(-12), path }, signal);
  if (typeof data.text !== "string") throw new Error("The assistant returned an invalid answer.");
  const allowed = new Set(["/pricing", "/#platform", "/tutorial", "/privacy"]);
  return {
    text: data.text,
    sources: Array.isArray(data.sources) ? data.sources.filter((source: SourceLink) => source && allowed.has(source.href)).slice(0, 3) : [],
    plan: data.plan && ["essentials", "growth", "managed"].includes(data.plan.code) ? data.plan : null,
    handoff: data.handoff === true,
  };
}

export type Enquiry = { requestId: string; kind: "demo" | "person" | "assisted_setup" | "other"; name: string; email: string; dealership: string; summary: string };
export async function submitEnquiry(enquiry: Enquiry, signal?: AbortSignal) {
  const result = await callAssistant({ action: "enquiry", ...enquiry }, signal);
  if (result.status !== "received" || result.requestId !== enquiry.requestId) throw new Error("The request was not confirmed. Please retry.");
  return result as { status: "received"; requestId: string };
}
