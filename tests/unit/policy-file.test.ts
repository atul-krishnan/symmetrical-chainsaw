import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors";
import { normalizePolicyUploadFile } from "@/lib/edtech/policy-file";

describe("normalizePolicyUploadFile", () => {
  it("builds a safe storage path for valid files", () => {
    const result = normalizePolicyUploadFile({
      orgId: "f8ef8cf3-8f3d-4fdd-8cd7-87f1164ca1e7",
      policyId: "b57c7e8a-dde1-4f6f-98d2-7a90f41a2f33",
      fileName: "AI Policy Final 2026!.pdf",
      mimeType: "application/pdf",
    });

    expect(result.filePath).toContain("org/f8ef8cf3-8f3d-4fdd-8cd7-87f1164ca1e7/");
    expect(result.filePath.endsWith(".pdf")).toBe(true);
    expect(result.safeFileName).toBe("AI-Policy-Final-2026.pdf");
  });

  it("rejects MIME and extension mismatches", () => {
    expect(() =>
      normalizePolicyUploadFile({
        orgId: "f8ef8cf3-8f3d-4fdd-8cd7-87f1164ca1e7",
        policyId: "b57c7e8a-dde1-4f6f-98d2-7a90f41a2f33",
        fileName: "policy.pdf",
        mimeType: "text/plain",
      }),
    ).toThrowError(ApiError);
  });
});
