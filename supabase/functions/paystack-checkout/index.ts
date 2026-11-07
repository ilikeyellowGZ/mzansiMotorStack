import {
  corsHeaders,
  getAdminClient,
  getAuthenticatedUser,
  getOrCreatePlan,
  jsonResponse,
  paystackRequest,
} from "../_shared/paystack.ts";

type InitializedTransaction = { authorization_url: string; reference: string };

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  let createdSessionId: string | null = null;
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return jsonResponse({ error: "Sign in to continue to payment." }, 401);
    const { onboardingRequestId } = await request.json();
    if (typeof onboardingRequestId !== "string" || !/^[0-9a-f-]{36}$/i.test(onboardingRequestId)) {
      return jsonResponse({ error: "A valid onboarding request is required." }, 400);
    }

    const admin = getAdminClient();
    const { data: onboarding, error: onboardingError } = await admin
      .from("onboarding_requests")
      .select("id,organization_id,onboarding_user_id,plan_code,billing_interval,currency,subscription_amount_minor,due_today_minor,setup_fee_minor,tax_status,payment_status,status,service_scope_snapshot")
      .eq("id", onboardingRequestId)
      .eq("onboarding_user_id", user.id)
      .maybeSingle();
    if (onboardingError) throw onboardingError;
    if (!onboarding) return jsonResponse({ error: "Onboarding request not found." }, 404);
    if (onboarding.payment_status === "paid" || onboarding.status === "active") {
      return jsonResponse({ error: "This onboarding request has already been paid." }, 409);
    }
    const { data: pricing, error: pricingError } = await admin.from("pricing_configuration")
      .select("tax_treatment,tax_rate_basis_points").eq("singleton", true).maybeSingle();
    if (pricingError) throw pricingError;
    if (pricing?.tax_treatment !== "inclusive") {
      return jsonResponse({ error: "Payment is paused until the final tax treatment and payable amount are configured." }, 409);
    }
    if (onboarding.tax_status !== "inclusive") {
      const snapshot = onboarding.service_scope_snapshot as Record<string, unknown>;
      const { error: refreshError } = await admin.from("onboarding_requests").update({
        tax_status: "inclusive",
        service_scope_snapshot: { ...snapshot, payment_provider: "paystack", tax_treatment: "inclusive" },
      }).eq("id", onboarding.id);
      if (refreshError) throw refreshError;
    }
    if (onboarding.currency !== "ZAR" || onboarding.due_today_minor <= 0) {
      return jsonResponse({ error: "This quote is not ready for Paystack checkout." }, 409);
    }

    const { data: pending, error: pendingError } = await admin
      .from("billing_checkout_sessions")
      .select("checkout_url,provider_reference")
      .eq("onboarding_request_id", onboarding.id)
      .eq("status", "pending")
      .maybeSingle();
    if (pendingError) throw pendingError;
    if (pending?.checkout_url) return jsonResponse({ checkoutUrl: pending.checkout_url, reference: pending.provider_reference });

    const interval = onboarding.billing_interval === "annual" ? "annually" : "monthly";
    const planCode = await getOrCreatePlan(admin, onboarding.subscription_amount_minor, interval);
    const reference = `mms-${onboarding.id.replaceAll("-", "")}-${crypto.randomUUID().replaceAll("-", "")}`;
    const { data: session, error: sessionError } = await admin
      .from("billing_checkout_sessions")
      .insert({
        organization_id: onboarding.organization_id,
        onboarding_request_id: onboarding.id,
        provider_reference: reference,
        currency: onboarding.currency,
        amount_minor: onboarding.due_today_minor,
      })
      .select("id")
      .single();
    if (sessionError) {
      if (sessionError.code === "23505") {
        const { data: existing } = await admin.from("billing_checkout_sessions")
          .select("checkout_url,provider_reference").eq("onboarding_request_id", onboarding.id)
          .eq("status", "pending").maybeSingle();
        if (existing?.checkout_url) return jsonResponse({ checkoutUrl: existing.checkout_url, reference: existing.provider_reference });
      }
      throw sessionError;
    }
    createdSessionId = session.id;

    const origin = request.headers.get("origin");
    let callbackUrl: string | undefined;
    if (origin) {
      const parsedOrigin = new URL(origin);
      if (parsedOrigin.protocol === "https:" || parsedOrigin.hostname === "localhost") {
        callbackUrl = new URL("/start", parsedOrigin).toString();
      }
    }
    const transaction = await paystackRequest<InitializedTransaction>("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: user.email,
        amount: String(onboarding.due_today_minor),
        currency: onboarding.currency,
        reference,
        channels: ["card"],
        ...(callbackUrl ? { callback_url: callbackUrl } : {}),
        metadata: JSON.stringify({
          checkout_session_id: session.id,
          onboarding_request_id: onboarding.id,
          plan_code: onboarding.plan_code,
          recurring_plan_code: planCode,
        }),
      }),
    });
    const { error: updateError } = await admin.from("billing_checkout_sessions")
      .update({ checkout_url: transaction.authorization_url, updated_at: new Date().toISOString() })
      .eq("id", session.id);
    if (updateError) throw updateError;

    const { error: statusError } = await admin.from("onboarding_requests")
      .update({ payment_status: "pending", status: "pending_payment" })
      .eq("id", onboarding.id);
    if (statusError) throw statusError;
    return jsonResponse({ checkoutUrl: transaction.authorization_url, reference: transaction.reference });
  } catch (error) {
    console.error("Paystack checkout initialization failed", error);
    if (createdSessionId) {
      await getAdminClient().from("billing_checkout_sessions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", createdSessionId).eq("status", "pending");
    }
    return jsonResponse({ error: error instanceof Error ? error.message : "Unable to start checkout." }, 500);
  }
});
