"use client";

import { ArrowLeft, KeyRound, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { z } from "zod";

import { authResetPasswordSchema } from "@/lib/edtech/auth-validation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type RecoveryState = "verifying" | "ready" | "done" | "error";

const getValidationMessage = (error: z.ZodError): string =>
  error.issues[0]?.message ?? "Please review your input and try again.";

export function ResetPasswordPanel() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<RecoveryState>("verifying");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const resolveRecoverySession = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setState("error");
        setError("Supabase is not configured in this environment.");
        return;
      }

      const fail = (message: string) => {
        setState("error");
        setError(message);
      };

      try {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type");

        if (code) {
          const exchange = await supabase.auth.exchangeCodeForSession(code);
          if (exchange.error) {
            fail("Reset link is invalid or expired. Request a new link from sign-in.");
            return;
          }
        } else if (tokenHash && type === "recovery") {
          const verify = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash,
          });
          if (verify.error) {
            fail("Reset link is invalid or expired. Request a new link from sign-in.");
            return;
          }
        } else {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          if (accessToken && refreshToken) {
            const setSession = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (setSession.error) {
              fail("Could not validate recovery session. Request a new reset link.");
              return;
            }
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session) {
          fail("No active recovery session found. Request a new reset link.");
          return;
        }

        setState("ready");
      } catch {
        fail("Could not validate reset link. Request a new reset link.");
      }
    };

    void resolveRecoverySession();
  }, []);

  const updatePassword = async () => {
    setError(null);
    setStatus(null);

    const validation = authResetPasswordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      setError(getValidationMessage(validation.error));
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured in this environment.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: validation.data.password,
    });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await supabase.auth.signOut();
    setState("done");
    setStatus("Password updated successfully. Sign in with your new password.");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="card w-full max-w-[560px] rounded-[1.6rem] p-6 shadow-md sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white">
            P
          </div>
          <div>
            <p className="text-base font-semibold text-[var(--text-primary)]">PolicyPilot</p>
            <p className="text-xs text-[var(--text-muted)]">Account recovery</p>
          </div>
        </div>
        <Link className="btn btn-ghost btn-sm" href="/product/auth">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reset your password</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Set a new password for your workspace account.
      </p>

      {state === "verifying" ? (
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-panel-alt)] p-4 text-sm text-[var(--text-muted)]">
          Validating reset link...
        </div>
      ) : null}

      {state === "ready" ? (
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="new-password">
              New password
            </label>
            <div className="relative mt-1">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
              <input
                autoComplete="new-password"
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-white pl-10 pr-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:border-[var(--accent)]"
                id="new-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                type="password"
                value={password}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="confirm-new-password">
              Confirm new password
            </label>
            <input
              autoComplete="new-password"
              className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:border-[var(--accent)]"
              id="confirm-new-password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void updatePassword();
                }
              }}
              placeholder="Re-enter new password"
              type="password"
              value={confirmPassword}
            />
            <p className="mt-1 text-xs text-[var(--text-faint)]">
              Use 10+ characters with uppercase, lowercase, and a number.
            </p>
          </div>

          <button
            className="btn btn-primary w-full"
            disabled={submitting}
            onClick={() => void updatePassword()}
            type="button"
          >
            <KeyRound className="h-4 w-4" />
            {submitting ? "Updating password..." : "Update password"}
          </button>
        </div>
      ) : null}

      {state === "done" ? (
        <div className="mt-6 space-y-3">
          <div className="rounded-xl border border-[var(--success-border)] bg-[var(--success-bg)] p-4 text-sm text-[var(--success)]">
            {status}
          </div>
          <Link className="btn btn-primary w-full" href="/product/auth">
            Return to sign in
          </Link>
        </div>
      ) : null}

      {state === "error" ? (
        <div className="mt-6 space-y-3">
          <div className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
          <Link className="btn btn-secondary w-full" href="/product/auth">
            Request a new reset link
          </Link>
        </div>
      ) : null}

      {state === "ready" && error ? (
        <p className="mt-4 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      ) : null}

      {state === "ready" ? (
        <p className="mt-6 flex items-start gap-2 text-xs text-[var(--text-faint)]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          Password reset links are single-use and time-limited for security.
        </p>
      ) : null}
    </div>
  );
}
