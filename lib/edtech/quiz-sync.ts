import { createHash } from "node:crypto";

export type QuizSyncSource = {
  roleTrack: string;
  title: string;
  summary: string;
  contentMarkdown: string;
};

export function computeQuizSyncHash(input: QuizSyncSource): string {
  const payload = JSON.stringify({
    roleTrack: input.roleTrack.trim(),
    title: input.title.trim(),
    summary: input.summary.trim(),
    contentMarkdown: input.contentMarkdown.trim(),
  });

  return createHash("sha256").update(payload).digest("hex");
}

export function quizNeedsRegeneration(
  storedHash: string | null | undefined,
  input: QuizSyncSource,
): boolean {
  if (!storedHash) {
    return true;
  }

  return storedHash !== computeQuizSyncHash(input);
}
