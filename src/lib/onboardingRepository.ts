import {
  appMode,
  getProductionClient,
  privacyNoticeVersion,
  serviceTermsVersion,
} from "./config";
import {
  calculateQuote,
  getSetupFee,
  toJson,
  type OnboardingAnswers,
} from "./onboarding";

const DEMO_DRAFT_KEY = "mzansimotorstack.onboarding.demo.v1";
const TERMS_VERSION = serviceTermsVersion || "2026-11-preview-1";
const PRIVACY_VERSION = privacyNoticeVersion || "2026-11-preview-1";

export interface SavedOnboardingDraft {
  currentStep: number;
  answers: OnboardingAnswers;
  submittedRequestId?: string;
}

export type SubmitRequestResult = {
  id: string;
  status: string;
  currency: "ZAR";
  dueTodayMinor: number;
  setupFeeMinor: number;
  installments: number;
  setupScheduleMinor: number[];
};

function demoStorage() {
  if (typeof window === "undefined")
    throw new Error("Demo mode needs a browser session.");
  return window.sessionStorage;
}

export async function loadOnboardingDraft(): Promise<SavedOnboardingDraft | null> {
  if (appMode === "demo") {
    const value = demoStorage().getItem(DEMO_DRAFT_KEY);
    return value ? (JSON.parse(value) as SavedOnboardingDraft) : null;
  }
  const client = getProductionClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return null;
  const { data, error } = await client
    .from("onboarding_drafts")
    .select("current_step, answers, submitted_request_id")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    currentStep: data.current_step,
    answers: data.answers as unknown as OnboardingAnswers,
    submittedRequestId: data.submitted_request_id ?? undefined,
  };
}

export async function saveOnboardingDraft(
  draft: SavedOnboardingDraft,
): Promise<void> {
  if (appMode === "demo") {
    demoStorage().setItem(DEMO_DRAFT_KEY, JSON.stringify(draft));
    return;
  }
  const client = getProductionClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Sign in to save and resume onboarding.");
  const { error } = await client.from("onboarding_drafts").upsert(
    {
      user_id: authData.user.id,
      current_step: draft.currentStep,
      answers: toJson(draft.answers),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function registerOwner(input: {
  email: string;
  password: string;
  fullName: string;
  marketingOptIn: boolean;
}): Promise<{ emailConfirmationRequired: boolean }> {
  if (appMode === "demo") return { emailConfirmationRequired: false };
  const client = getProductionClient();
  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        full_name: input.fullName,
        marketing_opt_in: input.marketingOptIn,
        terms_accepted: true,
        terms_version: TERMS_VERSION,
        privacy_version: PRIVACY_VERSION,
      },
    },
  });
  if (error) throw error;
  if (!data.user)
    throw new Error("Supabase did not return a user after signup.");
  if (data.session && data.user.email_confirmed_at) {
    await acceptTerms();
    return { emailConfirmationRequired: false };
  }
  return { emailConfirmationRequired: true };
}

export async function acceptTerms(): Promise<void> {
  if (appMode !== "production") return;
  const client = getProductionClient();
  const { error } = await client.rpc("save_onboarding_terms", {
    p_terms_version: TERMS_VERSION,
    p_privacy_version: PRIVACY_VERSION,
  });
  if (error) throw error;
}

export async function registerInvitedAccount(input: {
  email: string;
  password: string;
  fullName: string;
  invitationToken: string;
}): Promise<{ emailConfirmationRequired: boolean; organizationId?: string }> {
  const client = getProductionClient();
  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?invited=1`,
      data: {
        full_name: input.fullName,
        marketing_opt_in: false,
        terms_accepted: true,
        terms_version: TERMS_VERSION,
        privacy_version: PRIVACY_VERSION,
        invitation_token: input.invitationToken,
      },
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error("Supabase did not return an invited user.");
  if (data.session && data.user.email_confirmed_at) {
    await acceptTerms();
    const organizationId = await acceptInvitation(input.invitationToken);
    return { emailConfirmationRequired: false, organizationId };
  }
  return { emailConfirmationRequired: true };
}

export async function acceptInvitation(token: string): Promise<string> {
  const client = getProductionClient();
  const { data, error } = await client.rpc("accept_organization_invitation", {
    p_token: token,
  });
  if (error) throw error;
  return data;
}

export async function submitOnboarding(
  answers: OnboardingAnswers,
): Promise<SubmitRequestResult> {
  if (appMode === "demo") {
    const draft = await loadOnboardingDraft();
    const id = draft?.submittedRequestId ?? `preview-${crypto.randomUUID()}`;
    const quote = calculateQuote(
      answers.plan as "essentials" | "growth" | "managed",
      answers.billingInterval,
      getSetupFee(
        answers.plan as "essentials" | "growth" | "managed",
        answers.setupMethod as "self_service" | "online" | "in_person",
      ),
      answers.setupPayment,
    );
    return {
      id,
      status: "preview_only",
      currency: "ZAR",
      dueTodayMinor: quote.dueToday,
      setupFeeMinor: quote.setupFee,
      installments: quote.installments,
      setupScheduleMinor: quote.setupSchedule,
    };
  }
  const client = getProductionClient();
  const { data, error } = await client.rpc("submit_onboarding_request", {
    p_answers: toJson(answers),
  });
  if (error) throw error;
  const result = data as unknown as {
    id: string;
    status: string;
    currency: "ZAR";
    due_today_minor: number;
    setup_fee_minor: number;
    installments: number;
    setup_schedule_minor: number[];
  };
  return {
    id: result.id,
    status: result.status,
    currency: result.currency,
    dueTodayMinor: result.due_today_minor,
    setupFeeMinor: result.setup_fee_minor,
    installments: result.installments,
    setupScheduleMinor: result.setup_schedule_minor,
  };
}

export async function signIn(email: string, password: string) {
  const client = getProductionClient();
  return client.auth.signInWithPassword({ email, password });
}

export async function sendPasswordReset(email: string) {
  const client = getProductionClient();
  return client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password/confirm`,
  });
}

export async function signOut() {
  if (appMode !== "production") return;
  const client = getProductionClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export function getModeLabel() {
  return appMode;
}
