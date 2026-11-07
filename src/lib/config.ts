import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

type AppMode = "demo" | "production" | "unconfigured";
const env = import.meta.env as ImportMetaEnv & {
  VITE_APP_MODE?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
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

export const supabase = hasSupabaseConfig
  ? createClient<Database>(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
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
