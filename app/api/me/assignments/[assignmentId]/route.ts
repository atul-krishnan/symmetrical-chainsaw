import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/route-helpers";
import { requireUserAndClient } from "@/lib/edtech/db";
import { writeRequestAuditLog } from "@/lib/edtech/request-audit-log";
import { moduleMediaEmbedSchema } from "@/lib/edtech/types";

function parseMediaEmbeds(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => moduleMediaEmbedSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
}

// ---------------------------------------------------------------------------
// GET /api/me/assignments/[assignmentId]
// Returns assignment + module content + quiz questions (without answers)
// ---------------------------------------------------------------------------

export async function GET(
  request: Request,
  context: { params: Promise<{ assignmentId: string }> },
) {
  const { assignmentId } = await context.params;

  return withApiHandler(request, async ({ requestId, route }) => {
    const { supabase, user } = await requireUserAndClient(request);

    const result = await supabase
      .from("assignments")
      .select(
        `id,org_id,state,due_at,started_at,completed_at,material_acknowledged_at,
         learning_modules!inner(
           id,title,summary,content_markdown,role_track,pass_score,media_embeds_json,
           estimated_minutes,campaign_id,
           learning_campaigns!inner(id,name,status,flow_version)
         )`,
      )
      .eq("id", assignmentId)
      .eq("user_id", user.id)
      .single();

    if (result.error) {
      if (result.error.code === "PGRST116") {
        throw new ApiError("NOT_FOUND", "Assignment not found", 404);
      }
      throw new ApiError("DB_ERROR", result.error.message, 500);
    }

    if (!result.data) {
      throw new ApiError("NOT_FOUND", "Assignment not found", 404);
    }

    const row = result.data;
    const moduleData = Array.isArray(row.learning_modules)
      ? row.learning_modules[0]
      : row.learning_modules;

    if (!moduleData) {
      throw new ApiError("NOT_FOUND", "Module not found for assignment", 404);
    }

    const campaignData = Array.isArray(moduleData.learning_campaigns)
      ? moduleData.learning_campaigns[0]
      : moduleData.learning_campaigns;

    const questionsResult = await supabase
      .from("quiz_questions")
      .select("id,prompt,choices_json,explanation")
      .eq("module_id", moduleData.id)
      .order("created_at", { ascending: true });

    if (questionsResult.error) {
      throw new ApiError("DB_ERROR", questionsResult.error.message, 500);
    }

    const questions = (questionsResult.data ?? []).map((q) => ({
      id: q.id,
      prompt: q.prompt,
      choices: q.choices_json,
    }));

    const mediaEmbeds = parseMediaEmbeds(moduleData.media_embeds_json);
    const mediaPaths = mediaEmbeds
      .map((item) => item.assetPath)
      .filter((item): item is string => Boolean(item));
    const signedUrlByPath = new Map<string, string | null>();

    if (mediaPaths.length > 0) {
      const signedResult = await supabase.storage
        .from("module-media")
        .createSignedUrls(mediaPaths, 60 * 60);

      if (signedResult.error) {
        throw new ApiError("STORAGE_ERROR", signedResult.error.message, 500);
      }

      for (const item of signedResult.data ?? []) {
        if (item.path) {
          signedUrlByPath.set(item.path, item.error ? null : item.signedUrl ?? null);
        }
      }
    }

    let assignmentState = row.state;
    let assignmentStartedAt = row.started_at;

    if (row.state === "assigned") {
      const startedAt = new Date().toISOString();
      const updateResult = await supabase
        .from("assignments")
        .update({
          state: "in_progress",
          started_at: startedAt,
          updated_at: startedAt,
        })
        .eq("id", assignmentId)
        .eq("user_id", user.id);

      if (updateResult.error) {
        throw new ApiError("DB_ERROR", updateResult.error.message, 500);
      }

      assignmentState = "in_progress";
      assignmentStartedAt = startedAt;
    }

    await writeRequestAuditLog({
      supabase,
      requestId,
      route,
      action: "assignment_view",
      statusCode: 200,
      orgId: row.org_id,
      userId: user.id,
      metadata: { assignmentId, moduleId: moduleData.id },
    });

    return {
      assignment: {
        id: row.id,
        state: assignmentState,
        dueAt: row.due_at,
        startedAt: assignmentStartedAt,
        completedAt: row.completed_at,
        materialAcknowledgedAt: row.material_acknowledged_at,
      },
      module: {
        id: moduleData.id,
        title: moduleData.title,
        summary: moduleData.summary,
        contentMarkdown: moduleData.content_markdown,
        roleTrack: moduleData.role_track,
        passScore: moduleData.pass_score,
        estimatedMinutes: moduleData.estimated_minutes,
        campaignId: moduleData.campaign_id,
        mediaEmbeds: mediaEmbeds.map((item) => ({
          ...item,
          assetUrl: item.assetPath ? signedUrlByPath.get(item.assetPath) ?? null : null,
        })),
      },
      campaign: campaignData
        ? {
            id: campaignData.id,
            name: campaignData.name,
            status: campaignData.status,
            flowVersion: campaignData.flow_version ?? 1,
          }
        : null,
      questions,
    };
  });
}
