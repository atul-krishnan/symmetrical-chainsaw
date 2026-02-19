import { describe, expect, it } from "vitest";

import { computeQuizSyncHash, quizNeedsRegeneration } from "@/lib/edtech/quiz-sync";

describe("quiz sync hash", () => {
  const source = {
    roleTrack: "builder",
    title: "Builder Readiness",
    summary: "Policy-grounded builder training",
    contentMarkdown: "## Content\n\n- follow policy",
  };

  it("is deterministic for same input", () => {
    const a = computeQuizSyncHash(source);
    const b = computeQuizSyncHash(source);
    expect(a).toBe(b);
  });

  it("changes when learning content changes", () => {
    const a = computeQuizSyncHash(source);
    const b = computeQuizSyncHash({ ...source, contentMarkdown: `${source.contentMarkdown}\n\n- extra` });
    expect(a).not.toBe(b);
  });

  it("requires regeneration when hash is missing or stale", () => {
    const hash = computeQuizSyncHash(source);

    expect(quizNeedsRegeneration(null, source)).toBe(true);
    expect(quizNeedsRegeneration(hash, source)).toBe(false);
    expect(quizNeedsRegeneration(hash, { ...source, title: "Updated" })).toBe(true);
  });
});
