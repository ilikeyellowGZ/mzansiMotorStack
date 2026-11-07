import { getAdminClient, getOrCreatePlan, paystackRequest } from "./paystack.ts";

type CheckoutRow = {
  id: string;
  organization_id: string;
  onboarding_request_id: string;
  provider_reference: string;
  currency: string;
  amount_minor: number;
  status: string;
  provider_customer_reference: string | null;
  provider_subscription_reference: string | null;
  setup_subscription_references: Record<string, string>;
};

type Transaction = {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at: string;
  customer: { customer_code: string; email: string };
  authorization: { authorization_code: string; reusable: boolean };
};

type OnboardingRow = {
  id: string;
  organization_id: string;
  plan_code: string;
  billing_interval: "monthly" | "annual";
  currency: string;
  subscription_amount_minor: number;
  due_today_minor: number;
  setup_fee_minor: number;
  setup_installments: number;
  setup_schedule_minor: number[];
  tax_status: string;
};

type PaystackSubscription = { subscription_code: string };

function nextDate(from: Date, interval: "monthly" | "annual", offset = 1) {
  const date = new Date(from);
  const day = Math.min(date.getUTCDate(), 28);
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + (interval === "annual" ? 12 * offset : offset));
  date.setUTCDate(day);
  return date.toISOString();
}

export async function completePaystackCheckout(reference: string) {
  const admin = getAdminClient();
  const { data: checkout, error: checkoutError } = await admin.from("billing_checkout_sessions")
    .select("id,organization_id,onboarding_request_id,provider_reference,currency,amount_minor,status,provider_customer_reference,provider_subscription_reference,setup_subscription_references")
    .eq("provider_reference", reference).maybeSingle();
  if (checkoutError) throw checkoutError;
  if (!checkout) throw new Error("Checkout reference not found.");
  const session = checkout as CheckoutRow;
  if (session.status === "paid") return getPaymentResult(admin, session.onboarding_request_id);

  const { data: claim, error: claimError } = await admin.rpc("claim_paystack_checkout", { p_reference: reference });
  if (claimError) throw claimError;
  if (claim?.status === "processing") return { status: "processing" };
  if (claim?.status === "paid") return getPaymentResult(admin, session.onboarding_request_id);

  try {
    const transaction = await paystackRequest<Transaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
    if (transaction.status !== "success" || transaction.reference !== reference || transaction.amount !== session.amount_minor || transaction.currency !== session.currency) {
      if (transaction.status === "failed") {
        await admin.from("billing_checkout_sessions").update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("provider_reference", reference);
        await admin.from("onboarding_requests").update({ payment_status: "failed" })
          .eq("id", session.onboarding_request_id);
      }
      await admin.rpc("release_paystack_checkout", { p_reference: reference });
      return { status: transaction.status === "failed" ? "failed" : "pending" };
    }
    if (!transaction.authorization?.reusable || !transaction.authorization.authorization_code || !transaction.customer?.customer_code) {
      throw new Error("Paystack did not return a reusable card authorization for recurring billing.");
    }

    const { data: onboarding, error: onboardingError } = await admin.from("onboarding_requests")
      .select("id,organization_id,plan_code,billing_interval,currency,subscription_amount_minor,due_today_minor,setup_fee_minor,setup_installments,setup_schedule_minor,tax_status")
      .eq("id", session.onboarding_request_id).maybeSingle();
    if (onboardingError) throw onboardingError;
    if (!onboarding) throw new Error("Onboarding request not found.");
    const request = onboarding as OnboardingRow;
    if (request.tax_status !== "inclusive") throw new Error("Tax treatment changed before payment verification.");

    const recurringInterval = request.billing_interval === "annual" ? "annually" : "monthly";
    const recurringPlan = await getOrCreatePlan(admin, request.subscription_amount_minor, recurringInterval);
    const paidAt = new Date(transaction.paid_at || Date.now());
    const startDate = nextDate(paidAt, request.billing_interval);
    let subscriptionCode = session.provider_subscription_reference;
    if (!subscriptionCode) {
      const subscription = await paystackRequest<PaystackSubscription>("/subscription", {
        method: "POST",
        body: JSON.stringify({
          customer: transaction.customer.customer_code,
          plan: recurringPlan,
          authorization: transaction.authorization.authorization_code,
          start_date: startDate,
        }),
      });
      subscriptionCode = subscription.subscription_code;
      const { error: referenceError } = await admin.from("billing_checkout_sessions").update({
        provider_customer_reference: transaction.customer.customer_code,
        provider_subscription_reference: subscriptionCode,
        updated_at: new Date().toISOString(),
      }).eq("id", session.id);
      if (referenceError) throw referenceError;
    }

    const setupSubscriptions: Array<{ installment: number; code: string }> = [];
    if (request.setup_installments === 3) {
      const storedSetupRefs = session.setup_subscription_references ?? {};
      for (let installment = 2; installment <= 3; installment++) {
        const existingCode = storedSetupRefs[String(installment)];
        if (existingCode) {
          setupSubscriptions.push({ installment, code: existingCode });
          continue;
        }
        const installmentAmount = request.setup_schedule_minor[installment - 1];
        const setupPlan = await getOrCreatePlan(admin, installmentAmount, "monthly", 1);
        const setupSubscription = await paystackRequest<PaystackSubscription>("/subscription", {
          method: "POST",
          body: JSON.stringify({
            customer: transaction.customer.customer_code,
            plan: setupPlan,
            authorization: transaction.authorization.authorization_code,
            start_date: nextDate(paidAt, "monthly", installment - 1),
          }),
        });
        storedSetupRefs[String(installment)] = setupSubscription.subscription_code;
        const { error: referenceError } = await admin.from("billing_checkout_sessions").update({
          setup_subscription_references: storedSetupRefs,
          updated_at: new Date().toISOString(),
        }).eq("id", session.id);
        if (referenceError) throw referenceError;
        setupSubscriptions.push({ installment, code: setupSubscription.subscription_code });
      }
    }

    const periodEnd = new Date(startDate);
    const { data: finalized, error: finalizeError } = await admin.rpc("finalize_paystack_checkout", {
      p_reference: reference,
      p_transaction_id: transaction.id,
      p_customer_code: transaction.customer.customer_code,
      p_subscription_code: subscriptionCode,
      p_period_start: paidAt.toISOString(),
      p_period_end: periodEnd.toISOString(),
    });
    if (finalizeError) throw finalizeError;

    for (const setup of setupSubscriptions) {
      const { error } = await admin.from("billing_charges")
        .update({ provider_subscription_reference: setup.code })
        .eq("organization_id", request.organization_id)
        .eq("idempotency_key", `${request.id}:setup:${setup.installment}`);
      if (error) throw error;
    }
    return getPaymentResult(admin, request.id, finalized?.status ?? "paid");
  } catch (error) {
    await admin.rpc("release_paystack_checkout", { p_reference: reference });
    throw error;
  }
}

async function getPaymentResult(admin: ReturnType<typeof getAdminClient>, requestId: string, status = "paid") {
  const { data, error } = await admin.from("onboarding_requests")
    .select("id,status,currency,due_today_minor,setup_fee_minor,setup_installments,setup_schedule_minor")
    .eq("id", requestId).single();
  if (error) throw error;
  return {
    status,
    id: data.id,
    requestStatus: data.status,
    currency: data.currency,
    dueTodayMinor: data.due_today_minor,
    setupFeeMinor: data.setup_fee_minor,
    installments: data.setup_installments,
    setupScheduleMinor: data.setup_schedule_minor,
  };
}
