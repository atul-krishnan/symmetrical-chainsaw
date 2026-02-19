import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthPanel } from "@/components/product/auth-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
});

describe("AuthPanel", () => {
  it("renders auth actions", () => {
    render(<AuthPanel />);

    expect(screen.getByRole("button", { name: /Continue with Google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send Magic Link/i })).toBeInTheDocument();
  });

  it("supports switching to create-account mode", async () => {
    const user = userEvent.setup();
    render(<AuthPanel />);

    await user.click(screen.getByRole("button", { name: /^Sign up$/i }));

    expect(screen.getByRole("heading", { name: /Create your workspace account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create with Magic Link/i })).toBeInTheDocument();
  });
});
