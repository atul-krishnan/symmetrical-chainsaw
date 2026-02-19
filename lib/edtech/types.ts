import { z } from "zod";

export const learningFlowVersionSchema = z.union([z.literal(1), z.literal(2)]);
export type LearningFlowVersion = z.infer<typeof learningFlowVersionSchema>;

export const moduleMediaKindSchema = z.enum(["image", "video"]);
export const moduleMediaStatusSchema = z.enum(["suggested", "attached"]);

export const llmMediaSuggestionSchema = z.object({
  kind: moduleMediaKindSchema,
  title: z.string().min(3).max(120),
  caption: z.string().min(6).max(320),
  suggestionPrompt: z.string().min(10).max(420),
});

export const moduleMediaEmbedSchema = z.object({
  id: z.string().uuid(),
  kind: moduleMediaKindSchema,
  title: z.string().min(3).max(120),
  caption: z.string().min(6).max(320),
  suggestionPrompt: z.string().min(10).max(420),
  assetPath: z.string().min(1).max(500).nullable(),
  mimeType: z.string().min(1).max(160).nullable(),
  status: moduleMediaStatusSchema,
  order: z.number().int().min(0).max(24),
});

export type ModuleMediaEmbed = z.infer<typeof moduleMediaEmbedSchema>;

export const llmQuizQuestionSchema = z.object({
  prompt: z.string().min(12).max(220),
  choices: z.array(z.string().min(1).max(180)).length(4),
  correctChoiceIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(10).max(320),
});

export type LlmQuizQuestion = z.infer<typeof llmQuizQuestionSchema>;

export const llmLearningModuleSchema = z.object({
  roleTrack: z.enum(["exec", "builder", "general"]),
  title: z.string().min(5).max(120),
  summary: z.string().min(20).max(300),
  contentMarkdown: z.string().min(80).max(5000),
  passScore: z.number().int().min(60).max(100),
  estimatedMinutes: z.number().int().min(3).max(40),
  mediaSuggestions: z.array(llmMediaSuggestionSchema).min(1).max(4),
});

export type LlmLearningModule = z.infer<typeof llmLearningModuleSchema>;

export const llmLearningDraftSchema = z.object({
  modules: z.array(llmLearningModuleSchema).min(1).max(3),
});

export type LlmLearningDraft = z.infer<typeof llmLearningDraftSchema>;

export const llmModuleQuizSchema = z.object({
  quizQuestions: z.array(llmQuizQuestionSchema).min(3).max(8),
});

export type LlmModuleQuizDraft = z.infer<typeof llmModuleQuizSchema>;

export type GeneratedCampaignModule = {
  roleTrack: "exec" | "builder" | "general";
  title: string;
  summary: string;
  contentMarkdown: string;
  passScore: number;
  estimatedMinutes: number;
  mediaEmbeds: ModuleMediaEmbed[];
  quizQuestions: LlmQuizQuestion[];
  quizSyncHash: string;
};

export type GeneratedCampaignDraft = {
  flowVersion: 2;
  modules: GeneratedCampaignModule[];
};
