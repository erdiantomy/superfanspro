import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      setSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  },
}));

const mockSignIn = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/integrations/lovable", () => ({
  lovable: {
    auth: {
      signInWithOAuth: mockSignIn,
    },
  },
}));

// Mock logo import
vi.mock("@/assets/superfans-logo.png", () => ({ default: "mock-logo.png" }));

describe("AuthScreen", () => {
  beforeEach(async () => {
    mockSignIn.mockClear();
    const { default: AuthScreen } = await import("../AuthScreen");
    renderWithProviders(<AuthScreen />, { initialEntries: ["/auth"] });
  });

  it("renders SIGN IN heading", () => {
    expect(screen.getByText("SIGN IN")).toBeInTheDocument();
  });

  it("renders Continue with Google button", () => {
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
  });

  it("renders sign-in description", () => {
    expect(screen.getByText(/Sign in with Google/i)).toBeInTheDocument();
  });

  it("renders terms notice", () => {
    expect(screen.getByText(/By signing in you agree/i)).toBeInTheDocument();
  });

  it("calls signInWithOAuth on button click", async () => {
    const btn = screen.getByText("Continue with Google");
    fireEvent.click(btn);
    expect(mockSignIn).toHaveBeenCalledWith("google", expect.any(Object));
  });
});
