// Shared by the public pricing page, onboarding, and the assistant Edge Function.
// Amounts are ZAR cents. Keep billing changes in this one maintained source.
export const planDetails = {
  essentials: {
    name: "Essentials", monthly: 84900, annual: 916920, saving: 101880,
    users: "Up to 3", maxUsers: 3, ai: "Not included", website: "Optional quoted add-on",
    social: "Optional quoted add-on", support: "Standard support",
  },
  growth: {
    name: "Growth", monthly: 150000, annual: 1620000, saving: 180000,
    users: "Up to 5", maxUsers: 5, ai: "Allowance to be confirmed before checkout",
    website: "Optional quoted add-on", social: "Optional quoted add-on", support: "Priority support",
  },
  managed: {
    name: "Managed", monthly: 350000, annual: 3780000, saving: 420000,
    users: "Up to 10", maxUsers: 10, ai: "Larger allowance to be confirmed before checkout",
    website: "Standard website service included, with setup fee",
    social: "8 original posts/month, adapted for Facebook + Instagram",
    support: "Monthly online review",
  },
} as const;

export type PlanCode = keyof typeof planDetails;

export function recommendPlan(teamSize: number | null, managedService: boolean) {
  if (teamSize === null || !Number.isInteger(teamSize) || teamSize < 1) return null;
  const eligible = (Object.entries(planDetails) as [PlanCode, (typeof planDetails)[PlanCode]][])
    .filter(([code, plan]) => plan.maxUsers >= teamSize && (!managedService || code === "managed"))
    .sort((left, right) => left[1].monthly - right[1].monthly);
  return eligible[0]?.[0] ?? null;
}
