import { randomUUID } from "node:crypto";

import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/route-helpers";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { requireOrgAccess } from "@/lib/edtech/db";
import { sendCampaignInvites } from "@/lib/edtech/email";
import {
  findIdempotentSuccess,
  getIdempotencyKeyFromRequest,
  hashIdempotencyKey,
  withIdempotencyMetadata,
} from "@/lib/edtech/idempotency";
import { enforceRateLimit } from "@/lib/edtech/rate-limit";
import { writeRequestAuditLog } from "@/lib/edtech/request-audit-log";
import { logInfo } from "@/lib/observability/logger";

type PublishResponse = {
  ok: true;
  campaignId: string;
  alreadyPublished: boolean;
  assignmentsCreated: number;
  assignmentsTotal: number;
  emailedCount: number;
};

async function countCampaignAssignments(
  orgId: string,
  campaignId: string,
  supabase: Awaited<ReturnType<typeof requireOrgAccess>>["supabase"],
): Promise<number> {
  const countResult = await supabase
    .from("assignments")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("campaign_id", campaignId);

  if (countResult.error) {
    throw new ApiError("DB_ERROR", countResult.error.message, 500);
  }

  return countResult.count ?? 0;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ orgId: string; campaignId: string }> },
) {
  const { orgId, campaignId } = await context.params;

  return withApiHandler(request, async ({ requestId, route }) => {
    const { supabase, user } = await requireOrgAccess(request, orgId, "admin");

    const idempotencyKey = getIdempotencyKeyFromRequest(request);
    const idempotencyKeyHash = idempotencyKey ? hashIdempotencyKey(idempotencyKey) : null;

    const replayed = await findIdempotentSuccess<PublishResponse>({
      supabase,
      orgId,
      userId: user.id,
      action: "campaign_publish",
      idempotencyKeyHash,
      resourceField: "campaignId",
      resourceValue: campaignId,
    });

    if (replayed) {
      return replayed;
    }

    const limit = enforceRateLimit(`${orgId}:${user.id}:campaign_publish`);
    if (!limit.allowed) {
      throw new ApiError(
        "RATE_LIMITED",
        `Publish rate limit reached. Retry in ${Math.ceil((limit.retryAfterMs ?? 0) / 1000)} seconds.`,
        429,
      );
    }

    const campaignResult = await supabase
      .from("learning_campaigns")
      .select("id,name,status,due_at")
      .eq("id", campaignId)
      .eq("org_id", orgId)
      .single();

    if (campaignResult.error || !campaignResult.data) {
      throw new ApiError("NOT_FOUND", "Campaign not found", 404);
    }

    if (campaignResult.data.status === "archived") {
      throw new ApiError("CONFLICT", "Archived campaigns cannot be published", 409);
    }

    const modulesResult = await supabase
      .from("learning_modules")
      .select("id")
      .eq("org_id", orgId)
      .eq("campaign_id", campaignId);

    if (modulesResult.error) {
      throw new ApiError("DB_ERROR", modulesResult.error.message, 500);
    }

    const modules = modulesResult.data ?? [];
    if (modules.length === 0) {
      throw new ApiError("CONFLICT", "Campaign has no modules", 409);
    }

    const membersResult = await supabase
      .from("organization_members")
      .select("user_id,email")
      .eq("org_id", orgId)
      .in("role", ["learner", "manager", "admin", "owner"]);

    if (membersResult.error) {
      throw new ApiError("DB_ERROR", membersResult.error.message, 500);
    }

    const members = membersResult.data ?? [];
    if (members.length === 0) {
      throw new ApiError("CONFLICT", "No members found for assignment", 409);
    }

    if (campaignResult.data.status === "published") {
      const assignmentsTotal = await countCampaignAssignments(orgId, campaignId, supabase);
      const response: PublishResponse = {
        ok: true,
        campaignId,
        alreadyPublished: true,
        assignmentsCreated: 0,
        assignmentsTotal,
        emailedCount: 0,
      };

      await writeRequestAuditLog({
        supabase,
        requestId,
        route,
        action: "campaign_publish",
        statusCode: 200,
        orgId,
        userId: user.id,
        metadata: withIdempotencyMetadata(
          {
            campaignId,
            assignmentsCreated: 0,
            assignmentsTotal,
            emailedCount: 0,
            replay: true,
            response,
          },
          idempotencyKeyHash,
        ),
      });

      return response;
    }

    const dueAt = campaignResult.data.due_at;
    const assignmentRows = modules.flatMap((module) =>
      members.map((member) => ({
        id: randomUUID(),
        org_id: orgId,
        campaign_id: campaignId,
        module_id: module.id,
        user_id: member.user_id,
        state: "assigned",
        due_at: dueAt,
      })),
    );

    const assignmentInsert = await supabase.from("assignments").upsert(assignmentRows, {
      onConflict: "campaign_id,module_id,user_id",
      ignoreDuplicates: true,
      defaultToNull: true,
    });

    if (assignmentInsert.error) {
      throw new ApiError("DB_ERROR", assignmentInsert.error.message, 500);
    }

    const campaignUpdate = await supabase
      .from("learning_campaigns")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId)
      .eq("org_id", orgId)
      .eq("status", "draft")
      .select("id");

    if (campaignUpdate.error) {
      throw new ApiError("DB_ERROR", campaignUpdate.error.message, 500);
    }

    const publishedNow = (campaignUpdate.data ?? []).length > 0;
    const assignmentsTotal = await countCampaignAssignments(orgId, campaignId, supabase);

    let emailedCount = 0;
    if (publishedNow) {
      const firstAssignmentByUser = new Map<string, string>();
      for (const row of assignmentRows) {
        if (!firstAssignmentByUser.has(row.user_id)) {
          firstAssignmentByUser.set(row.user_id, row.id);
        }
      }

      const inviteTargets = members.map((member) => ({
        email: member.email,
        assignmentId: firstAssignmentByUser.get(member.user_id) ?? "",
        campaignName: campaignResult.data.name,
      }));

      emailedCount = await sendCampaignInvites(inviteTargets, requestId);

      logInfo("campaign_published", {
        request_id: requestId,
        route,
        org_id: orgId,
        user_id: user.id,
        event: ANALYTICS_EVENTS.campaignPublished,
        status_code: 200,
      });
    }

    const response: PublishResponse = {
      ok: true,
      campaignId,
      alreadyPublished: !publishedNow,
      assignmentsCreated: publishedNow ? assignmentRows.length : 0,
      assignmentsTotal,
      emailedCount,
    };

    await writeRequestAuditLog({
      supabase,
      requestId,
      route,
      action: "campaign_publish",
      statusCode: 200,
      orgId,
      userId: user.id,
      metadata: withIdempotencyMetadata(
        {
          campaignId,
          assignmentsCreated: response.assignmentsCreated,
          assignmentsTotal,
          emailedCount,
          replay: !publishedNow,
          response,
        },
        idempotencyKeyHash,
      ),
    });

    return response;
  });
}
