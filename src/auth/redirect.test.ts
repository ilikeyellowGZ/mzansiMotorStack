import { describe, expect, it } from "vitest";
import { safeInternalPath } from "./redirect";

describe("safeInternalPath", () => {
  it("preserves safe in-app paths and their query strings", () => {
    expect(safeInternalPath("/app/leads?filter=open#latest", "https://mzansi.test"))
      .toBe("/app/leads?filter=open#latest");
  });

  it.each([
    "https://attacker.test/collect",
    "//attacker.test/collect",
    "/\\attacker.test/collect",
    "",
    null,
    undefined,
  ])("falls back for unsafe redirect %s", (value) => {
    expect(safeInternalPath(value, "https://mzansi.test")).toBe("/onboarding");
  });

  it("rejects paths that resolve to a different origin", () => {
    expect(safeInternalPath("https://mzansi.test.evil.test/path", "https://mzansi.test"))
      .toBe("/onboarding");
  });
});
