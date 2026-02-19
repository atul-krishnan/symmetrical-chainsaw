import { describe, expect, it } from "vitest";

import {
  generateCampaignDraft,
  generateModuleQuizFromLearningMaterial,
} from "@/lib/edtech/campaign-generator";

describe("campaign generator v2", () => {
  it("generates flow v2 modules with media embeds and sync hashes", async () => {
    const draft = await generateCampaignDraft({
      campaignName: "AI Policy Rollout",
      obligations: [
        {
          roleTrack: "exec",
          detail: "Executives must approve AI initiatives with customer impact.",
        },
        {
          roleTrack: "builder",
          detail: "Builders must log model inference calls and avoid unapproved datasets.",
        },
      ],
      roleTracks: ["exec", "builder"],
    });

    expect(draft.flowVersion).toBe(2);
    expect(draft.modules).toHaveLength(2);

    for (const moduleDraft of draft.modules) {
      expect(moduleDraft.mediaEmbeds.length).toBeGreaterThan(0);
      expect(moduleDraft.quizQuestions.length).toBeGreaterThanOrEqual(3);
      expect(moduleDraft.quizSyncHash.length).toBeGreaterThan(12);
    }
  });

  it("generates quiz questions from learning material", async () => {
    const quiz = await generateModuleQuizFromLearningMaterial({
      roleTrack: "general",
      title: "General Readiness",
      summary: "Core policy obligations for all staff.",
      contentMarkdown:
        "## Required behavior\n\n- Never paste confidential data into unapproved tools.\n- Escalate uncertainty.",
      passScore: 80,
      estimatedMinutes: 8,
    });

    expect(quiz.length).toBeGreaterThanOrEqual(3);
    expect(quiz[0]?.choices).toHaveLength(4);
  });
});
