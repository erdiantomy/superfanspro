import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";

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
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      },
      channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
      removeChannel: vi.fn(),
    },
  };
});

describe("SuperAdminPage", () => {
  it("renders password gate", async () => {
    const { default: SuperAdminPage } = await import("../SuperAdminPage");
    renderWithProviders(<SuperAdminPage />, { initialEntries: ["/admin"] });

    await waitFor(() => {
      expect(screen.getByText("SUPER ADMIN")).toBeInTheDocument();
    });
  });

  it("renders password input", async () => {
    const { default: SuperAdminPage } = await import("../SuperAdminPage");
    renderWithProviders(<SuperAdminPage />, { initialEntries: ["/admin"] });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Super admin password")).toBeInTheDocument();
    });
  });

  it("shows content after entering correct password", async () => {
    const { default: SuperAdminPage } = await import("../SuperAdminPage");
    renderWithProviders(<SuperAdminPage />, { initialEntries: ["/admin"] });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Super admin password")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText("Super admin password");
    fireEvent.change(input, { target: { value: "superfans2026!" } });

    const enterBtn = screen.getByText(/ENTER/);
    fireEvent.click(enterBtn);

    await waitFor(() => {
      expect(screen.getByText("SUPERFANS PLATFORM")).toBeInTheDocument();
    });
  });
});
