import { z } from "zod";

const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 72;

const workEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid work email.");

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`)
  .refine((value) => /[a-z]/.test(value), "Password must include a lowercase letter.")
  .refine((value) => /[A-Z]/.test(value), "Password must include an uppercase letter.")
  .refine((value) => /\d/.test(value), "Password must include a number.");

export const authSignInSchema = z.object({
  email: workEmailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const authMagicLinkSchema = z.object({
  email: workEmailSchema,
});

export const authSignUpSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name.").max(80, "Full name is too long."),
    email: workEmailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .superRefine(({ password, confirmPassword }, context) => {
    if (password !== confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export const authResetRequestSchema = z.object({
  email: workEmailSchema,
});

export const authResetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .superRefine(({ password, confirmPassword }, context) => {
    if (password !== confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });
