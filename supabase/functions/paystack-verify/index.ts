import { completePaystackCheckout } from "../_shared/complete-checkout.ts";
import { corsHeaders, getAdminClient, getAuthenticatedUser, jsonResponse } from "../_shared/paystack.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return jsonResponse({ error: "Sign in to verify this payment." }, 401);
    const { reference } = await request.json();
    if (typeof reference !== "string" || !/^mms-[a-f0-9-]+$/i.test(reference)) {
      return jsonResponse({ error: "A valid payment reference is required." }, 400);
    }
    const admin = getAdminClient();
    const { data, error } = await admin.from("billing_checkout_sessions")
      .select("onboarding_request_id")
      .eq("provider_reference", reference)
      .maybeSingle();
    if (error) throw error;
    if (!data) return jsonResponse({ error: "Payment reference not found." }, 404);
    const { data: onboarding, error: ownerError } = await admin.from("onboarding_requests")
      .select("onboarding_user_id")
      .eq("id", data.onboarding_request_id)
      .maybeSingle();
    if (ownerError) throw ownerError;
    if (!onboarding || onboarding.onboarding_user_id !== user.id) {
      return jsonResponse({ error: "You cannot verify this payment." }, 403);
    }
    const result = await completePaystackCheckout(reference);
    return jsonResponse(result, result.status === "failed" ? 402 : 200);
  } catch (error) {
    console.error("Paystack payment verification failed", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unable to verify payment." }, 500);
  }
});
