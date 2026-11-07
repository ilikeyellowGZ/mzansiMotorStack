export interface CheckoutRequest {
  onboardingRequestId: string;
  currency: "ZAR";
  amountMinor: number;
}

export type CheckoutResult =
  | { status: "ready"; checkoutUrl: string; providerReference: string }
  | { status: "not_configured" };

export interface BillingProvider {
  readonly name: string;
  createCheckout(request: CheckoutRequest): Promise<CheckoutResult>;
}

/** Safe placeholder until a provider and server-side credential are selected. */
export const paymentProvider: BillingProvider = {
  name: "unconfigured",
  async createCheckout(_request) {
    return { status: "not_configured" };
  },
};
