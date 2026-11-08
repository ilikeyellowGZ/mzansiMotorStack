import type { Json } from "./database.types";
import { planDetails } from "../../supabase/functions/_shared/productCatalog";
export { planDetails, getSetupFee } from "../../supabase/functions/_shared/productCatalog";
export type { PlanCode, SetupMethod } from "../../supabase/functions/_shared/productCatalog";
import type { PlanCode, SetupMethod } from "../../supabase/functions/_shared/productCatalog";

const zarFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export type BillingInterval = "monthly" | "annual";
export type SocialPlatform =
  | "Facebook"
  | "Instagram"
  | "TikTok"
  | "Other"
  | "None yet";

export interface OnboardingAnswers {
  fullName: string;
  email: string;
  marketingOptIn: boolean;
  termsAccepted: boolean;
  privacyAcknowledged: boolean;
  dealershipName: string;
  phone: string;
  city: string;
  province: string;
  address: string;
  role: "Owner" | "Manager" | "Other";
  staffSize: "Just me" | "2–5" | "6–10" | "More than 10";
  stockBand: "1–10" | "11–30" | "31–60" | "More than 60";
  helpAreas: string[];
  websiteStatus: "happy" | "needs_improvement" | "want_one" | "not_now" | "";
  websiteUrl: string;
  addWebsiteLater: boolean;
  websiteReview: boolean;
  websiteOptions: boolean;
  socialPlatforms: SocialPlatform[];
  socialProfiles: Record<string, string>;
  socialHelp: "self" | "profile_setup" | "ongoing" | "discuss" | "";
  setupMethod: SetupMethod | "";
  recordSources: string[];
  recordCount: string;
  canExport: "yes" | "no" | "not_sure" | "";
  plan: PlanCode | "";
  billingInterval: BillingInterval;
  setupPayment: "upfront" | "three_monthly";
  preferredDate: string;
  preferredTime: string;
  meetingFormat: "online" | "in_person" | "";
  contactPerson: string;
  contactPhone: string;
  appointmentAddress: string;
  appointmentNotes: string;
}

export const emptyAnswers: OnboardingAnswers = {
  fullName: "",
  email: "",
  marketingOptIn: false,
  termsAccepted: false,
  privacyAcknowledged: false,
  dealershipName: "",
  phone: "",
  city: "",
  province: "",
  address: "",
  role: "Owner",
  staffSize: "Just me",
  stockBand: "1–10",
  helpAreas: [],
  websiteStatus: "",
  websiteUrl: "",
  addWebsiteLater: false,
  websiteReview: false,
  websiteOptions: false,
  socialPlatforms: [],
  socialProfiles: {},
  socialHelp: "",
  setupMethod: "",
  recordSources: [],
  recordCount: "",
  canExport: "",
  plan: "",
  billingInterval: "monthly",
  setupPayment: "upfront",
  preferredDate: "",
  preferredTime: "",
  meetingFormat: "",
  contactPerson: "",
  contactPhone: "",
  appointmentAddress: "",
  appointmentNotes: "",
};

export function getSetupScope(plan: PlanCode, method: SetupMethod) {
  const exclusions = [
    "Paper transcription, complex cleanup, unsupported imports and custom integrations require a separate itemised quote",
    "Domain registration and renewal, advertising spend, photography and bespoke development",
  ];

  if (method === "self_service" && plan !== "managed") {
    return {
      title: "Guided self-service",
      included: [
        "Enter records manually or use the supported CSV template and guided instructions",
        "No assisted CRM migration fee",
      ],
      excluded: exclusions,
    };
  }

  if (method === "self_service") {
    return {
      title: "Managed website and social launch",
      included: [
        "Self-service CRM migration; no assisted import is included",
        "Up to five standard website pages",
        "Vehicle inventory listing and vehicle detail templates, CRM enquiry forms, mobile-responsive design, basic page titles and descriptions",
        "Website hosting and maintenance while the Managed subscription remains active",
        "Connection or creation of up to two social profiles and launch planning",
        "Eight original posts per month, adapted for Facebook and Instagram, with dealership approval before publishing",
      ],
      excluded: exclusions,
    };
  }

  const included =
    plan === "essentials"
      ? [
          "One supported CSV import of up to 250 total vehicle, customer and lead records",
          "Dealership account configuration and one online training session",
        ]
      : [
          "Up to 1,000 total vehicle, customer and lead records",
          "Dealership account, AI/workflow configuration and two online sessions",
        ];

  if (plan === "managed") {
    included.push(
      "Up to five standard website pages",
      "Vehicle inventory listing and vehicle detail templates, CRM enquiry forms, mobile-responsive design, basic page titles and descriptions",
      "Website hosting and maintenance while the Managed subscription remains active",
      "Connection or creation of up to two social profiles and launch planning",
      "Eight original posts per month, adapted for Facebook and Instagram, with dealership approval before publishing",
    );
  }

  return {
    title: plan === "managed" ? "Managed launch package" : `${planDetails[plan].name} assisted setup`,
    included,
    excluded: exclusions,
  };
}

export function splitMinorAmount(amount: number, parts: number): number[] {
  if (parts < 1 || amount < 0)
    throw new Error("Invalid amount or instalment count");
  const base = Math.floor(amount / parts);
  const remainder = amount % parts;
  return Array.from(
    { length: parts },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}

export function calculateQuote(
  plan: PlanCode,
  billing: BillingInterval,
  setupFee: number,
  setupPayment: "upfront" | "three_monthly",
) {
  const details = planDetails[plan];
  const installments = setupFee > 0 && setupPayment === "three_monthly" ? 3 : 1;
  const setupSchedule = splitMinorAmount(setupFee, installments);
  const subscriptionDue =
    billing === "annual" ? details.annual : details.monthly;
  return {
    currency: "ZAR" as const,
    subscriptionDue,
    annualTotal: details.annual,
    annualSaving: details.saving,
    setupFee,
    installments,
    setupSchedule,
    dueToday: subscriptionDue + setupSchedule[0],
    recurringRenewal: billing === "annual" ? details.annual : details.monthly,
    futureSetupPayments: setupSchedule.slice(1),
  };
}

export function toJson(answers: OnboardingAnswers): Json {
  return JSON.parse(JSON.stringify(answers)) as Json;
}

export function formatMoney(minor: number): string {
  return zarFormatter.format(minor / 100);
}

export function normaliseWebsiteUrl(value: string): string | null {
  const candidate = value.trim();
  if (!candidate) return "";
  try {
    const url = new URL(
      /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`,
    );
    if (!url.hostname.includes(".")) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}
