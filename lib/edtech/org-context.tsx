"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { pickOrgId } from "@/lib/edtech/org-selection";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { OrgMembership } from "@/lib/types";

type OrgContextValue = {
  memberships: OrgMembership[];
  selectedOrgId: string | null;
  selectedMembership: OrgMembership | null;
  loading: boolean;
  error: string | null;
  requiresSelection: boolean;
  setSelectedOrgId: (orgId: string) => void;
  refreshMemberships: () => Promise<void>;
};

const SELECTED_ORG_STORAGE_KEY = "policypilot:selected-org-id";

const OrgContext = createContext<OrgContextValue | null>(null);

function readStoredOrgId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(SELECTED_ORG_STORAGE_KEY);
  return value?.trim() ? value.trim() : null;
}

function writeStoredOrgId(orgId: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!orgId) {
    window.localStorage.removeItem(SELECTED_ORG_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SELECTED_ORG_STORAGE_KEY, orgId);
}

async function fetchMemberships(): Promise<OrgMembership[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase is not configured in this environment.");
  }

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("Sign in to access organization workspaces.");
  }

  const response = await fetch("/api/me/org-memberships", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const body = (await response.json()) as
    | { memberships: OrgMembership[] }
    | { error?: { message?: string } };

  if (!response.ok) {
    const message = "error" in body ? body.error?.message : undefined;
    throw new Error(message ?? "Failed to load your organization memberships.");
  }

  if (!("memberships" in body)) {
    throw new Error("Membership response shape is invalid.");
  }

  return body.memberships;
}

export function OrgProvider({ children }: PropsWithChildren) {
  const [queryOrgId, setQueryOrgId] = useState<string | null>(null);

  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [selectedOrgId, setSelectedOrgIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const readFromUrl = () => {
      const search = new URLSearchParams(window.location.search);
      setQueryOrgId(search.get("org"));
    };

    readFromUrl();
    window.addEventListener("popstate", readFromUrl);
    return () => {
      window.removeEventListener("popstate", readFromUrl);
    };
  }, []);

  const refreshMemberships = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextMemberships = await fetchMemberships();
      setMemberships(nextMemberships);
      setSelectedOrgIdState((current) =>
        pickOrgId(nextMemberships, [queryOrgId, current, readStoredOrgId()]),
      );
    } catch (loadError) {
      setMemberships([]);
      setSelectedOrgIdState(null);
      setError(loadError instanceof Error ? loadError.message : "Failed to load organization access.");
    } finally {
      setLoading(false);
    }
  }, [queryOrgId]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      setError("Supabase is not configured in this environment.");
      return;
    }

    void refreshMemberships();

    const { data } = supabase.auth.onAuthStateChange(() => {
      void refreshMemberships();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [refreshMemberships]);

  useEffect(() => {
    if (!queryOrgId || memberships.length === 0) {
      return;
    }

    if (memberships.some((membership) => membership.orgId === queryOrgId)) {
      setSelectedOrgIdState(queryOrgId);
    }
  }, [memberships, queryOrgId]);

  useEffect(() => {
    writeStoredOrgId(selectedOrgId);
  }, [selectedOrgId]);

  const setSelectedOrgId = useCallback(
    (orgId: string) => {
      if (!memberships.some((membership) => membership.orgId === orgId)) {
        return;
      }

      setSelectedOrgIdState(orgId);
    },
    [memberships],
  );

  const selectedMembership = useMemo(
    () => memberships.find((membership) => membership.orgId === selectedOrgId) ?? null,
    [memberships, selectedOrgId],
  );

  const value = useMemo<OrgContextValue>(
    () => ({
      memberships,
      selectedOrgId,
      selectedMembership,
      loading,
      error,
      requiresSelection: memberships.length > 1 && !selectedOrgId,
      setSelectedOrgId,
      refreshMemberships,
    }),
    [
      error,
      loading,
      memberships,
      refreshMemberships,
      selectedMembership,
      selectedOrgId,
      setSelectedOrgId,
    ],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrgContext(): OrgContextValue {
  const value = useContext(OrgContext);
  if (!value) {
    throw new Error("useOrgContext must be used within OrgProvider");
  }

  return value;
}
