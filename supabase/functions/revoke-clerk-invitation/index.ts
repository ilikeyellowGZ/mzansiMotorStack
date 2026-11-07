import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.119.0";
import { createSupabaseServerClient, corsHeaders, verifiedClerkUser } from "../_shared/clerk.ts";

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers });
  try {
    await verifiedClerkUser(req);
    const { invitationId, organizationId } = await req.json();
    if (typeof invitationId !== "string" || typeof organizationId !== "string") throw new Error("Invitation details are required");
    const url = Deno.env.get("SUPABASE_URL");
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const secret = Deno.env.get("SUPABASE_SERVER_SECRET") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = req.headers.get("Authorization");
    if (!url || !publishableKey || !secret || !authorization) throw new Error("Supabase server credentials are not configured");
    const userClient = createClient(url, publishableKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: owner, error: ownerError } = await userClient.from("organization_memberships")
      .select("organization_id").eq("organization_id", organizationId).eq("role", "owner").eq("status", "active").maybeSingle();
    if (ownerError) throw ownerError;
    if (!owner) throw new Error("Only an active dealership owner can revoke invitations");
    const admin = createSupabaseServerClient(url, secret);
    const { data, error } = await admin.from("organization_invitations").update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", invitationId).eq("organization_id", organizationId).eq("status", "pending").select("id").maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Invitation is already accepted, revoked or unavailable");
    return Response.json({ revoked: true }, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not revoke invitation";
    return Response.json({ error: message }, { status: 400, headers });
  }
});
