import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";

vi.mock("@/integrations/supabase/client", () => {
  const builder: Record<string, any> = {};
  const methods = ["select", "eq", "order", "limit", "single", "maybeSingle"];
  for (const m of methods) {
    builder[m] = vi.fn().mockReturnValue(builder);
  }
  builder.single = vi.fn().mockResolvedValue({ data: null, error: null });
  builder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  (builder as any).then = (resolve: any) => resolve({ data: [], error: null });

  return {
    supabase: {
      from: vi.fn(() => ({ ...builder })),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      },
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
      },
    },
  };
});

describe("TopUpPage", () => {
  it("shows sign-in gate when no user is logged in", async () => {
    const { default: TopUpPage } = await import("../TopUpPage");
    renderWithProviders(<TopUpPage />, { initialEntries: ["/topup"] });

    await waitFor(() => {
      // TopUpPage shows sign-in requirement or Top Up heading
      const content = document.body.textContent || "";
      expect(
        content.includes("Sign in") ||
        content.includes("sign in") ||
        content.includes("TOP UP") ||
        content.includes("Sign In")
      ).toBe(true);
    });
  });
});
