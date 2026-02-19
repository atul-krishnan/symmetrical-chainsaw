"use client";

import { KeyRound, Lock, LogIn, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { z } from "zod";
import Link from "next/link";

import {
  authMagicLinkSchema,
  authResetRequestSchema,
  authSignInSchema,
  authSignUpSchema,
} from "@/lib/edtech/auth-validation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type MembershipPayload = {
  memberships: Array<{
    orgId: string;
    role: "owner" | "admin" | "manager" | "learner";
  }>;
};

type AuthMode = "sign-in" | "sign-up";
type PendingAction = "google" | "sign-in" | "sign-up" | "magic-link" | "password-reset" | null;

const getValidationMessage = (error: z.ZodError): string =>
  error.issues[0]?.message ?? "Please review your input and try again.";

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const loading = pendingAction !== null;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const getAccessToken = async (): Promise<string | null> => {
      const { data } = await supabase.auth.getSession();
      const currentToken = data.session?.access_token;
      if (currentToken) return currentToken;
      const refresh = await supabase.auth.refreshSession();
      return refresh.data.session?.access_token ?? null;
    };

    const resolvePostAuthRoute = async (token: string): Promise<string> => {
      const response = await fetch("/api/me/org-memberships", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return "/product/admin/dashboard";
      const body = (await response.json()) as MembershipPayload;
      if (!Array.isArray(body.memberships) || body.memberships.length === 0) return "/product/admin/dashboard";
      if (body.memberships.length === 1) {
        const membership = body.memberships[0];
        if (membership.role === "learner") return `/product/learn?org=${membership.orgId}`;
        return `/product/admin/dashboard?org=${membership.orgId}`;
      }
      return "/product/admin/dashboard";
    };

    let active = true;
    void getAccessToken().then(async (token) => {
      if (!active || !token) return;
      const route = await resolvePostAuthRoute(token);
      if (active) router.replace(route);
    });

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.access_token || !active) return;
      const route = await resolvePostAuthRoute(session.access_token);
      if (active) router.replace(route);
    });

    return () => { active = false; data.subscription.unsubscribe(); };
  }, [router]);

  const resetFeedback = () => {
    setError(null);
    setStatus(null);
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    resetFeedback();
  };

  const signInWithGoogle = async () => {
    resetFeedback();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Supabase not configured."); return; }
    setPendingAction("google");
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/product/auth` },
    });
    setPendingAction(null);
    if (e) setError(`${e.message}. Enable Google provider in Supabase Auth settings.`);
  };

  const signInWithPassword = async () => {
    resetFeedback();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Supabase not configured."); return; }

    const payloadResult = authSignInSchema.safeParse({ email, password });
    if (!payloadResult.success) {
      setError(getValidationMessage(payloadResult.error));
      return;
    }

    setPendingAction("sign-in");
    const { error: e } = await supabase.auth.signInWithPassword(payloadResult.data);
    setPendingAction(null);
    if (e) setError(e.message);
  };

  const signUpWithPassword = async () => {
    resetFeedback();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Supabase not configured."); return; }

    const payloadResult = authSignUpSchema.safeParse({
      fullName,
      email,
      password,
      confirmPassword,
    });
    if (!payloadResult.success) {
      setError(getValidationMessage(payloadResult.error));
      return;
    }

    setPendingAction("sign-up");
    const { data, error: e } = await supabase.auth.signUp({
      email: payloadResult.data.email,
      password: payloadResult.data.password,
      options: {
        data: { full_name: payloadResult.data.fullName },
        emailRedirectTo: `${window.location.origin}/product/auth`,
      },
    });
    setPendingAction(null);

    if (e) {
      setError(e.message);
      return;
    }

    if (data.session?.access_token) {
      setStatus("Account created. Routing to your workspace.");
      return;
    }

    setStatus("Account created. Verify your email from the inbox, then sign in.");
    setMode("sign-in");
    setPassword("");
    setConfirmPassword("");
  };

  const sendMagicLink = async () => {
    resetFeedback();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Supabase not configured."); return; }

    const payloadResult = authMagicLinkSchema.safeParse({ email });
    if (!payloadResult.success) {
      setError(getValidationMessage(payloadResult.error));
      return;
    }

    setPendingAction("magic-link");
    const { error: e } = await supabase.auth.signInWithOtp({
      email: payloadResult.data.email,
      options: {
        emailRedirectTo: `${window.location.origin}/product/auth`,
        shouldCreateUser: mode === "sign-up",
        data: mode === "sign-up" && fullName.trim().length > 0 ? { full_name: fullName.trim() } : undefined,
      },
    });
    setPendingAction(null);
    if (e) { setError(e.message); return; }
    setStatus(
      mode === "sign-up"
        ? "Magic link sent. Complete signup from your inbox to activate the account."
        : "Magic link sent — check your inbox.",
    );
  };

  const sendPasswordResetLink = async () => {
    resetFeedback();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase not configured.");
      return;
    }

    const payloadResult = authResetRequestSchema.safeParse({ email });
    if (!payloadResult.success) {
      setError(getValidationMessage(payloadResult.error));
      return;
    }

    setPendingAction("password-reset");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(payloadResult.data.email, {
      redirectTo: `${window.location.origin}/product/auth/reset`,
    });
    setPendingAction(null);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setStatus("Password reset link sent. Check your inbox to continue.");
  };

  return (
    <div className="card w-full max-w-[560px] rounded-[1.6rem] p-6 shadow-md sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Image
          alt="PolicyPilot logo"
          height={36}
          src="/logo.png"
          width={36}
        />
        <div>
          <p className="text-base font-semibold text-[var(--text-primary)]">PolicyPilot</p>
          <p className="text-xs text-[var(--text-muted)]">Enterprise AI Compliance Training</p>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="mb-5 inline-flex w-full rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-1">
          <button
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
              mode === "sign-in"
                ? "bg-white text-[var(--text-primary)] shadow-[var(--shadow-xs)]"
                : "text-[var(--text-muted)]"
            }`}
            onClick={() => switchMode("sign-in")}
            type="button"
          >
            Sign in
          </button>
          <button
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
              mode === "sign-up"
                ? "bg-white text-[var(--text-primary)] shadow-[var(--shadow-xs)]"
                : "text-[var(--text-muted)]"
            }`}
            onClick={() => switchMode("sign-up")}
            type="button"
          >
            Sign up
          </button>
        </div>

        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {mode === "sign-in" ? "Sign in to your workspace" : "Create your workspace account"}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {mode === "sign-in"
            ? "Use Google SSO, email + password, or a secure magic link."
            : "No Google account required. Sign up with work email and password, then join your org workspace."}
        </p>

        {/* Google SSO */}
        <button
          className="btn btn-primary btn-lg mt-6 w-full"
          disabled={loading}
          onClick={() => void signInWithGoogle()}
          type="button"
        >
          <KeyRound className="h-4 w-4" />
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative my-6 flex items-center">
          <div className="flex-1 border-t border-[var(--border)]" />
          <span className="mx-3 text-xs text-[var(--text-faint)]">
            {mode === "sign-in" ? "or sign in with email" : "or create account with email"}
          </span>
          <div className="flex-1 border-t border-[var(--border)]" />
        </div>

        {/* Email + Password form */}
        <div className="space-y-4">
          {mode === "sign-up" ? (
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="auth-full-name">
                Full name
              </label>
              <input
                autoComplete="name"
                className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:border-[var(--accent)]"
                id="auth-full-name"
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                type="text"
                value={fullName}
              />
            </div>
          ) : null}

          <div>
            <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="auth-email">Email</label>
            <input
              autoComplete="email"
              className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:border-[var(--accent)]"
              id="auth-email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              type="email"
              value={email}
            />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="auth-password">Password</label>
              {mode === "sign-in" ? (
                <button
                  className="text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)]"
                  disabled={loading}
                  onClick={() => void sendPasswordResetLink()}
                  type="button"
                >
                  Forgot password?
                </button>
              ) : null}
            </div>
            <div className="relative mt-1">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
              <input
                autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-white pl-10 pr-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:border-[var(--accent)]"
                id="auth-password"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  if (mode === "sign-up") {
                    void signUpWithPassword();
                    return;
                  }
                  void signInWithPassword();
                }}
                placeholder="Enter password"
                type="password"
                value={password}
              />
            </div>
          </div>

          {mode === "sign-up" ? (
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="auth-confirm-password">
                Confirm password
              </label>
              <input
                autoComplete="new-password"
                className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:border-[var(--accent)]"
                id="auth-confirm-password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void signUpWithPassword();
                  }
                }}
                placeholder="Re-enter password"
                type="password"
                value={confirmPassword}
              />
              <p className="mt-1 text-xs text-[var(--text-faint)]">
                Use 10+ characters with uppercase, lowercase, and a number.
              </p>
            </div>
          ) : null}

          <button
            className="btn btn-primary w-full"
            disabled={loading}
            onClick={() => {
              if (mode === "sign-up") {
                void signUpWithPassword();
                return;
              }
              void signInWithPassword();
            }}
            type="button"
          >
            <LogIn className="h-4 w-4" />
            {loading
              ? mode === "sign-up"
                ? "Creating account…"
                : "Signing in…"
              : mode === "sign-up"
                ? "Create account"
                : "Sign In"}
          </button>

          <button
            className="btn btn-secondary w-full"
            disabled={loading}
            onClick={() => void sendMagicLink()}
            type="button"
          >
            <Mail className="h-4 w-4" />
            {mode === "sign-up" ? "Create with Magic Link" : "Send Magic Link Instead"}
          </button>
        </div>

        {status && (
          <p className="mt-4 rounded-lg border border-[var(--success-border)] bg-[var(--success-bg)] px-4 py-2 text-sm text-[var(--success)]">
            {status}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 py-2 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-[var(--text-faint)]">
          Your data is encrypted at rest and in transit. By continuing, you agree to the Terms of Service.
        </p>
        <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
          {mode === "sign-up" ? "Already have an account?" : "Need a new account?"}{" "}
          <button
            className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)]"
            onClick={() => switchMode(mode === "sign-up" ? "sign-in" : "sign-up")}
            type="button"
          >
            {mode === "sign-up" ? "Sign in instead" : "Create one now"}
          </button>
        </p>
        <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
          Having trouble with the link?{" "}
          <Link className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)]" href="/product/auth/reset">
            Open reset page
          </Link>
        </p>
      </div>
    </div>
  );
}
