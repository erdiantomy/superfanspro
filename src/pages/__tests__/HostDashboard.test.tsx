import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { MOCK_VENUE } from "@/test/mocks/fixtures";
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
  const methods = ["select", "eq", "in", "order", "limit", "insert"];
  for (const m of methods) {
    builder[m] = vi.fn().mockReturnValue(builder);
  }
  builder.single = vi.fn().mockResolvedValue({ data: null, error: null });
  builder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  (builder as any).then = (resolve: any) => resolve({ data: [], error: null });

  return {
    supabase: {
      from: vi.fn(() => ({ ...builder })),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
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

describe("HostDashboard", () => {
  it("shows sign-in required when no user is logged in", async () => {
    const { default: HostDashboard } = await import("../HostDashboard");
    renderWithProviders(<HostDashboard />, { initialEntries: ["/tomspadel/host"] });

    await waitFor(() => {
      const elements = screen.getAllByText(/sign in/i);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });
});
