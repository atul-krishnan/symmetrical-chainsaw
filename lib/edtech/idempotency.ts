import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiError } from "@/lib/api/errors";

type JsonRecord = Record<string, unknown>;

export function getIdempotencyKeyFromRequest(request: Request): string | null {
  const rawHeader = request.headers.get("idempotency-key");
  if (!rawHeader) {
    return null;
  }

  const key = rawHeader.trim();
  if (!key) {
    return null;
  }

  if (key.length > 128) {
    throw new ApiError("VALIDATION_ERROR", "Idempotency-Key must be 128 characters or fewer.", 400);
  }

  return key;
}

export function hashIdempotencyKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function withIdempotencyMetadata(
  metadata: JsonRecord,
  idempotencyKeyHash: string | null,
): JsonRecord {
  if (!idempotencyKeyHash) {
    return metadata;
  }

  return {
    ...metadata,
    idempotencyKeyHash,
  };
}

export async function findIdempotentSuccess<T>(input: {
  supabase: SupabaseClient;
  orgId: string;
  userId: string;
  action: string;
  idempotencyKeyHash: string | null;
  resourceField?: string;
  resourceValue?: string;
}): Promise<T | null> {
  if (!input.idempotencyKeyHash) {
    return null;
  }

  const previousRequests = await input.supabase
    .from("request_audit_logs")
    .select("metadata_json")
    .eq("org_id", input.orgId)
    .eq("user_id", input.userId)
    .eq("action", input.action)
    .eq("status_code", 200)
    .order("created_at", { ascending: false })
    .limit(50);

  if (previousRequests.error) {
    return null;
  }

  for (const entry of previousRequests.data ?? []) {
    const metadata =
      typeof entry.metadata_json === "object" && entry.metadata_json !== null
        ? (entry.metadata_json as JsonRecord)
        : null;

    if (!metadata) {
      continue;
    }

    if (metadata.idempotencyKeyHash !== input.idempotencyKeyHash) {
      continue;
    }

    if (input.resourceField && input.resourceValue) {
      if (metadata[input.resourceField] !== input.resourceValue) {
        continue;
      }
    }

    if (metadata.response && typeof metadata.response === "object") {
      return metadata.response as T;
    }
  }

  return null;
}
