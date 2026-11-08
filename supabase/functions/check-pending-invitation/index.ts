import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createSupabaseServerClient, corsHeaders, verifiedClerkUser } from "../_shared/clerk.ts";

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers });
  try {
    const identity = await verifiedClerkUser(req);
    const url = Deno.env.get("SUPABASE_URL");
    const secret = Deno.env.get("MOTORSTACK_SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !secret) throw new Error("Supabase server credentials are not configured");
    const admin = createSupabaseServerClient(url, secret);
    const { data, error } = await admin.from("organization_invitations").select("id,expires_at,status")
      .eq("email", identity.email).eq("status", "pending").gt("expires_at", new Date().toISOString()).limit(1);
    if (error) throw error;
    return Response.json({ hasInvitation: Boolean(data?.length) }, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not check invitations";
    return Response.json({ error: message }, { status: 401, headers });
  }
});
