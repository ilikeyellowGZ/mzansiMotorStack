import { completePaystackCheckout } from "../_shared/complete-checkout.ts";
import {
  corsHeaders,
  getAdminClient,
  jsonResponse,
  verifyPaystackSignature,
} from "../_shared/paystack.ts";

type PaystackEvent = {
  event?: string;
  data?: {
    id?: number;
    reference?: string;
    status?: string;
    paid_at?: string;
    amount?: number;
    currency?: string;
    subscription?: { subscription_code?: string };
  };
};

const hex = (bytes: Uint8Array) => [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);
  const rawBody = new Uint8Array(await request.arrayBuffer());
  try {
    if (!(await verifyPaystackSignature(request, rawBody))) {
      return jsonResponse({ error: "Invalid Paystack signature." }, 401);
    }
    const event = JSON.parse(new TextDecoder().decode(rawBody)) as PaystackEvent;
    if (!event.event || !event.data) return jsonResponse({ error: "Invalid event payload." }, 400);
    const admin = getAdminClient();
    const reference = event.data.reference ?? "unknown";
    const eventReference = `${event.event}:${event.data.id ?? reference}`;
    const digest = hex(new Uint8Array(await crypto.subtle.digest("SHA-256", rawBody)));
    const { data: eventRow, error: ledgerError } = await admin.from("billing_provider_events")
      .upsert({
        provider: "paystack",
        provider_event_reference: eventReference,
        event_type: event.event,
        payload_digest: digest,
        processing_status: "processing",
        attempt_count: 1,
      }, { onConflict: "provider,provider_event_reference", ignoreDuplicates: true })
      .select("id,processing_status")
      .maybeSingle();
    if (ledgerError) throw ledgerError;
    if (!eventRow) {
      const { data: previous } = await admin.from("billing_provider_events")
        .select("processing_status").eq("provider", "paystack")
        .eq("provider_event_reference", eventReference).maybeSingle();
      if (previous?.processing_status === "processed") return jsonResponse({ received: true, duplicate: true });
      await admin.from("billing_provider_events").update({
        processing_status: "processing", attempt_count: 1,
      }).eq("provider", "paystack").eq("provider_event_reference", eventReference);
    }

    if (event.event === "charge.success" && reference.startsWith("mms-")) {
      const result = await completePaystackCheckout(reference);
      if (result.status === "processing" || result.status === "pending") {
        throw new Error("Paystack checkout is still being verified.");
      }
    } else if (event.event === "charge.success") {
      const subscriptionCode = event.data.subscription?.subscription_code;
      if (subscriptionCode && event.data.id && event.data.amount && event.data.currency) {
        const paidAt = event.data.paid_at ?? new Date().toISOString();
        const { data: setupCharge } = await admin.from("billing_charges")
          .select("id,status").eq("provider_subscription_reference", subscriptionCode)
          .eq("status", "pending").maybeSingle();
        if (setupCharge) {
          await admin.from("billing_charges").update({
            status: "paid",
            provider_charge_reference: reference,
            paid_at: paidAt,
            updated_at: new Date().toISOString(),
          }).eq("id", setupCharge.id);
        } else {
          const { data: subscription } = await admin.from("organization_subscriptions")
            .select("id,organization_id,source_onboarding_request_id,billing_interval,status")
            .eq("provider_subscription_reference", subscriptionCode).maybeSingle();
          if (subscription) {
            const periodStart = new Date(paidAt);
            const periodEnd = new Date(periodStart);
            periodEnd.setUTCDate(1);
            periodEnd.setUTCMonth(periodEnd.getUTCMonth() + (subscription.billing_interval === "annual" ? 12 : 1));
            periodEnd.setUTCDate(Math.min(new Date(paidAt).getUTCDate(), 28));
            const { error: chargeError } = await admin.from("billing_charges").upsert({
              organization_id: subscription.organization_id,
              subscription_id: subscription.id,
              onboarding_request_id: subscription.source_onboarding_request_id,
              charge_type: "subscription",
              status: "paid",
              currency: event.data.currency,
              amount_minor: event.data.amount,
              provider: "paystack",
              provider_charge_reference: reference,
              idempotency_key: `paystack-renewal:${reference}`,
              paid_at: paidAt,
            }, { onConflict: "organization_id,idempotency_key" });
            if (chargeError) throw chargeError;
            await admin.from("organization_subscriptions").update({
              status: "active",
              current_period_start: periodStart.toISOString(),
              current_period_end: periodEnd.toISOString(),
              entitlement_verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }).eq("id", subscription.id);
          }
        }
      }
    } else if (event.event === "invoice.payment_failed") {
      const subscriptionCode = event.data.subscription?.subscription_code;
      if (subscriptionCode) {
        await admin.from("organization_subscriptions").update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("provider_subscription_reference", subscriptionCode);
        await admin.from("billing_charges").update({ status: "failed", failed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("provider_subscription_reference", subscriptionCode).eq("status", "pending");
      }
    } else if (event.event === "subscription.disable") {
      const subscriptionCode = event.data.subscription?.subscription_code;
      if (subscriptionCode) {
        await admin.from("organization_subscriptions").update({ status: "cancelled", cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("provider_subscription_reference", subscriptionCode);
      }
    } else if (event.event === "subscription.not_renew") {
      const subscriptionCode = event.data.subscription?.subscription_code;
      if (subscriptionCode) {
        await admin.from("organization_subscriptions").update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
          .eq("provider_subscription_reference", subscriptionCode);
      }
    }

    await admin.from("billing_provider_events").update({
      processing_status: "processed", processed_at: new Date().toISOString(), last_error: null,
    }).eq("provider", "paystack").eq("provider_event_reference", eventReference);
    return jsonResponse({ received: true });
  } catch (error) {
    console.error("Paystack webhook processing failed", error);
    try {
      const event = JSON.parse(new TextDecoder().decode(rawBody)) as PaystackEvent;
      const eventReference = `${event.event ?? "unknown"}:${event.data?.id ?? event.data?.reference ?? "unknown"}`;
      await getAdminClient().from("billing_provider_events").update({
        processing_status: "failed", attempt_count: 1,
        last_error: error instanceof Error ? error.message.slice(0, 500) : "Processing failed",
      }).eq("provider", "paystack").eq("provider_event_reference", eventReference);
    } catch { /* The original webhook error is returned below. */ }
    return jsonResponse({ error: "Webhook processing failed; Paystack may retry." }, 500);
  }
});
