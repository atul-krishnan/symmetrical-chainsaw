import type { OrgMembership } from "@/lib/types";

export function pickOrgId(
  memberships: OrgMembership[],
  candidates: Array<string | null | undefined>,
): string | null {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    if (memberships.some((membership) => membership.orgId === candidate)) {
      return candidate;
    }
  }

  if (memberships.length === 1) {
    return memberships[0].orgId;
  }

  return null;
}
