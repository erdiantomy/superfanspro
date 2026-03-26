import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { MOCK_VENUE, MOCK_VENUE_2 } from "@/test/mocks/fixtures";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => {
  const mockVenues = [
    { id: "v1", slug: "tomspadel", name: "Tom's Padel Arena", logo_url: null, city: "Jakarta", primary_color: "#00E676" },
    { id: "v2", slug: "balipadel", name: "Bali Padel Club", logo_url: null, city: "Bali", primary_color: "#1890FF" },
  ];
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: mockVenues, error: null }),
  };
  return {
    supabase: {
      from: vi.fn(() => builder),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      },
    },
  };
});

describe("HomePage", () => {
  beforeEach(async () => {
    const { default: HomePage } = await import("../HomePage");
    renderWithProviders(<HomePage />);
  });

  it("renders SUPERFANS branding", () => {
    const elements = screen.getAllByText("SUPERFANS");
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it("renders hero heading", () => {
    expect(screen.getByText(/Your Padel Venue/i)).toBeInTheDocument();
    expect(screen.getByText(/Fully Gamified/i)).toBeInTheDocument();
  });

  it("renders Register Venue button in nav", () => {
    expect(screen.getByText("Register Venue")).toBeInTheDocument();
  });

  it("renders Register Your Venue CTA", () => {
    expect(screen.getByText(/Register Your Venue/)).toBeInTheDocument();
  });

  it("renders See a live example button", () => {
    expect(screen.getByText("See a live example")).toBeInTheDocument();
  });

  it("renders How It Works section with 3 steps", () => {
    expect(screen.getByText("How It Works")).toBeInTheDocument();
    expect(screen.getByText("Register your venue")).toBeInTheDocument();
    expect(screen.getByText("Players sign in with Google")).toBeInTheDocument();
    expect(screen.getByText("Matches are tracked automatically")).toBeInTheDocument();
  });

  it("renders Features section with 6 feature cards", () => {
    expect(screen.getByText("Features")).toBeInTheDocument();
    expect(screen.getByText("Live Leaderboards")).toBeInTheDocument();
    expect(screen.getByText("XP & Division Badges")).toBeInTheDocument();
    expect(screen.getByText("Monthly Prize Pools")).toBeInTheDocument();
    expect(screen.getByText("Player Support Economy")).toBeInTheDocument();
    expect(screen.getByText("One Global Profile")).toBeInTheDocument();
    expect(screen.getByText("Admin Score Verification")).toBeInTheDocument();
  });

  it("renders Pricing section", () => {
    expect(screen.getByText("Pricing")).toBeInTheDocument();
    expect(screen.getByText("Venue Registration")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Platform Fee")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
  });
});
