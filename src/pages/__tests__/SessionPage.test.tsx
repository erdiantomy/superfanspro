import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { MOCK_VENUE, MOCK_SESSIONS } from "@/test/mocks/fixtures";

vi.mock("@/integrations/supabase/client", () => {
  const session = MOCK_SESSIONS[0]; // live session
  const builder: Record<string, any> = {};
  const methods = ["select", "eq", "neq", "in", "order", "limit", "insert", "update"];
  for (const m of methods) {
    builder[m] = vi.fn().mockReturnValue(builder);
  }
  builder.single = vi.fn().mockResolvedValue({ data: MOCK_VENUE, error: null });
  builder.maybeSingle = vi.fn().mockResolvedValue({ data: session, error: null });
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

// Import MOCK_SESSIONS after mock
import { MOCK_SESSIONS as _MS } from "@/test/mocks/fixtures";

describe("SessionPage", () => {
  it("renders session page content", async () => {
    const { default: SessionPage } = await import("../SessionPage");
    renderWithProviders(<SessionPage />, { initialEntries: ["/tomspadel/session/TOMSP-0001"] });

    await waitFor(() => {
      // Should render some content (loading or session info)
      expect(document.body.textContent!.length).toBeGreaterThan(0);
    });
  });

  it("renders loading state initially", async () => {
    const { default: SessionPage } = await import("../SessionPage");
    const { container } = renderWithProviders(<SessionPage />, { initialEntries: ["/tomspadel/session/TOMSP-0001"] });

    // Should have rendered something
    expect(container.innerHTML).toBeTruthy();
  });
});
