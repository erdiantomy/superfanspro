import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { credits: 250000 }, error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
    removeChannel: vi.fn(),
  },
}));

describe("PaymentFailedPage", () => {
  beforeEach(async () => {
    const { default: PaymentFailedPage } = await import("../PaymentFailedPage");
    renderWithProviders(<PaymentFailedPage />, { initialEntries: ["/payment/failed"] });
  });

  it("renders 'Payment Not Completed' heading", () => {
    expect(screen.getByText("Payment Not Completed")).toBeInTheDocument();
  });

  it("renders cancelled/expired message", () => {
    expect(screen.getByText(/cancelled or expired/i)).toBeInTheDocument();
  });

  it("renders 'Try Again' button", () => {
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("renders 'Back to Game' button", () => {
    expect(screen.getByText("Back to Game")).toBeInTheDocument();
  });
});

describe("PaymentSuccessPage", () => {
  beforeEach(async () => {
    const { default: PaymentSuccessPage } = await import("../PaymentSuccessPage");
    renderWithProviders(<PaymentSuccessPage />, { initialEntries: ["/payment/success"] });
  });

  it("renders 'Payment Successful!' heading", () => {
    expect(screen.getByText("Payment Successful!")).toBeInTheDocument();
  });

  it("renders credit message", () => {
    expect(screen.getByText(/credits have been added/i)).toBeInTheDocument();
  });

  it("renders 'Back to Game' button", () => {
    expect(screen.getByText("Back to Game")).toBeInTheDocument();
  });
});
