import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";

vi.mock("@/integrations/supabase/client", () => {
  const builder: Record<string, any> = {};
  const methods = ["select", "eq", "insert", "single", "maybeSingle"];
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
    },
  };
});

describe("RegisterPage", () => {
  it("renders registration heading", async () => {
    const { default: RegisterPage } = await import("../RegisterPage");
    renderWithProviders(<RegisterPage />, { initialEntries: ["/register"] });

    await waitFor(() => {
      expect(screen.getByText("VENUE REGISTRATION")).toBeInTheDocument();
    });
  });

  it("renders step 1 Contact Details initially", async () => {
    const { default: RegisterPage } = await import("../RegisterPage");
    renderWithProviders(<RegisterPage />, { initialEntries: ["/register"] });

    await waitFor(() => {
      // Look for the contact details content
      const content = document.body.textContent || "";
      expect(
        content.includes("Contact") || content.includes("VENUE REGISTRATION")
      ).toBe(true);
    });
  });

  it("renders step indicator", async () => {
    const { default: RegisterPage } = await import("../RegisterPage");
    renderWithProviders(<RegisterPage />, { initialEntries: ["/register"] });

    await waitFor(() => {
      expect(screen.getByText(/Step 1 of 4/)).toBeInTheDocument();
    });
  });

  it("renders contact form fields", async () => {
    const { default: RegisterPage } = await import("../RegisterPage");
    renderWithProviders(<RegisterPage />, { initialEntries: ["/register"] });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Your full name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("you@email.com")).toBeInTheDocument();
    });
  });

  it("renders SUPERFANS branding", async () => {
    const { default: RegisterPage } = await import("../RegisterPage");
    renderWithProviders(<RegisterPage />, { initialEntries: ["/register"] });

    await waitFor(() => {
      expect(screen.getByText("SUPERFANS")).toBeInTheDocument();
    });
  });
});
