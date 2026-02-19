import { randomUUID } from "node:crypto";

import OpenAI from "openai";

import { runtimeEnv } from "@/lib/env";
import { computeQuizSyncHash } from "@/lib/edtech/quiz-sync";
import {
  llmLearningDraftSchema,
  llmModuleQuizSchema,
  type GeneratedCampaignDraft,
  type LlmLearningModule,
  type LlmModuleQuizDraft,
  type LlmQuizQuestion,
  type ModuleMediaEmbed,
} from "@/lib/edtech/types";
import type { RoleTrack } from "@/lib/types";

type GenerateDraftInput = {
  campaignName: string;
  obligations: Array<{ detail: string; roleTrack: RoleTrack }>;
  roleTracks: RoleTrack[];
};

type QuizGenerationInput = Pick<
  LlmLearningModule,
  "roleTrack" | "title" | "summary" | "contentMarkdown" | "passScore" | "estimatedMinutes"
>;

const DEFAULT_TRACKS: RoleTrack[] = ["exec", "builder", "general"];

function orderedTracks(roleTracks: RoleTrack[]): RoleTrack[] {
  const unique = Array.from(new Set(roleTracks));
  const filtered = DEFAULT_TRACKS.filter((track) => unique.includes(track));
  return filtered.length > 0 ? filtered : DEFAULT_TRACKS;
}

function obligationByTrack(input: GenerateDraftInput): Record<RoleTrack, string[]> {
  return input.obligations.reduce<Record<RoleTrack, string[]>>(
    (acc, item) => {
      acc[item.roleTrack].push(item.detail);
      return acc;
    },
    { exec: [], builder: [], general: [] },
  );
}

function fallbackLearningModule(
  campaignName: string,
  roleTrack: RoleTrack,
  index: number,
  obligations: string[],
): LlmLearningModule {
  const highlights = obligations.slice(0, 4);
  const bulletList =
    highlights.length > 0
      ? highlights.map((item) => `- ${item}`).join("\n")
      : "- Follow approved AI use cases and escalate uncertainty early.";

  const roleLabel = roleTrack[0].toUpperCase() + roleTrack.slice(1);

  return {
    roleTrack,
    title: `${campaignName}: ${roleLabel} Readiness`,
    summary: `Policy-grounded training for ${roleTrack} teams with concrete behavior standards and escalation paths.`,
    contentMarkdown: `## Why this matters\n\nYour role has direct accountability for compliant AI usage and policy adherence.\n\n## What you need to know\n\n${bulletList}\n\n## Practical decisions\n\n- Choose approved tools and approved data boundaries.\n- Escalate uncertainty before release decisions.\n- Preserve evidence and change logs for audits.\n\n## When to escalate\n\nEscalate to legal/security when policy interpretation is unclear or customer-impacting decisions are involved.`,
    passScore: 80,
    estimatedMinutes: 10 + index * 2,
    mediaSuggestions: [
      {
        kind: "image",
        title: `${roleLabel} policy decision map`,
        caption: "Visual map of escalation and approval checkpoints for this role track.",
        suggestionPrompt:
          "Create a clean process diagram showing policy decision checkpoints, escalation owners, and audit evidence outputs.",
      },
      {
        kind: "video",
        title: `${roleLabel} scenario walkthrough`,
        caption: "Short scenario walkthrough showing compliant and non-compliant outcomes.",
        suggestionPrompt:
          "Record a 60-90 second scenario walkthrough for this role track showing one compliant and one non-compliant policy decision.",
      },
    ],
  };
}

function fallbackLearningDraft(input: GenerateDraftInput): { modules: LlmLearningModule[] } {
  const byTrack = obligationByTrack(input);
  const tracks = orderedTracks(input.roleTracks);

  return {
    modules: tracks.map((track, index) =>
      fallbackLearningModule(input.campaignName, track, index, byTrack[track]),
    ),
  };
}

