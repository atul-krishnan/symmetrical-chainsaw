import { ApiError } from "@/lib/api/errors";

const EXTENSION_TO_MIME = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
} as const;

export const ALLOWED_MODULE_MEDIA_MIME_TYPES = [...new Set(Object.values(EXTENSION_TO_MIME))];

function sanitizeFileStem(fileName: string): string {
  const normalized = fileName
    .normalize("NFKD")
    .replace(/[\\/]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[._-]+|[._-]+$/g, "");

  if (!normalized) {
    return "media";
  }

  return normalized.slice(0, 64);
}

export function getMediaKindFromMime(mimeType: string): "image" | "video" | null {
  if (mimeType.startsWith("image/")) {
    return "image";
  }
  if (mimeType.startsWith("video/")) {
    return "video";
  }
  return null;
}

export function normalizeModuleMediaUploadFile(input: {
  orgId: string;
  campaignId: string;
  moduleId: string;
  embedId: string;
  fileName: string;
  mimeType: string;
}): { filePath: string; safeFileName: string; mimeType: string; kind: "image" | "video" } {
  const trimmedFileName = input.fileName.trim();
  if (!trimmedFileName) {
    throw new ApiError("VALIDATION_ERROR", "Uploaded file must include a valid name.", 400);
  }

  const extensionMatch = /\.([a-zA-Z0-9]+)$/.exec(trimmedFileName);
  if (!extensionMatch) {
    throw new ApiError("VALIDATION_ERROR", "Uploaded file must include an extension.", 400);
  }

  const extension = extensionMatch[1].toLowerCase() as keyof typeof EXTENSION_TO_MIME;
  const expectedMimeType = EXTENSION_TO_MIME[extension];
  if (!expectedMimeType) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Only PNG, JPG, WEBP, GIF, MP4, WEBM, and MOV files are supported.",
      400,
    );
  }

  if (expectedMimeType !== input.mimeType) {
    throw new ApiError(
      "VALIDATION_ERROR",
      `File extension .${extension} does not match MIME type ${input.mimeType}.`,
      400,
    );
  }

  const kind = getMediaKindFromMime(input.mimeType);
  if (!kind) {
    throw new ApiError("VALIDATION_ERROR", "Only image and video files are supported.", 400);
  }

  const baseFileName = trimmedFileName.slice(0, -1 * (extension.length + 1));
  const safeStem = sanitizeFileStem(baseFileName);
  const safeFileName = `${safeStem}.${extension}`;
  const filePath = `org/${input.orgId}/${input.campaignId}/${input.moduleId}/${input.embedId}-${safeFileName}`;

  return {
    filePath,
    safeFileName,
    mimeType: input.mimeType,
    kind,
  };
}
