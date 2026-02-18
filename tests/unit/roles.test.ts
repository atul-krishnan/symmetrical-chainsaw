import { describe, expect, it } from "vitest";

import { hasMinimumRole } from "@/lib/edtech/roles";

describe("hasMinimumRole", () => {
  it("allows higher roles", () => {
    expect(hasMinimumRole("owner", "admin")).toBe(true);
    expect(hasMinimumRole("admin", "manager")).toBe(true);
  });

  it("rejects insufficient roles", () => {
    expect(hasMinimumRole("learner", "manager")).toBe(false);
    expect(hasMinimumRole(undefined, "learner")).toBe(false);
  });
});
