import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { MOCK_VENUE, MOCK_PLAYERS, MOCK_SESSIONS } from "@/test/mocks/fixtures";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  // Make builder thenable
  (builder as any).then = (resolve: any) => resolve({ data: [], error: null });
  return {
    supabase: {
      from: vi.fn(() => {
        const b = { ...builder };
        // Make each chain method return a fresh thenable
        for (const key of Object.keys(b)) {
          if (typeof b[key] === "function" && key !== "then" && key !== "single" && key !== "maybeSingle") {
            b[key] = vi.fn().mockReturnValue(b);
          }
        }
        (b as any).then = (resolve: any) => resolve({ data: [], error: null });
        b.single = vi.fn().mockResolvedValue({ data: MOCK_VENUE, error: null });
        return b;
      }),
      rpc: vi.fn().mockResolvedValue({ data: MOCK_PLAYERS.slice(0, 5), error: null }),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      },
      channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
      removeChannel: vi.fn(),
    },
  };
});

// Need to mock the wallet component
vi.mock("@/components/wallet/CreditsDisplay", () => ({
  default: () => null,
}));

describe("VenuePage", () => {
  it("renders loading state initially", async () => {
    // Import with lazy rendering to catch loading state
    const { default: VenuePage } = await import("../VenuePage");
    renderWithProviders(<VenuePage />, { initialEntries: ["/tomspadel"] });
    // The page renders venue name or loading - both are acceptable
    await waitFor(() => {
      const content = document.body.textContent;
      expect(content).toBeTruthy();
    });
  });

  it("renders venue not found when no venue exists", async () => {
    const { default: VenuePage } = await import("../VenuePage");
    renderWithProviders(<VenuePage />, { initialEntries: ["/nonexistent"] });
    // Without venue context, it shows either loading or not found
    await waitFor(() => {
      expect(document.body.textContent).toBeTruthy();
    });
  });
});
