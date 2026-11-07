import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.119.0";
import { corsHeaders, verifiedClerkUser } from "../_shared/clerk.ts";

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers });
  try {
    const identity = await verifiedClerkUser(req);
    const { token } = await req.json();
    if (typeof token !== "string" || token.length < 32 || token.length > 512) {
      return Response.json({ error: "Invitation link is invalid" }, { status: 400, headers });
    }
    const url = Deno.env.get("SUPABASE_URL");
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const authorization = req.headers.get("Authorization");
    if (!url || !publishableKey || !authorization) throw new Error("Supabase third-party auth is not configured");
    const userClient = createClient(url, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: provisionError } = await userClient.functions.invoke("provision-clerk-profile", { body: {} });
    if (provisionError) throw new Error("Complete account provisioning before accepting the invitation");
    const { data, error } = await userClient.rpc("accept_organization_invitation", { p_token: token });
    if (error) throw error;
    return Response.json({ organizationId: data, email: identity.email }, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invitation could not be accepted";
    return Response.json({ error: message }, { status: 400, headers });
  }
});
