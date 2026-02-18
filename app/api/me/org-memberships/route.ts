import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/route-helpers";
import { requireUserAndClient } from "@/lib/edtech/db";
import { writeRequestAuditLog } from "@/lib/edtech/request-audit-log";
import type { OrgMembership } from "@/lib/types";

export async function GET(request: Request) {
  return withApiHandler(request, async ({ requestId, route }) => {
    const { supabase, user } = await requireUserAndClient(request);

    const membershipsResult = await supabase
      .from("organization_members")
      .select("org_id,role,organizations!inner(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (membershipsResult.error) {
      throw new ApiError("DB_ERROR", membershipsResult.error.message, 500);
    }

    const memberships: OrgMembership[] = (membershipsResult.data ?? []).map((item) => {
      const organization = Array.isArray(item.organizations)
        ? item.organizations[0]
        : item.organizations;

      return {
        orgId: item.org_id,
        orgName: organization?.name ?? "Unknown Organization",
        role: item.role,
      };
    });

    if (memberships.length === 0) {
      await writeRequestAuditLog({
        supabase,
        requestId,
        route,
        action: "org_memberships_list",
        statusCode: 200,
        userId: user.id,
        metadata: {
          memberships: 0,
        },
      });
    } else {
      await Promise.all(
        memberships.map((membership) =>
          writeRequestAuditLog({
            supabase,
            requestId,
            route,
            action: "org_memberships_list",
            statusCode: 200,
            orgId: membership.orgId,
            userId: user.id,
            metadata: {
              memberships: memberships.length,
            },
          }),
        ),
      );
    }

    return { memberships };
  });
}
