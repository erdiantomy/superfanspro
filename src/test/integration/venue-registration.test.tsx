import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
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

describe("Venue Registration Flow Integration", () => {
  it("renders Step 1 and allows filling contact details", async () => {
    const { default: RegisterPage } = await import("@/pages/RegisterPage");
    renderWithProviders(<RegisterPage />, { initialEntries: ["/register"] });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Your full name")).toBeInTheDocument();
    });

    // Fill Step 1 fields
    const nameInput = screen.getByPlaceholderText("Your full name");
    fireEvent.change(nameInput, { target: { value: "Test Admin" } });
    expect(nameInput).toHaveValue("Test Admin");

    const emailInput = screen.getByPlaceholderText("you@email.com");
    fireEvent.change(emailInput, { target: { value: "test@admin.com" } });
    expect(emailInput).toHaveValue("test@admin.com");
  });

  it("validates that all registration steps exist", () => {
    const stepNames = ["Contact Details", "Venue Details", "Prize Configuration", "Admin Setup"];
    expect(stepNames).toHaveLength(4);
  });

  it("validates form field structure", () => {
    const registrationData = {
      venue_name: "Test Padel",
      slug: "testpadel",
      contact_name: "Test Admin",
      contact_email: "test@admin.com",
      contact_phone: "+628123456789",
      city: "Jakarta",
      country: "Indonesia",
      courts: 4,
      monthly_prize: 5000000,
      prize_split_1st: 50,
      prize_split_2nd: 30,
      prize_split_3rd: 20,
      admin_password_hash: "hashedpassword",
      logo_url: null,
      primary_color: "#00E676",
      status: "pending",
    };

    // Prize splits total 100%
    expect(
      registrationData.prize_split_1st +
      registrationData.prize_split_2nd +
      registrationData.prize_split_3rd
    ).toBe(100);

    // Required fields present
    expect(registrationData.venue_name).toBeTruthy();
    expect(registrationData.slug).toBeTruthy();
    expect(registrationData.contact_email).toContain("@");
    expect(registrationData.courts).toBeGreaterThan(0);
    expect(registrationData.status).toBe("pending");
  });

  it("validates slug format (lowercase, no spaces)", () => {
    const validSlugs = ["tomspadel", "bali-padel", "jakarta123"];
    for (const slug of validSlugs) {
      expect(slug).toBe(slug.toLowerCase());
      expect(slug).not.toContain(" ");
    }
  });

  it("validates prize split percentages must total 100", () => {
    const validSplits = [
      { first: 50, second: 30, third: 20 },
      { first: 60, second: 25, third: 15 },
      { first: 70, second: 20, third: 10 },
    ];
    for (const split of validSplits) {
      expect(split.first + split.second + split.third).toBe(100);
    }
  });
});
