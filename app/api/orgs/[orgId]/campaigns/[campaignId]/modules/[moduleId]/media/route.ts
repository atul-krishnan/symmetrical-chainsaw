import { ApiError } from "@/lib/api/errors";
import { withApiHandler } from "@/lib/api/route-helpers";
import { runtimeEnv } from "@/lib/env";
import { requireOrgAccess } from "@/lib/edtech/db";
import { normalizeModuleMediaUploadFile } from "@/lib/edtech/module-media";
import { writeRequestAuditLog } from "@/lib/edtech/request-audit-log";
import { moduleMediaEmbedSchema } from "@/lib/edtech/types";
import { moduleMediaUploadSchema } from "@/lib/edtech/validation";

const MAX_MODULE_MEDIA_MB = Math.max(runtimeEnv.maxPolicyUploadMb, 20);

function parseMediaEmbeds(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => moduleMediaEmbedSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
}

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
      throw new ApiError("CONFLICT", "Only draft campaigns can accept media uploads", 409);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const embedId = `${formData.get("embedId") ?? ""}`.trim();

    const parsedInput = moduleMediaUploadSchema.safeParse({ embedId });
    if (!parsedInput.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        parsedInput.error.issues[0]?.message ?? "Invalid media upload payload",
        400,
      );
    }

    if (!(file instanceof File)) {
      throw new ApiError("VALIDATION_ERROR", "Media file is required", 400);
    }

    if (file.size > MAX_MODULE_MEDIA_MB * 1024 * 1024) {
      throw new ApiError(
        "VALIDATION_ERROR",
        `Media file too large. Max size is ${MAX_MODULE_MEDIA_MB}MB.`,
        400,
      );
    }

    const moduleResult = await supabase
      .from("learning_modules")
      .select("id,media_embeds_json")
      .eq("id", moduleId)
      .eq("campaign_id", campaignId)
      .eq("org_id", orgId)
      .single();

    if (moduleResult.error || !moduleResult.data) {
      throw new ApiError("NOT_FOUND", "Module not found", 404);
    }

    const normalized = normalizeModuleMediaUploadFile({
      orgId,
      campaignId,
      moduleId,
      embedId: parsedInput.data.embedId,
      fileName: file.name,
      mimeType: file.type,
    });

    const mediaEmbeds = parseMediaEmbeds(moduleResult.data.media_embeds_json);
    const targetIndex = mediaEmbeds.findIndex((item) => item.id === parsedInput.data.embedId);
    if (targetIndex === -1) {
      throw new ApiError("NOT_FOUND", "Media suggestion not found for module", 404);
    }

    const target = mediaEmbeds[targetIndex];
    if (target.kind !== normalized.kind) {
      throw new ApiError(
        "VALIDATION_ERROR",
        `Media type mismatch. Expected a ${target.kind} file for this slot.`,
        400,
      );
    }

    const uploadResult = await supabase.storage
      .from("module-media")
      .upload(normalized.filePath, Buffer.from(await file.arrayBuffer()), {
        contentType: normalized.mimeType,
        upsert: true,
      });

    if (uploadResult.error) {
      throw new ApiError("STORAGE_ERROR", uploadResult.error.message, 500);
    }

    const updatedEmbeds = [...mediaEmbeds];
    updatedEmbeds[targetIndex] = {
      ...target,
      assetPath: normalized.filePath,
      mimeType: normalized.mimeType,
      status: "attached",
    };

    const moduleUpdate = await supabase
      .from("learning_modules")
      .update({
        media_embeds_json: updatedEmbeds,
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
      action: "module_media_upload",
      statusCode: 200,
      orgId,
      userId: user.id,
      metadata: {
        campaignId,
        moduleId,
        embedId: parsedInput.data.embedId,
        mimeType: normalized.mimeType,
      },
    });

    return {
      ok: true,
      campaignId,
      moduleId,
      embedId: parsedInput.data.embedId,
      mimeType: normalized.mimeType,
    };
  });
}
