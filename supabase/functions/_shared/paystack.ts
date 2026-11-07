import { createSupabaseServerClient, verifiedClerkUser } from "./clerk.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-paystack-signature, paystack-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function getAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVER_SECRET") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase server credentials are not configured.");
  return createSupabaseServerClient(url, key);
}

export function getPaystackSecret() {
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
  if (!secret) throw new Error("Paystack secret key is not configured.");
  return secret;
}

export async function paystackRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getPaystackSecret()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const result = await response.json();
  if (!response.ok || result.status !== true) {
    throw new Error(result.message || `Paystack request failed (${response.status}).`);
  }
  return result.data as T;
}

function hexToBytes(hex: string) {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

async function hmacSha512(secret: string, message: Uint8Array) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, message));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}

export async function verifyPaystackSignature(request: Request, rawBody: Uint8Array) {
  const currentSignature = request.headers.get("x-paystack-signature");
  if (currentSignature) {
    const expected = await hmacSha512(getPaystackSecret(), rawBody);
    const supplied = hexToBytes(currentSignature);
    if (supplied && constantTimeEqual(expected, supplied)) return true;
  }

  const signedHeader = request.headers.get("paystack-signature");
  const webhookSecret = Deno.env.get("PAYSTACK_WEBHOOK_SECRET");
  if (!signedHeader || !webhookSecret) return false;
  const pieces = signedHeader.split(",").map((part) => {
    const separator = part.indexOf("=");
    return separator < 0 ? ["", ""] : [part.slice(0, separator).trim(), part.slice(separator + 1).trim()];
  });
  const timestamp = pieces.find(([key]) => key === "t")?.[1];
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const message = new Uint8Array([...new TextEncoder().encode(`${timestamp}.`), ...rawBody]);
  const expected = await hmacSha512(webhookSecret, message);
  return pieces.some(([key, value]) => {
    if (key !== "v1") return false;
    const separator = value.indexOf(":");
    const supplied = hexToBytes(separator < 0 ? value : value.slice(separator + 1));
    return Boolean(supplied && constantTimeEqual(expected, supplied));
  });
}

export async function getAuthenticatedUser(request: Request) {
  try {
    const identity = await verifiedClerkUser(request);
    const { data: profile, error } = await getAdminClient().from("profiles")
      .select("id").eq("clerk_user_id", identity.clerkUserId).maybeSingle();
    if (error || !profile) return null;
    return { id: profile.id, email: identity.email };
  } catch {
    return null;
  }
}

export async function getOrCreatePlan(
  admin: ReturnType<typeof getAdminClient>,
  amount: number,
  interval: "monthly" | "annually",
  invoiceLimit = 0,
) {
  const { data: existing, error } = await admin
    .from("paystack_plan_catalog")
    .select("provider_plan_code")
    .eq("amount_minor", amount)
    .eq("billing_interval", interval)
    .eq("currency", "ZAR")
    .eq("invoice_limit", invoiceLimit)
    .maybeSingle();
  if (error) throw error;
  if (existing) return existing.provider_plan_code as string;

  const plan = await paystackRequest<{ plan_code: string }>("/plan", {
    method: "POST",
    body: JSON.stringify({
      name: `MzansiMotorStack ${interval} subscription`,
      description: `MzansiMotorStack recurring ${interval} subscription`,
      amount,
      interval,
      currency: "ZAR",
      ...(invoiceLimit > 0 ? { invoice_limit: invoiceLimit } : {}),
      send_invoices: true,
      send_sms: false,
    }),
  });
  const { error: insertError } = await admin.from("paystack_plan_catalog").upsert({
    amount_minor: amount,
    billing_interval: interval,
    currency: "ZAR",
    invoice_limit: invoiceLimit,
    provider_plan_code: plan.plan_code,
  }, { onConflict: "amount_minor,billing_interval,currency,invoice_limit" });
  if (insertError) throw insertError;
  return plan.plan_code;
}
