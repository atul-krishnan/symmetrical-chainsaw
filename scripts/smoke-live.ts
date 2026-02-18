import "dotenv/config";

import { randomUUID } from "node:crypto";

type SmokeStep = {
  name: string;
  status: "passed" | "failed";
  details: Record<string, unknown>;
};

type SmokeReport = {
  ok: boolean;
  environment: string;
  baseUrl: string;
  orgId: string | null;
  campaignId: string | null;
  startedAt: string;
  finishedAt: string;
  steps: SmokeStep[];
  failure?: {
    step: string;
    message: string;
  };
};

type OrgMembership = {
  orgId: string;
  orgName: string;
  role: "owner" | "admin" | "manager" | "learner";
};

type CampaignDetail = {
  campaign: {
    id: string;
  };
  modules: Array<{
    id: string;
    quizQuestions: Array<{
      correctChoiceIndex?: number;
    }>;
  }>;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main(): Promise<void> {
  const startedAt = new Date().toISOString();
  const baseUrl = requiredEnv("SMOKE_BASE_URL").replace(/\/+$/, "");
  const accessToken = requiredEnv("SMOKE_ACCESS_TOKEN");
  const environment = process.env.SMOKE_ENV?.trim() || "staging";
  const preferredOrgId = process.env.SMOKE_ORG_ID?.trim() || null;

  const steps: SmokeStep[] = [];
  let orgId: string | null = null;
  let campaignId: string | null = null;

  const runStep = async <T>(
    name: string,
    task: () => Promise<{ details: Record<string, unknown>; value: T }>,
  ): Promise<T> => {
    try {
      const result = await task();
      steps.push({ name, status: "passed", details: result.details });
      return result.value;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected smoke failure";
      steps.push({ name, status: "failed", details: { message } });
      throw new Error(`${name}: ${message}`);
    }
  };

  const apiJson = async <T>(path: string, init?: RequestInit): Promise<{ response: Response; body: T }> => {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init?.headers ?? {}),
      },
    });

    const body = (await response.json()) as T;
    return { response, body };
  };

  try {
    const memberships = await runStep("membership_fetch", async () => {
      const { response, body } = await apiJson<
        { memberships: OrgMembership[] } | { error?: { message?: string } }
      >("/api/me/org-memberships");

      if (!response.ok || !("memberships" in body)) {
        throw new Error("Membership API failed");
      }

      return {
        details: {
          count: body.memberships.length,
        },
        value: body.memberships,
      };
    });

    const selectedMembership = preferredOrgId
      ? memberships.find((membership) => membership.orgId === preferredOrgId)
      : memberships[0];

    if (!selectedMembership) {
      throw new Error("No organization membership available for smoke run.");
    }

    orgId = selectedMembership.orgId;

    const upload = await runStep("policy_upload", async () => {
      const formData = new FormData();
      formData.append("title", `Smoke Policy ${new Date().toISOString()}`);
      formData.append(
        "file",
        new Blob(
          [
            [
              "Acceptable Use Policy\n",
              "1. Do not paste credentials into prompts.\n",
              "2. Route regulated output through manager review.\n",
            ].join(""),
          ],
          { type: "text/plain" },
        ),
        "smoke-policy.txt",
      );

      const response = await fetch(`${baseUrl}/api/orgs/${orgId}/policies`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const body = (await response.json()) as
        | { policyId: string; parseStatus: string }
        | { error?: { message?: string } };

      if (!response.ok || !("policyId" in body)) {
        throw new Error("Policy upload failed");
      }

      return {
        details: {
          policyId: body.policyId,
          parseStatus: body.parseStatus,
        },
        value: body,
      };
    });

    const generation = await runStep("campaign_generate", async () => {
      const response = await fetch(`${baseUrl}/api/orgs/${orgId}/campaigns/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `Smoke Campaign ${new Date().toISOString()}`,
          policyIds: [upload.policyId],
          roleTracks: ["exec", "builder", "general"],
          dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      const body = (await response.json()) as
        | { campaignId: string; status: string }
        | { error?: { message?: string } };

      if (!response.ok || !("campaignId" in body)) {
        throw new Error("Campaign generation failed");
      }

      return {
        details: {
          campaignId: body.campaignId,
          status: body.status,
        },
        value: body,
      };
    });

    campaignId = generation.campaignId;

    const campaignDetail = await runStep("campaign_detail", async () => {
      const { response, body } = await apiJson<CampaignDetail | { error?: { message?: string } }>(
        `/api/orgs/${orgId}/campaigns/${campaignId}`,
      );

      if (!response.ok || !("modules" in body)) {
        throw new Error("Campaign detail fetch failed");
      }

      return {
        details: {
          modules: body.modules.length,
        },
        value: body,
      };
    });

    await runStep("campaign_publish", async () => {
      const response = await fetch(`${baseUrl}/api/orgs/${orgId}/campaigns/${campaignId}/publish`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Idempotency-Key": `smoke-publish-${randomUUID()}`,
        },
      });

      const body = (await response.json()) as
        | {
            ok: boolean;
            assignmentsTotal: number;
            emailedCount: number;
            alreadyPublished: boolean;
          }
        | { error?: { message?: string } };

      if (!response.ok || !("ok" in body)) {
        throw new Error("Campaign publish failed");
      }

      return {
        details: {
          assignmentsTotal: body.assignmentsTotal,
          emailedCount: body.emailedCount,
          alreadyPublished: body.alreadyPublished,
        },
        value: body,
      };
    });

    const assignmentId = await runStep("assignment_fetch", async () => {
      const { response, body } = await apiJson<
        {
          items: Array<{
            id: string;
            module: { id: string; campaignId: string };
          }>;
        } | { error?: { message?: string } }
      >("/api/me/assignments");

      if (!response.ok || !("items" in body)) {
        throw new Error("Assignment fetch failed");
      }

      const target = body.items.find((item) => item.module.campaignId === campaignId);
      if (!target) {
        throw new Error("No assignment found for generated campaign");
      }

      return {
        details: {
          assignmentId: target.id,
        },
        value: target.id,
      };
    });

    await runStep("quiz_attempt", async () => {
      const targetModule =
        campaignDetail.modules.find((module) => module.quizQuestions.every((q) => typeof q.correctChoiceIndex === "number")) ??
        campaignDetail.modules[0];

      if (!assignmentId || !targetModule) {
        throw new Error("No target module available for quiz attempt");
      }

      const answers = targetModule.quizQuestions.map((question) => {
        if (typeof question.correctChoiceIndex !== "number") {
          throw new Error("Missing answer key for smoke quiz attempt");
        }

        return question.correctChoiceIndex;
      });

      const response = await fetch(`${baseUrl}/api/me/modules/${targetModule.id}/attempts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });

      const body = (await response.json()) as
        | { passed: boolean; scorePct: number }
        | { error?: { message?: string } };

      if (!response.ok || !("passed" in body)) {
        throw new Error("Quiz attempt failed");
      }

      return {
        details: {
          passed: body.passed,
          scorePct: body.scorePct,
        },
        value: body,
      };
    });

    await runStep("attestation_submit", async () => {
      const response = await fetch(`${baseUrl}/api/me/campaigns/${campaignId}/attest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signatureName: "Smoke Test Admin",
          accepted: true,
        }),
      });

      const body = (await response.json()) as
        | { checksum: string; attestedAt: string }
        | { error?: { message?: string } };

      if (!response.ok || !("checksum" in body)) {
        throw new Error("Attestation submit failed");
      }

      return {
        details: {
          checksum: body.checksum,
          attestedAt: body.attestedAt,
        },
        value: body,
      };
    });

    await runStep("csv_export", async () => {
      const response = await fetch(`${baseUrl}/api/orgs/${orgId}/exports/${campaignId}.csv`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const checksum = response.headers.get("x-evidence-checksum");
      const contentType = response.headers.get("content-type");

      if (!response.ok || !checksum || !contentType?.includes("text/csv")) {
        throw new Error("CSV export validation failed");
      }

      return {
        details: {
          checksum,
          contentType,
        },
        value: true,
      };
    });

    await runStep("pdf_export", async () => {
      const response = await fetch(`${baseUrl}/api/orgs/${orgId}/exports/${campaignId}.pdf`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const checksum = response.headers.get("x-evidence-checksum");
      const contentType = response.headers.get("content-type");

      if (!response.ok || !checksum || !contentType?.includes("application/pdf")) {
        throw new Error("PDF export validation failed");
      }

      return {
        details: {
          checksum,
          contentType,
        },
        value: true,
      };
    });

    const report: SmokeReport = {
      ok: true,
      environment,
      baseUrl,
      orgId,
      campaignId,
      startedAt,
      finishedAt: new Date().toISOString(),
      steps,
    };

    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected smoke failure";

    const report: SmokeReport = {
      ok: false,
      environment,
      baseUrl,
      orgId,
      campaignId,
      startedAt,
      finishedAt: new Date().toISOString(),
      steps,
      failure: {
        step: steps[steps.length - 1]?.name ?? "unknown",
        message,
      },
    };

    console.log(JSON.stringify(report, null, 2));
    process.exitCode = 1;
  }
}

void main();
