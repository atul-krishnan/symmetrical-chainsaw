import { describe, expect, it } from "vitest";

import {
  getMediaKindFromMime,
  normalizeModuleMediaUploadFile,
} from "@/lib/edtech/module-media";

describe("module media upload normalization", () => {
  it("normalizes valid image upload path", () => {
    const result = normalizeModuleMediaUploadFile({
      orgId: "f48edf3f-082a-4eb5-ba89-3326c2d1fa6a",
      campaignId: "4ca0f1f1-f5dc-4e54-af53-c957be92ba14",
      moduleId: "3be12cb0-731f-4050-8a2a-24e7fe8f6efb",
      embedId: "9cb6d529-5cb8-4d30-b086-d2334a930381",
      fileName: "architecture diagram.png",
      mimeType: "image/png",
    });

    expect(result.kind).toBe("image");
    expect(result.filePath).toContain("org/f48edf3f-082a-4eb5-ba89-3326c2d1fa6a/");
    expect(result.safeFileName.endsWith(".png")).toBe(true);
  });

  it("rejects extension and MIME mismatch", () => {
    expect(() =>
      normalizeModuleMediaUploadFile({
        orgId: "f48edf3f-082a-4eb5-ba89-3326c2d1fa6a",
        campaignId: "4ca0f1f1-f5dc-4e54-af53-c957be92ba14",
        moduleId: "3be12cb0-731f-4050-8a2a-24e7fe8f6efb",
        embedId: "9cb6d529-5cb8-4d30-b086-d2334a930381",
        fileName: "demo.png",
        mimeType: "video/mp4",
      }),
    ).toThrow(/does not match MIME type/i);
  });

  it("maps media kind from MIME type", () => {
    expect(getMediaKindFromMime("image/webp")).toBe("image");
    expect(getMediaKindFromMime("video/webm")).toBe("video");
    expect(getMediaKindFromMime("application/pdf")).toBeNull();
  });
});