function fallbackQuizFromLearningMaterial(input: QuizGenerationInput): LlmQuizQuestion[] {
  const roleLabel = input.roleTrack[0].toUpperCase() + input.roleTrack.slice(1);

  return [
    {
      prompt: `For ${roleLabel} teams, what is the safest first action when policy direction is unclear?`,
      choices: [
        "Proceed quickly and document later",
        "Escalate to policy/security/legal owner before execution",
        "Ask for informal peer approval only",
        "Ignore the work item",
      ],
      correctChoiceIndex: 1,
      explanation: "Escalation before execution preserves compliant, auditable decision quality.",
    },
    {
      prompt: "Which behavior best aligns with enterprise AI policy controls?",
      choices: [
        "Use unapproved tools when deadlines are tight",
        "Skip change logs to move faster",
        "Follow approved tools, boundaries, and review gates",
        "Share sensitive inputs in public systems",
      ],
      correctChoiceIndex: 2,
      explanation: "Approved tools and review gates are required to enforce policy controls.",
    },
    {
      prompt: "What outcome does this learning module primarily support?",
      choices: [
        "Reducing need for legal review",
        "Increasing slide count",
        "Creating role-specific policy behavior with audit-ready evidence",
        "Replacing engineering standards",
      ],
      correctChoiceIndex: 2,
      explanation:
        "The module is designed for role-specific behavior change with evidence-ready compliance outcomes.",
    },
  ];
}

function toMediaEmbeds(suggestions: LlmLearningModule["mediaSuggestions"]): ModuleMediaEmbed[] {
  return suggestions.map((item, index) => ({
    id: randomUUID(),
    kind: item.kind,
    title: item.title,
    caption: item.caption,
    suggestionPrompt: item.suggestionPrompt,
    assetPath: null,
    mimeType: null,
    status: "suggested",
    order: index,
  }));
}

function normalizeStageOneModules(
  input: GenerateDraftInput,
  aiDraft: { modules: LlmLearningModule[] } | null,
): LlmLearningModule[] {
  const fallback = fallbackLearningDraft(input);
  const tracks = orderedTracks(input.roleTracks);

  if (!aiDraft) {
    return fallback.modules;
  }

  const byTrack = new Map<RoleTrack, LlmLearningModule>();
  for (const moduleDraft of aiDraft.modules) {
    if (!byTrack.has(moduleDraft.roleTrack)) {
      byTrack.set(moduleDraft.roleTrack, moduleDraft);
    }
  }

  return tracks.map((track) => {
    const fromAi = byTrack.get(track);
    if (fromAi) {
      return fromAi;
    }

    const fromFallback = fallback.modules.find((item) => item.roleTrack === track);
    if (fromFallback) {
      return fromFallback;
    }

    return fallbackLearningModule(input.campaignName, track, 0, []);
  });
}

async function createOpenAiClient(): Promise<OpenAI | null> {
  if (!runtimeEnv.openAiApiKey) {
    return null;
  }

  return new OpenAI({ apiKey: runtimeEnv.openAiApiKey });
}

