import { describe, expect, it } from "vitest";
import { planDetails, recommendPlan } from "./productCatalog";

describe("plan recommendation", () => {
  it("picks the least expensive plan that fits the confirmed team size", () => {
    for (const team of [1, 3, 4, 5, 6, 10]) {
      const code = recommendPlan(team, false);
      const expected = Object.entries(planDetails)
        .filter(([, plan]) => plan.maxUsers >= team)
        .sort((a, b) => a[1].monthly - b[1].monthly)[0][0];
      expect(code).toBe(expected);
    }
  });
  it("does not force a plan when staff count is unknown or over every verified limit", () => {
    expect(recommendPlan(null, false)).toBeNull();
    expect(recommendPlan(11, false)).toBeNull();
    expect(recommendPlan(0, false)).toBeNull();
  });
  it("only selects a managed service when requested and within capacity", () => {
    expect(recommendPlan(2, true)).toBe("managed");
    expect(recommendPlan(11, true)).toBeNull();
  });
});
