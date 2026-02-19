import { randomUUID } from "node:crypto";

import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/route-helpers";
import { generateModuleQuizFromLearningMaterial } from "@/lib/edtech/campaign-generator";
import { requireOrgAccess } from "@/lib/edtech/db";
import { computeQuizSyncHash } from "@/lib/edtech/quiz-sync";
import { writeRequestAuditLog } from "@/lib/edtech/request-audit-log";

export async function POST(
  request: Request,
  context: { params: Promise<{ orgId: string; campaignId: string; moduleId: string }> },
) {
  const { orgId, campaignId, moduleId } = await context.params;

  return withApiHandler(request, async ({ requestId, route }) => {
    const { supabase, user } = await requireOrgAccess(request, orgId, "admin");

    const campaignResult = await supabase
      .from("learning_campaigns")
      .select("id,status")
      .eq("id", campaignId)
      .eq("org_id", orgId)
      .single();

    if (campaignResult.error || !campaignResult.data) {
      throw new ApiError("NOT_FOUND", "Campaign not found", 404);
    }

    if (campaignResult.data.status !== "draft") {
      throw new ApiError("CONFLICT", "Only draft campaigns can be regenerated", 409);
    }

    const moduleResult = await supabase
      .from("learning_modules")
      .select(
        "id,org_id,campaign_id,role_track,title,summary,content_markdown,pass_score,estimated_minutes",
      )
      .eq("id", moduleId)
      .eq("campaign_id", campaignId)
      .eq("org_id", orgId)
      .single();

    if (moduleResult.error || !moduleResult.data) {
      throw new ApiError("NOT_FOUND", "Module not found", 404);
    }

    const moduleData = moduleResult.data;
    const quizQuestions = await generateModuleQuizFromLearningMaterial({
      roleTrack: moduleData.role_track,
      title: moduleData.title,
      summary: moduleData.summary,
      contentMarkdown: moduleData.content_markdown,
      passScore: moduleData.pass_score,
      estimatedMinutes: moduleData.estimated_minutes,
    });

    const deleteQuestions = await supabase
      .from("quiz_questions")
      .delete()
      .eq("org_id", orgId)
      .eq("module_id", moduleId);

    if (deleteQuestions.error) {
      throw new ApiError("DB_ERROR", deleteQuestions.error.message, 500);
    }

    const questionInsert = await supabase.from("quiz_questions").insert(
      quizQuestions.map((question) => ({
        id: randomUUID(),
        org_id: orgId,
        module_id: moduleId,
        prompt: question.prompt,
        choices_json: question.choices,
        correct_choice_index: question.correctChoiceIndex,
        explanation: question.explanation,
      })),
    );

    if (questionInsert.error) {
      throw new ApiError("DB_ERROR", questionInsert.error.message, 500);
    }

    const syncHash = computeQuizSyncHash({
      roleTrack: moduleData.role_track,
      title: moduleData.title,
      summary: moduleData.summary,
      contentMarkdown: moduleData.content_markdown,
    });

    const moduleUpdate = await supabase
      .from("learning_modules")
      .update({
        quiz_sync_hash: syncHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", moduleId)
      .eq("campaign_id", campaignId)
      .eq("org_id", orgId);

    if (moduleUpdate.error) {
      throw new ApiError("DB_ERROR", moduleUpdate.error.message, 500);
    }

    await writeRequestAuditLog({
      supabase,
      requestId,
      route,
      action: "module_quiz_regenerate",
      statusCode: 200,
      orgId,
      userId: user.id,
      metadata: {
        campaignId,
        moduleId,
        questionCount: quizQuestions.length,
      },
    });

    return {
      ok: true,
      campaignId,
      moduleId,
      questionCount: quizQuestions.length,
    };
  });
}
