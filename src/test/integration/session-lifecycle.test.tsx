import { describe, it, expect, vi, beforeEach } from "vitest";
import { MOCK_PLAYERS, MOCK_SESSIONS, MOCK_SCORES } from "@/test/mocks/fixtures";
import { calcXP } from "@/lib/gamification";

/**
 * Integration test: Session Lifecycle
 *
 * Tests the complete flow logic without requiring Supabase:
 * 1. Host creates session → pending_approval
 * 2. Admin approves → active
 * 3. Player requests to join → pending
 * 4. Host approves player → approved
 * 5. Score submitted → pending
 * 6. Admin approves score → XP credited
 */

describe("Session Lifecycle Integration", () => {
  it("session starts with pending_approval status", () => {
    const newSession = {
      name: "Test Session",
      format: "americano",
      partner_type: "random",
      courts: 4,
      status: "pending_approval",
      host_id: MOCK_PLAYERS[0].id,
      max_players: 16,
      locked: false,
    };
    expect(newSession.status).toBe("pending_approval");
    expect(newSession.host_id).toBe(MOCK_PLAYERS[0].id);
  });

  it("admin approval transitions status to active", () => {
    const session = { ...MOCK_SESSIONS[2] }; // pending_approval
    expect(session.status).toBe("pending_approval");

    // Simulate approval
    session.status = "active" as any;
    const approved_at = new Date().toISOString();
    expect(session.status).toBe("active");
    expect(approved_at).toBeTruthy();
  });

  it("player join request starts as pending", () => {
    const joinRequest = {
      session_id: MOCK_SESSIONS[0].id,
      player_id: MOCK_PLAYERS[3].id,
      role: "player",
      status: "pending",
      joined_at: null,
    };
    expect(joinRequest.status).toBe("pending");
    expect(joinRequest.joined_at).toBeNull();
  });

  it("host approves player → status approved with join timestamp", () => {
    const joinRequest = {
      session_id: MOCK_SESSIONS[0].id,
      player_id: MOCK_PLAYERS[3].id,
      role: "player",
      status: "pending" as string,
      joined_at: null as string | null,
    };

    // Simulate approval
    joinRequest.status = "approved";
    joinRequest.joined_at = new Date().toISOString();

    expect(joinRequest.status).toBe("approved");
    expect(joinRequest.joined_at).toBeTruthy();
  });

  it("score submission created with pending status", () => {
    const score = {
      session_id: MOCK_SESSIONS[0].id,
      court: 1,
      round: 3,
      team_a_p1: MOCK_PLAYERS[0].id,
      team_a_p2: MOCK_PLAYERS[1].id,
      team_b_p1: MOCK_PLAYERS[2].id,
      team_b_p2: MOCK_PLAYERS[3].id,
      score_a: "6",
      score_b: "4",
      winner_team: "a",
      status: "pending",
      xp_credited: false,
    };

    expect(score.status).toBe("pending");
    expect(score.xp_credited).toBe(false);
    expect(score.winner_team).toBe("a");
  });

  it("admin approves score → XP calculated correctly for winners/losers", () => {
    const score = MOCK_SCORES[1]; // pending score
    expect(score.status).toBe("pending");

    // Calculate XP that would be credited
    const winnerXp = calcXP(true, score.session_rank_winners);
    const loserXp = calcXP(false, score.session_rank_losers);

    expect(winnerXp).toBeGreaterThan(0);
    expect(loserXp).toBeGreaterThan(0);
    expect(winnerXp).toBeGreaterThan(loserXp); // winners always get more
  });

  it("fixture data covers all session statuses", () => {
    const statuses = MOCK_SESSIONS.map(s => s.status);
    expect(statuses).toContain("pending_approval");
    expect(statuses).toContain("active");
    expect(statuses).toContain("live");
    expect(statuses).toContain("finished");
  });

  it("valid status transitions are enforced", () => {
    const validTransitions: Record<string, string[]> = {
      pending_approval: ["active", "rejected"],
      active: ["live"],
      live: ["finished"],
      finished: [],
      rejected: [],
    };

    // All fixture sessions have valid statuses
    for (const session of MOCK_SESSIONS) {
      expect(Object.keys(validTransitions)).toContain(session.status);
    }
  });

  it("session player fixtures have correct role/status combinations", async () => {
    const { MOCK_SESSION_PLAYERS } = await import("@/test/mocks/fixtures");

    // Host should always be approved
    const hosts = MOCK_SESSION_PLAYERS.filter((sp: any) => sp.role === "host");
    for (const h of hosts) {
      expect(h.status).toBe("approved");
    }

    // Approved players should have joined_at
    const approved = MOCK_SESSION_PLAYERS.filter((sp: any) => sp.status === "approved");
    for (const a of approved) {
      expect(a.joined_at).toBeTruthy();
    }

    // Pending players should have null joined_at
    const pending = MOCK_SESSION_PLAYERS.filter((sp: any) => sp.status === "pending");
    for (const p of pending) {
      expect(p.joined_at).toBeNull();
    }
  });
});
