import { ApiError } from "@/lib/api/errors";

const EXTENSION_TO_MIME = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
} as const;

type SupportedExtension = keyof typeof EXTENSION_TO_MIME;

function sanitizeFileStem(fileName: string): string {
  const normalized = fileName
    .normalize("NFKD")
    .replace(/[\\/]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[._-]+|[._-]+$/g, "");

  if (!normalized) {
    return "policy";
  }

  return normalized.slice(0, 64);
}

export function normalizePolicyUploadFile(input: {
  orgId: string;
  policyId: string;
  fileName: string;
  mimeType: string;
}): { filePath: string; extension: SupportedExtension; safeFileName: string } {
  const trimmedFileName = input.fileName.trim();
  if (!trimmedFileName) {
    throw new ApiError("VALIDATION_ERROR", "Uploaded file must include a valid name.", 400);
  }

  const extensionMatch = /\.([a-zA-Z0-9]+)$/.exec(trimmedFileName);
  if (!extensionMatch) {
    throw new ApiError("VALIDATION_ERROR", "Uploaded file must include an extension.", 400);
  }

  const extension = extensionMatch[1].toLowerCase() as SupportedExtension;
  const expectedMimeType = EXTENSION_TO_MIME[extension];
  if (!expectedMimeType) {
    throw new ApiError("VALIDATION_ERROR", "Only PDF, DOCX, and TXT files are supported.", 400);
  }

  if (expectedMimeType !== input.mimeType) {
    throw new ApiError(
      "VALIDATION_ERROR",
      `File extension .${extension} does not match MIME type ${input.mimeType}.`,
      400,
    );
  }

  const baseFileName = trimmedFileName.slice(0, -1 * (extension.length + 1));
  const safeStem = sanitizeFileStem(baseFileName);
  const safeFileName = `${safeStem}.${extension}`;
  const filePath = `org/${input.orgId}/${input.policyId}-${safeFileName}`;

  return {
    filePath,
    extension,
    safeFileName,
  };
}
