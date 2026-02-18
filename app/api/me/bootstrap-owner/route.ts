import { randomUUID } from "node:crypto";

import { ApiError } from "@/lib/api/errors";
import { parseJsonBody } from "@/lib/api/request";
import { withApiHandler } from "@/lib/api/route-helpers";
import { runtimeEnv } from "@/lib/env";
import { requireUserAndClient } from "@/lib/edtech/db";
import { writeRequestAuditLog } from "@/lib/edtech/request-audit-log";
import { bootstrapOwnerSchema } from "@/lib/edtech/validation";
import type { OrgMembership } from "@/lib/types";

function defaultOrgName(email: string | null): string {
  const prefix = (email ?? "New User").split("@")[0]?.trim() || "New User";
  return `${prefix}'s Workspace`.slice(0, 80);
}

export async function POST(request: Request) {
  return withApiHandler(request, async ({ requestId, route }) => {
    if (!runtimeEnv.allowDevBootstrap) {
      throw new ApiError("AUTH_ERROR", "Bootstrap flow is disabled in this environment.", 403);
    }

    const { user, supabase } = await requireUserAndClient(request);

    const payload = await parseJsonBody<unknown>(request);
    const parsed = bootstrapOwnerSchema.safeParse(payload ?? {});

    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid bootstrap payload",
        400,
      );
    }

    const membershipResult = await supabase
      .from("organization_members")
      .select("org_id,role,organizations!inner(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (membershipResult.error) {
      throw new ApiError("DB_ERROR", membershipResult.error.message, 500);
    }

    const existingMemberships: OrgMembership[] = (membershipResult.data ?? []).map((item) => {
      const organization = Array.isArray(item.organizations)
        ? item.organizations[0]
        : item.organizations;

      return {
        orgId: item.org_id,
        orgName: organization?.name ?? "Unknown Organization",
        role: item.role,
      };
    });

    if (existingMemberships.length > 0) {
      await Promise.all(
        existingMemberships.map((membership) =>
          writeRequestAuditLog({
            supabase,
            requestId,
            route,
            action: "dev_bootstrap_owner",
            statusCode: 200,
            orgId: membership.orgId,
            userId: user.id,
            metadata: {
              created: false,
              reason: "already_member",
              membershipRole: membership.role,
            },
          }),
        ),
      );

      return {
        ok: true,
        created: false,
        memberships: existingMemberships,
      };
    }

    const organizationResult = await supabase
      .from("organizations")
      .select("id,name")
      .order("created_at", { ascending: true })
      .limit(1);

    if (organizationResult.error) {
      throw new ApiError("DB_ERROR", organizationResult.error.message, 500);
    }

    let orgId: string;
    let orgName: string;
    let createdOrganization = false;

    const existingOrg = organizationResult.data?.[0];
    if (existingOrg) {
      orgId = existingOrg.id;
      orgName = existingOrg.name;
    } else {
      createdOrganization = true;
      orgId = randomUUID();
      orgName = parsed.data.orgName ?? defaultOrgName(user.email ?? null);

      const orgInsert = await supabase
        .from("organizations")
        .insert({
          id: orgId,
          name: orgName,
        })
        .select("id,name")
        .single();

      if (orgInsert.error || !orgInsert.data) {
        throw new ApiError(
          "DB_ERROR",
          orgInsert.error?.message ?? "Could not create organization",
          500,
        );
      }

      orgId = orgInsert.data.id;
      orgName = orgInsert.data.name;
    }

    const membershipUpsert = await supabase.from("organization_members").upsert(
      {
        org_id: orgId,
        user_id: user.id,
        email: user.email ?? `${user.id}@local.dev`,
        role: "owner",
      },
      { onConflict: "org_id,user_id" },
    );

    if (membershipUpsert.error) {
      throw new ApiError("DB_ERROR", membershipUpsert.error.message, 500);
    }

    await writeRequestAuditLog({
      supabase,
      requestId,
      route,
      action: "dev_bootstrap_owner",
      statusCode: 200,
      orgId,
      userId: user.id,
      metadata: {
        created: true,
        createdOrganization,
        assignedRole: "owner",
      },
    });

    return {
      ok: true,
      created: true,
      createdOrganization,
      membership: {
        orgId,
        orgName,
        role: "owner",
      },
    };
  });
}
