import dotenv from "dotenv";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import { generateCampaignDraft } from "../lib/edtech/campaign-generator";
import type { RoleTrack } from "../lib/types";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const shouldApply = process.argv.includes("--apply");

function asRoleTracks(input: unknown): RoleTrack[] {
  if (!Array.isArray(input)) return ["exec", "builder", "general"];

  const tracks = input.filter(
    (item): item is RoleTrack => item === "exec" || item === "builder" || item === "general",
  );

  return tracks.length > 0 ? tracks : ["exec", "builder", "general"];
}

function asPolicyIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  return input.filter((item): item is string => typeof item === "string" && item.length > 0);
}

async function main() {
  const startedAt = new Date().toISOString();

  const summary: {
    mode: "dry-run" | "apply";
    startedAt: string;
    finishedAt?: string;
    totalDraftCampaigns: number;
    upgraded: number;
    skipped: number;
    failed: number;
    failures: Array<{ campaignId: string; message: string }>;
  } = {
    mode: shouldApply ? "apply" : "dry-run",
    startedAt,
    totalDraftCampaigns: 0,
    upgraded: 0,
    skipped: 0,
    failed: 0,
    failures: [],
  };

  const draftCampaignsResult = await supabase
    .from("learning_campaigns")
    .select("id,org_id,name,policy_ids,role_tracks,status")
    .eq("status", "draft")
    .order("created_at", { ascending: true });

  if (draftCampaignsResult.error) {
    throw new Error(`Failed to fetch draft campaigns: ${draftCampaignsResult.error.message}`);
  }

  const campaigns = draftCampaignsResult.data ?? [];
  summary.totalDraftCampaigns = campaigns.length;

  for (const campaign of campaigns) {
    try {
      const policyIds = asPolicyIds(campaign.policy_ids);
      const roleTracks = asRoleTracks(campaign.role_tracks);

      const obligationsResult = await supabase
        .from("policy_obligations")
        .select("detail,role_track")
        .eq("org_id", campaign.org_id)
        .in("policy_id", policyIds.length > 0 ? policyIds : [randomUUID()]);

      if (obligationsResult.error) {
        throw new Error(`Failed to fetch obligations: ${obligationsResult.error.message}`);
      }

      const obligations = (obligationsResult.data ?? []).map((item) => ({
        detail: item.detail,
        roleTrack: item.role_track as RoleTrack,
      }));

      const generatedDraft = await generateCampaignDraft({
        campaignName: campaign.name,
        obligations,
        roleTracks,
      });

      if (!shouldApply) {
        summary.upgraded += 1;
        continue;
      }

      const modulesResult = await supabase
        .from("learning_modules")
        .select("id,role_track")
        .eq("org_id", campaign.org_id)
        .eq("campaign_id", campaign.id);

      if (modulesResult.error) {
        throw new Error(`Failed to fetch modules: ${modulesResult.error.message}`);
      }

      const moduleByRoleTrack = new Map(
        (modulesResult.data ?? []).map((moduleRow) => [moduleRow.role_track as RoleTrack, moduleRow.id]),
      );

      for (const moduleDraft of generatedDraft.modules) {
        const existingModuleId = moduleByRoleTrack.get(moduleDraft.roleTrack);
        const moduleId = existingModuleId ?? randomUUID();

        if (existingModuleId) {
          const moduleUpdate = await supabase
            .from("learning_modules")
            .update({
              title: moduleDraft.title,
              summary: moduleDraft.summary,
              content_markdown: moduleDraft.contentMarkdown,
              pass_score: moduleDraft.passScore,
              estimated_minutes: moduleDraft.estimatedMinutes,
              media_embeds_json: moduleDraft.mediaEmbeds,
              quiz_sync_hash: moduleDraft.quizSyncHash,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingModuleId)
            .eq("campaign_id", campaign.id)
            .eq("org_id", campaign.org_id);

          if (moduleUpdate.error) {
            throw new Error(`Failed to update module ${existingModuleId}: ${moduleUpdate.error.message}`);
          }

          const deleteQuestions = await supabase
            .from("quiz_questions")
            .delete()
            .eq("org_id", campaign.org_id)
            .eq("module_id", existingModuleId);

          if (deleteQuestions.error) {
            throw new Error(`Failed to clear quiz questions: ${deleteQuestions.error.message}`);
          }
        } else {
          const moduleInsert = await supabase.from("learning_modules").insert({
            id: moduleId,
            org_id: campaign.org_id,
            campaign_id: campaign.id,
            role_track: moduleDraft.roleTrack,
            title: moduleDraft.title,
            summary: moduleDraft.summary,
            content_markdown: moduleDraft.contentMarkdown,
            pass_score: moduleDraft.passScore,
            estimated_minutes: moduleDraft.estimatedMinutes,
            media_embeds_json: moduleDraft.mediaEmbeds,
            quiz_sync_hash: moduleDraft.quizSyncHash,
          });

          if (moduleInsert.error) {
            throw new Error(`Failed to insert module ${moduleDraft.roleTrack}: ${moduleInsert.error.message}`);
          }
        }

        const questionInsert = await supabase.from("quiz_questions").insert(
          moduleDraft.quizQuestions.map((question) => ({
            id: randomUUID(),
            org_id: campaign.org_id,
            module_id: moduleId,
            prompt: question.prompt,
            choices_json: question.choices,
            correct_choice_index: question.correctChoiceIndex,
            explanation: question.explanation,
          })),
        );

        if (questionInsert.error) {
          throw new Error(`Failed to insert quiz questions: ${questionInsert.error.message}`);
        }
      }

      const campaignUpdate = await supabase
        .from("learning_campaigns")
        .update({
          flow_version: 2,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaign.id)
        .eq("org_id", campaign.org_id)
        .eq("status", "draft");

      if (campaignUpdate.error) {
        throw new Error(`Failed to update campaign flow version: ${campaignUpdate.error.message}`);
      }

      await supabase.from("request_audit_logs").insert({
        request_id: randomUUID(),
        org_id: campaign.org_id,
        user_id: null,
        route: "scripts/backfill-learning-flow-v2",
        action: "campaign_upgrade_v2",
        status_code: 200,
        error_code: null,
        metadata_json: {
          campaignId: campaign.id,
          flowVersion: 2,
        },
      });

      summary.upgraded += 1;
    } catch (error) {
      summary.failed += 1;
      summary.failures.push({
        campaignId: campaign.id,
        message: error instanceof Error ? error.message : "Unknown backfill error",
      });
    }
  }

  summary.skipped = summary.totalDraftCampaigns - summary.upgraded - summary.failed;
  summary.finishedAt = new Date().toISOString();

  console.log(JSON.stringify(summary, null, 2));

  if (summary.failed > 0) {
    process.exit(1);
  }
}

void main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        mode: shouldApply ? "apply" : "dry-run",
        error: error instanceof Error ? error.message : "Unexpected failure",
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