async function generateLearningDraftWithOpenAi(
  client: OpenAI,
  input: GenerateDraftInput,
): Promise<{ modules: LlmLearningModule[] } | null> {
  const tracks = orderedTracks(input.roleTracks);

  const prompt = [
    `Create role-specific learning modules for this campaign: ${input.campaignName}.`,
    `Only include these role tracks: ${tracks.join(", ")}.`,
    "For each module, focus on role-specific explanation, practical behavior guidance, and escalation rules.",
    "Provide 1-4 media suggestions per module. Suggestions should be practical and enterprise-safe.",
    "Policy obligations:",
    ...input.obligations.slice(0, 30).map((obligation) => `- [${obligation.roleTrack}] ${obligation.detail}`),
  ].join("\n");

  const response = await client.responses.create({
    model: runtimeEnv.openAiModel,
    input: [
      {
        role: "system",
        content:
          "You are an enterprise compliance learning designer. Return strict JSON matching the schema.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "learning_draft",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["modules"],
          properties: {
            modules: {
              type: "array",
              minItems: 1,
              maxItems: 3,
              items: {
                type: "object",
                additionalProperties: false,
                required: [
                  "roleTrack",
                  "title",
                  "summary",
                  "contentMarkdown",
                  "passScore",
                  "estimatedMinutes",
                  "mediaSuggestions",
                ],
                properties: {
                  roleTrack: { type: "string", enum: ["exec", "builder", "general"] },
                  title: { type: "string", minLength: 5, maxLength: 120 },
                  summary: { type: "string", minLength: 20, maxLength: 300 },
                  contentMarkdown: { type: "string", minLength: 80, maxLength: 5000 },
                  passScore: { type: "integer", minimum: 60, maximum: 100 },
                  estimatedMinutes: { type: "integer", minimum: 3, maximum: 40 },
                  mediaSuggestions: {
                    type: "array",
                    minItems: 1,
                    maxItems: 4,
                    items: {
                      type: "object",
                      additionalProperties: false,
                      required: ["kind", "title", "caption", "suggestionPrompt"],
                      properties: {
                        kind: { type: "string", enum: ["image", "video"] },
                        title: { type: "string", minLength: 3, maxLength: 120 },
                        caption: { type: "string", minLength: 6, maxLength: 320 },
                        suggestionPrompt: { type: "string", minLength: 10, maxLength: 420 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  } as never);

  const output = (response as { output_text?: string }).output_text;
  if (!output) {
    return null;
  }

  const parsed = llmLearningDraftSchema.safeParse(JSON.parse(output));
  return parsed.success ? parsed.data : null;
}

async function generateQuizWithOpenAi(
  client: OpenAI,
  input: QuizGenerationInput,
): Promise<LlmQuizQuestion[] | null> {
  const prompt = [
    "Generate a quiz for the following learning module.",
    "Quiz should validate behavior-level understanding and decision quality.",
    `Role track: ${input.roleTrack}`,
    `Module title: ${input.title}`,
    `Summary: ${input.summary}`,
    "Content:",
    input.contentMarkdown,
  ].join("\n\n");

  const response = await client.responses.create({
    model: runtimeEnv.openAiModel,
    input: [
      {
        role: "system",
        content:
          "You are an enterprise compliance assessment designer. Return strict JSON matching the schema.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "module_quiz",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["quizQuestions"],
          properties: {
            quizQuestions: {
              type: "array",
              minItems: 3,
              maxItems: 8,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["prompt", "choices", "correctChoiceIndex", "explanation"],
                properties: {
                  prompt: { type: "string", minLength: 12, maxLength: 220 },
                  choices: {
                    type: "array",
                    minItems: 4,
                    maxItems: 4,
                    items: { type: "string", minLength: 1, maxLength: 180 },
                  },
                  correctChoiceIndex: { type: "integer", minimum: 0, maximum: 3 },
                  explanation: { type: "string", minLength: 10, maxLength: 320 },
                },
              },
            },
          },
        },
      },
    },
  } as never);

  const output = (response as { output_text?: string }).output_text;
  if (!output) {
    return null;
  }

  const parsed = llmModuleQuizSchema.safeParse(JSON.parse(output));
  return parsed.success ? parsed.data.quizQuestions : null;
}

export async function generateModuleQuizFromLearningMaterial(
  input: QuizGenerationInput,
): Promise<LlmQuizQuestion[]> {
  const client = await createOpenAiClient();
  if (!client) {
    return fallbackQuizFromLearningMaterial(input);
  }

  const aiQuiz = await generateQuizWithOpenAi(client, input).catch(() => null);
  return aiQuiz ?? fallbackQuizFromLearningMaterial(input);
}

function mapModuleForQuizGeneration(moduleDraft: LlmLearningModule): QuizGenerationInput {
  return {
    roleTrack: moduleDraft.roleTrack,
    title: moduleDraft.title,
    summary: moduleDraft.summary,
    contentMarkdown: moduleDraft.contentMarkdown,
    passScore: moduleDraft.passScore,
    estimatedMinutes: moduleDraft.estimatedMinutes,
  };
}

export async function generateCampaignDraft(input: GenerateDraftInput): Promise<GeneratedCampaignDraft> {
  const client = await createOpenAiClient();

  const stageOne = client
    ? await generateLearningDraftWithOpenAi(client, input).catch(() => null)
    : null;

  const modulesStageOne = normalizeStageOneModules(input, stageOne);

  const modules = await Promise.all(
    modulesStageOne.map(async (moduleDraft) => {
      const quizQuestions = client
        ? (await generateQuizWithOpenAi(client, mapModuleForQuizGeneration(moduleDraft)).catch(
            () => null,
          )) ?? fallbackQuizFromLearningMaterial(mapModuleForQuizGeneration(moduleDraft))
        : fallbackQuizFromLearningMaterial(mapModuleForQuizGeneration(moduleDraft));

      const mediaEmbeds = toMediaEmbeds(moduleDraft.mediaSuggestions);

      return {
        roleTrack: moduleDraft.roleTrack,
        title: moduleDraft.title,
        summary: moduleDraft.summary,
        contentMarkdown: moduleDraft.contentMarkdown,
        passScore: moduleDraft.passScore,
        estimatedMinutes: moduleDraft.estimatedMinutes,
        mediaEmbeds,
        quizQuestions,
        quizSyncHash: computeQuizSyncHash({
          roleTrack: moduleDraft.roleTrack,
          title: moduleDraft.title,
          summary: moduleDraft.summary,
          contentMarkdown: moduleDraft.contentMarkdown,
        }),
      };
    }),
  );

  return {
    flowVersion: 2,
    modules,
  };
}

export type { GenerateDraftInput, QuizGenerationInput, LlmModuleQuizDraft };
