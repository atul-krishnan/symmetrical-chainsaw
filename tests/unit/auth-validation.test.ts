import { describe, expect, it } from "vitest";

import {
  authResetPasswordSchema,
  authResetRequestSchema,
  authSignInSchema,
  authSignUpSchema,
} from "@/lib/edtech/auth-validation";

describe("auth validation schemas", () => {
  it("accepts valid sign-in payload", () => {
    const result = authSignInSchema.safeParse({
      email: "user@company.com",
      password: "ValidPass123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects weak signup password", () => {
    const result = authSignUpSchema.safeParse({
      fullName: "Jane Doe",
      email: "jane@company.com",
      password: "weak",
      confirmPassword: "weak",
    });

    expect(result.success).toBe(false);
  });

  it("rejects reset password mismatch", () => {
    const result = authResetPasswordSchema.safeParse({
      password: "StrongPass123",
      confirmPassword: "StrongPass124",
    });

    expect(result.success).toBe(false);
  });

  it("requires valid email for reset request", () => {
    const result = authResetRequestSchema.safeParse({
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
  });
});
