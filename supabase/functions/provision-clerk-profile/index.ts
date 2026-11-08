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

    const { data: existing, error: lookupError } = await admin.from("profiles")
      .select("id").eq("clerk_user_id", identity.clerkUserId).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) {
      const { error } = await admin.from("profiles").update({
        email: identity.email,
        email_verified_at: identity.emailVerifiedAt,
        full_name: identity.fullName,
      }).eq("id", existing.id);
      if (error) throw error;
      return Response.json({ profileId: existing.id, provisioned: false }, { headers });
    }

    const { data: inserted, error: insertError } = await admin.from("profiles").insert({
      clerk_user_id: identity.clerkUserId,
      email: identity.email,
      email_verified_at: identity.emailVerifiedAt,
      full_name: identity.fullName,
      marketing_opt_in: false,
    }).select("id").single();
    if (insertError) {
      // A concurrent retry may win the unique Clerk ID constraint. Read that
      // exact mapping and treat it as successful without creating a second row.
      const { data: raced, error: raceError } = await admin.from("profiles")
        .select("id").eq("clerk_user_id", identity.clerkUserId).maybeSingle();
      if (raceError || !raced) throw insertError;
      return Response.json({ profileId: raced.id, provisioned: false }, { headers });
    }
    return Response.json({ profileId: inserted.id, provisioned: true }, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Identity provisioning failed";
    return Response.json({ error: message }, { status: 401, headers });
  }
});
