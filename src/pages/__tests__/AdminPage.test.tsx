import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { MOCK_VENUE } from "@/test/mocks/fixtures";

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
  const methods = ["select", "eq", "neq", "in", "order", "limit", "insert", "update"];
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

import React from "react";

describe("AdminPage", () => {
  it("renders password gate initially", async () => {
    const { default: AdminPage } = await import("../AdminPage");
    renderWithProviders(<AdminPage />, { initialEntries: ["/tomspadel/admin"] });

    await waitFor(() => {
      expect(screen.getByText("STAFF ACCESS")).toBeInTheDocument();
    });
  });

  it("renders STAFF ACCESS heading on the password gate", async () => {
    const { default: AdminPage } = await import("../AdminPage");
    renderWithProviders(<AdminPage />, { initialEntries: ["/tomspadel/admin"] });

    await waitFor(() => {
      const elements = screen.getAllByText("STAFF ACCESS");
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders password input", async () => {
    const { default: AdminPage } = await import("../AdminPage");
    renderWithProviders(<AdminPage />, { initialEntries: ["/tomspadel/admin"] });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Staff password")).toBeInTheDocument();
    });
  });
});
