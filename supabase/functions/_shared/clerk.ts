import { verifyToken } from "npm:@clerk/backend@3.27.0";
import { createClient } from "npm:@supabase/supabase-js@2.119.0";

export function createSupabaseServerClient(url: string, key: string) {
  const usesNewSecretKey = key.startsWith("sb_secret_");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        if (!usesNewSecretKey) return fetch(input, init);
        const headers = new Headers(init?.headers);
        if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export async function verifiedClerkUser(req: Request) {
  const secretKey = Deno.env.get("CLERK_SECRET_KEY");
  if (!secretKey) throw new Error("CLERK_SECRET_KEY is not configured");
  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new Error("A Clerk session token is required");

  const authorizedParties = (Deno.env.get("APP_ALLOWED_ORIGINS") ?? "http://localhost:5173")
    .split(",").map((value) => value.trim()).filter(Boolean);
  const audience = Deno.env.get("CLERK_JWT_AUDIENCE");
  const claims = await verifyToken(token, {
    secretKey,
    authorizedParties,
    ...(audience ? { audience } : {}),
  });
  const expectedIssuer = Deno.env.get("CLERK_ISSUER");
  if (!expectedIssuer || claims.iss !== expectedIssuer) {
    throw new Error("The Clerk token issuer does not match this environment");
  }
  if (typeof claims.exp !== "number" || claims.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error("The Clerk session has expired. Sign in again to continue.");
  }
  if (typeof claims.sub !== "string" || !claims.sub.startsWith("user_")) {
    throw new Error("The Clerk session subject is invalid");
  }
  const response = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(claims.sub)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!response.ok) throw new Error("Could not verify the Clerk account");
  const user = await response.json();
  const verifiedEmail = (user.email_addresses ?? []).find(
    (address: { id: string; verification?: { status?: string } }) =>
      address.id === user.primary_email_address_id && address.verification?.status === "verified",
  );
  if (!verifiedEmail?.email_address) throw new Error("Verify your email address before continuing");

  return {
    clerkUserId: claims.sub as string,
    email: String(verifiedEmail.email_address).trim().toLowerCase(),
    fullName: [user.first_name, user.last_name].filter(Boolean).join(" ").trim(),
    emailVerifiedAt: new Date().toISOString(),
  };
}

export function corsHeaders(origin: string | null) {
  const allowed = (Deno.env.get("APP_ALLOWED_ORIGINS") ?? "http://localhost:5173")
    .split(",").map((value) => value.trim()).filter(Boolean);
  return {
    "Access-Control-Allow-Origin": origin && allowed.includes(origin) ? origin : allowed[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
