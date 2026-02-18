import type { OrgRole } from "@/lib/types";

const ROLE_PRIORITY: Record<OrgRole, number> = {
  learner: 1,
  manager: 2,
  admin: 3,
  owner: 4,
};

export function hasMinimumRole(role: OrgRole | undefined, minimumRole: OrgRole): boolean {
  if (!role) {
    return false;
  }

  return ROLE_PRIORITY[role] >= ROLE_PRIORITY[minimumRole];
}
