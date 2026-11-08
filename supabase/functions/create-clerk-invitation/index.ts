import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.119.0";
import { createSupabaseServerClient, corsHeaders, verifiedClerkUser } from "../_shared/clerk.ts";

function hex(bytes: Uint8Array) { return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join(""); }

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers });
  let invitationId: string | null = null;
  let admin: ReturnType<typeof createClient> | null = null;
  try {
    const identity = await verifiedClerkUser(req);
    const { organizationId, email: rawEmail, role } = await req.json();
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address");
    if (!['manager', 'salesperson'].includes(role)) throw new Error("Choose a supported staff role");
    if (typeof organizationId !== "string") throw new Error("Select a dealership");
    const url = Deno.env.get("SUPABASE_URL");
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const secret = Deno.env.get("MOTORSTACK_SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("RESEND_FROM_EMAIL");
    const appUrl = Deno.env.get("APP_PUBLIC_URL");
    if (!url || !publishableKey || !secret || !resendKey || !from || !appUrl) {
      throw new Error("Invitation email delivery is not configured");
    }
    const authorization = req.headers.get("Authorization");
    if (!authorization) throw new Error("A Clerk session is required");
    const userClient = createClient(url, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: membership, error: membershipError } = await userClient.from("organization_memberships")
      .select("organization_id,role").eq("organization_id", organizationId).eq("status", "active").eq("role", "owner").maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership) throw new Error("Only an active dealership owner can issue invitations");

    admin = createSupabaseServerClient(url, secret);
    const { data: profile, error: profileError } = await admin.from("profiles").select("id")
      .eq("clerk_user_id", identity.clerkUserId).maybeSingle();
    if (profileError || !profile) throw new Error("Secure account provisioning is incomplete");
    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = btoa(String.fromCharCode(...tokenBytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const { data: invitation, error: insertError } = await admin.from("organization_invitations").insert({
      organization_id: organizationId,
      email,
      role,
      invited_by_user_id: profile.id,
      token_hash: `\\x${hex(new Uint8Array(digest))}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }).select("id").single();
    if (insertError) throw insertError;
    invitationId = invitation.id;
    const mail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "You have been invited to a MzansiMotorStack dealership",
        text: `You have been invited as a ${role} to join a dealership workspace. Accept the invitation within 7 days: ${appUrl.replace(/\/$/, "")}/accept-invite?token=${encodeURIComponent(token)}`,
      }),
    });
    if (!mail.ok) throw new Error("The invitation was saved but the email could not be sent");
    return Response.json({ sent: true, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }, { headers });
  } catch (error) {
    if (admin && invitationId) await admin.from("organization_invitations").update({ status: "revoked", revoked_at: new Date().toISOString() }).eq("id", invitationId);
    const message = error instanceof Error ? error.message : "Could not send invitation";
    return Response.json({ error: message }, { status: 400, headers });
  }
});
