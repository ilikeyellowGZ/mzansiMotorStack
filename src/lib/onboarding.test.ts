import { describe, expect, it } from "vitest";
import { paymentProvider } from "./billingProvider";
import {
  calculateQuote,
  getSetupFee,
  getSetupScope,
  normaliseWebsiteUrl,
  planDetails,
} from "./onboarding";

describe("onboarding prices", () => {
  it("keeps the annual totals and 10% savings exact", () => {
    expect(
      Object.fromEntries(
        Object.entries(planDetails).map(([name, plan]) => [
          name,
          [plan.monthly, plan.annual, plan.saving],
        ]),
      ),
    ).toEqual({
      essentials: [84900, 916920, 101880],
      growth: [150000, 1620000, 180000],
      managed: [350000, 3780000, 420000],
    });
  });

  it("waives assisted CRM setup for self-service Essentials and Growth", () => {
    expect(getSetupFee("essentials", "self_service")).toBe(0);
    expect(getSetupFee("growth", "self_service")).toBe(0);
  });

  it("uses the website and social launch fee for self-service Managed", () => {
    expect(getSetupFee("managed", "self_service")).toBe(450000);
  });

  it("uses the configured assisted setup fees by plan", () => {
    expect(getSetupFee("essentials", "online")).toBe(149900);
    expect(getSetupFee("growth", "online")).toBe(299900);
    expect(getSetupFee("managed", "in_person")).toBe(599900);
  });

  it("splits Growth setup into the exact first, second and final amounts", () => {
    expect(calculateQuote("growth", "monthly", 299900, "three_monthly")).toMatchObject({
      subscriptionDue: 150000,
      setupSchedule: [99967, 99967, 99966],
      dueToday: 249967,
      futureSetupPayments: [99967, 99966],
      recurringRenewal: 150000,
    });
  });

  it("charges the full annual subscription upfront and excludes setup from the saving", () => {
    expect(calculateQuote("essentials", "annual", 149900, "upfront")).toMatchObject({
      subscriptionDue: 916920,
      annualTotal: 916920,
      annualSaving: 101880,
      dueToday: 1066820,
      recurringRenewal: 916920,
    });
  });
});

describe("setup scope", () => {
  it("defines the included assisted migration scope for each plan", () => {
    expect(getSetupScope("essentials", "online").included).toContain(
      "One supported CSV import of up to 250 total vehicle, customer and lead records",
    );
    expect(getSetupScope("growth", "online").included).toContain(
      "Up to 1,000 total vehicle, customer and lead records",
    );
  });

  it("includes the standard website and approved social workflow in Managed", () => {
    const scope = getSetupScope("managed", "self_service");
    expect(scope.included).toContain("Up to five standard website pages");
    expect(scope.included).toContain(
      "Eight original posts per month, adapted for Facebook and Instagram, with dealership approval before publishing",
    );
    expect(scope.excluded).toContain(
      "Domain registration and renewal, advertising spend, photography and bespoke development",
    );
  });
});

describe("website URLs", () => {
  it("adds HTTPS to a valid dealership domain", () => {
    expect(normaliseWebsiteUrl(" www.example.co.za ")).toBe(
      "https://www.example.co.za",
    );
  });

  it("rejects malformed website values", () => {
    expect(normaliseWebsiteUrl("not a website")).toBeNull();
  });
});

describe("billing provider boundary", () => {
  it("cannot start checkout until a real provider is configured", async () => {
    await expect(
      paymentProvider.createCheckout({
        onboardingRequestId: "request-1",
        currency: "ZAR",
        amountMinor: 249967,
      }),
    ).resolves.toEqual({ status: "not_configured" });
  });
});
