import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { MOCK_VENUE, MOCK_PLAYERS } from "@/test/mocks/fixtures";
import React from "react";

// Mock useVenue to bypass venue loading
vi.mock("@/hooks/useVenue", () => ({
  useVenue: () => ({
    venue: MOCK_VENUE,
    loading: false,
    error: null,
    slug: "tomspadel",
  }),
  VenueProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/integrations/supabase/client", () => {
  const builder: Record<string, any> = {};
  const methods = ["select", "eq", "order", "limit"];
  for (const m of methods) {
    builder[m] = vi.fn().mockReturnValue(builder);
  }
  builder.single = vi.fn().mockResolvedValue({ data: MOCK_VENUE, error: null });
  (builder as any).then = (resolve: any) => resolve({ data: MOCK_PLAYERS, error: null });

  return {
    supabase: {
      from: vi.fn(() => ({ ...builder })),
      rpc: vi.fn().mockResolvedValue({ data: MOCK_PLAYERS, error: null }),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      },
      channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
      removeChannel: vi.fn(),
    },
  };
});

vi.mock("@/components/wallet/CreditsDisplay", () => ({ default: () => null }));

describe("RankPage", () => {
  it("renders RANKINGS heading", async () => {
    const { default: RankPage } = await import("../RankPage");
    renderWithProviders(<RankPage />, { initialEntries: ["/tomspadel/rank"] });

    await waitFor(() => {
      expect(screen.getByText("RANKINGS")).toBeInTheDocument();
    });
  });

  it("renders monthly and lifetime tabs", async () => {
    const { default: RankPage } = await import("../RankPage");
    renderWithProviders(<RankPage />, { initialEntries: ["/tomspadel/rank"] });

    await waitFor(() => {
      const monthlyElements = screen.getAllByText(/Monthly/i);
      const lifetimeElements = screen.getAllByText(/Lifetime/i);
      expect(monthlyElements.length).toBeGreaterThanOrEqual(1);
      expect(lifetimeElements.length).toBeGreaterThanOrEqual(1);
    });
  });
});
