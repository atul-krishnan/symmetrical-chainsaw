import { describe, expect, it } from "vitest";

import { pickOrgId } from "@/lib/edtech/org-selection";
import type { OrgMembership } from "@/lib/types";

const memberships: OrgMembership[] = [
  { orgId: "org-a", orgName: "Org A", role: "admin" },
  { orgId: "org-b", orgName: "Org B", role: "manager" },
];

describe("pickOrgId", () => {
  it("auto-selects a single-org user", () => {
    expect(pickOrgId([memberships[0]], [null, undefined])).toBe("org-a");
  });

  it("uses preferred org candidate when valid", () => {
    expect(pickOrgId(memberships, ["org-b"])).toBe("org-b");
  });

  it("forces explicit selection for multi-org users when no candidate is available", () => {
    expect(pickOrgId(memberships, [null, "missing-org"])).toBeNull();
  });
});
