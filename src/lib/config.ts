import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

type AppMode = "demo" | "production" | "unconfigured";
const env = import.meta.env as ImportMetaEnv & {
  VITE_APP_MODE?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_CLERK_PUBLISHABLE_KEY?: string;
  VITE_SERVICE_TERMS_STATUS?: string;
  VITE_SERVICE_TERMS_VERSION?: string;
  VITE_PRIVACY_NOTICE_STATUS?: string;
  VITE_PRIVACY_NOTICE_VERSION?: string;
};

export const appMode: AppMode =
  env.VITE_APP_MODE === "demo" || env.VITE_APP_MODE === "production"
    ? env.VITE_APP_MODE
    : "unconfigured";

export const supabaseUrl = env.VITE_SUPABASE_URL?.trim() ?? "";
export const supabasePublishableKey =
  env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
export const hasSupabaseConfig = Boolean(supabaseUrl && supabasePublishableKey);
export const clerkPublishableKey = env.VITE_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
export const hasClerkConfig = clerkPublishableKey.startsWith("pk_");

let clerkAccessToken: (() => Promise<string | null>) | null = null;
export function setClerkAccessTokenProvider(provider: (() => Promise<string | null>) | null) {
  clerkAccessToken = provider;
}
export async function getClerkAccessToken() {
  return clerkAccessToken?.() ?? null;
}

export const supabase = hasSupabaseConfig
  ? createClient<Database>(supabaseUrl, supabasePublishableKey, {
      accessToken: async () => clerkAccessToken?.() ?? null,
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    })
  : null;

export function getProductionClient() {
  if (appMode !== "production") {
    throw new Error("This action is only available in production mode.");
  }
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then restart the app.",
    );
  }
  return supabase;
}

export const isPreviewMode = appMode === "demo";
export const serviceTermsVersion = env.VITE_SERVICE_TERMS_VERSION?.trim() ?? "";
export const privacyNoticeVersion =
  env.VITE_PRIVACY_NOTICE_VERSION?.trim() ?? "";
export const hasApprovedLegalNotices =
  isPreviewMode ||
  (env.VITE_SERVICE_TERMS_STATUS === "approved" &&
    env.VITE_PRIVACY_NOTICE_STATUS === "approved" &&
    Boolean(serviceTermsVersion && privacyNoticeVersion));
