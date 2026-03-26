import { describe, it, expect } from "vitest";
import {
  calcXP,
  getDivision,
  getDivisionKey,
  getDivisionProgress,
  getXpToNextDivision,
} from "@/lib/gamification";

/**
 * Integration test: XP & Division Progression
 *
 * Simulates a player's journey from Bronze to Diamond
 * through multiple match results, verifying:
 * - XP accumulates correctly
 * - Division upgrades at correct thresholds
 * - Progress percentage tracks correctly
 */

describe("XP & Division Progression Integration", () => {
  it("new player starts at Bronze with 0 XP", () => {
    const xp = 0;
    expect(getDivisionKey(xp)).toBe("bronze");
    expect(getDivision(xp).label).toBe("Bronze");
    expect(getDivisionProgress(xp)).toBe(0);
    expect(getXpToNextDivision(xp)).toBe(900);
  });

  it("simulates a player's progression through all divisions", () => {
    let lifetimeXp = 0;
    let monthlyPts = 0;
    let wins = 0;
    let losses = 0;

    // Helper to play a match
    function playMatch(won: boolean, rank: number) {
      const xp = calcXP(won, rank);
      lifetimeXp += xp;
      monthlyPts += xp;
      if (won) wins++;
      else losses++;
      return xp;
    }

    // ── Phase 1: Bronze → Silver ──
    // Win 5 matches at rank 1 (5 × 200 = 1000 XP)
    for (let i = 0; i < 5; i++) playMatch(true, 1);
    expect(lifetimeXp).toBe(1000);
    expect(getDivisionKey(lifetimeXp)).toBe("silver");
    expect(wins).toBe(5);

    // ── Phase 2: Silver → Gold ──
    // Need 600 more XP (1600 - 1000)
    // Win 3 at rank 2 (3 × 170 = 510), win 1 at rank 3 (140)
    for (let i = 0; i < 3; i++) playMatch(true, 2);
    playMatch(true, 3);
    expect(lifetimeXp).toBe(1000 + 510 + 140); // 1650
    expect(getDivisionKey(lifetimeXp)).toBe("gold");

    // ── Phase 3: Gold → Platinum ──
    // Need 750 more XP (2400 - 1650)
    // Win 4 at rank 1 (4 × 200 = 800)
    for (let i = 0; i < 4; i++) playMatch(true, 1);
    expect(lifetimeXp).toBe(1650 + 800); // 2450
    expect(getDivisionKey(lifetimeXp)).toBe("platinum");

    // ── Phase 4: Platinum → Diamond ──
    // Need 550 more XP (3000 - 2450)
    // Win 3 at rank 1 (3 × 200 = 600)
    for (let i = 0; i < 3; i++) playMatch(true, 1);
    expect(lifetimeXp).toBe(2450 + 600); // 3050
    expect(getDivisionKey(lifetimeXp)).toBe("diamond");
    expect(getXpToNextDivision(lifetimeXp)).toBeNull(); // max division

    // ── Verify final stats ──
    expect(wins).toBe(16);
    expect(losses).toBe(0);
    expect(getDivisionProgress(lifetimeXp)).toBe(100); // Diamond = 100%
  });

  it("loss XP is lower but still accumulates", () => {
    let xp = 0;

    // 10 losses at rank 5 (10 × 60 = 600)
    for (let i = 0; i < 10; i++) {
      xp += calcXP(false, 5);
    }

    expect(xp).toBe(600);
    expect(getDivisionKey(xp)).toBe("bronze"); // still Bronze (< 900)

    // 5 more losses (5 × 60 = 300, total = 900)
    for (let i = 0; i < 5; i++) {
      xp += calcXP(false, 5);
    }

    expect(xp).toBe(900);
    expect(getDivisionKey(xp)).toBe("silver"); // exactly Silver threshold
  });

  it("monthly pts tracked separately from lifetime XP", () => {
    // In the real system, both accumulate the same XP per match
    // but monthly_pts resets each month while lifetime_xp never resets
    let lifetimeXp = 2000; // existing lifetime
    let monthlyPts = 0; // new month

    const xp = calcXP(true, 1); // 200
    lifetimeXp += xp;
    monthlyPts += xp;

    expect(lifetimeXp).toBe(2200);
    expect(monthlyPts).toBe(200);
    expect(getDivisionKey(lifetimeXp)).toBe("gold"); // based on lifetime
    // Monthly pts are independent of division
  });

  it("rank multiplier rewards top-ranked players more", () => {
    const xpRank1 = calcXP(true, 1); // 200
    const xpRank3 = calcXP(true, 3); // 140
    const xpRank6 = calcXP(true, 6); // 120

    expect(xpRank1).toBeGreaterThan(xpRank3);
    expect(xpRank3).toBeGreaterThan(xpRank6);

    // Loss at rank 1 still better than loss at rank 6
    expect(calcXP(false, 1)).toBeGreaterThan(calcXP(false, 6));
  });

  it("division boundaries are exact", () => {
    expect(getDivisionKey(899)).toBe("bronze");
    expect(getDivisionKey(900)).toBe("silver");
    expect(getDivisionKey(1599)).toBe("silver");
    expect(getDivisionKey(1600)).toBe("gold");
    expect(getDivisionKey(2399)).toBe("gold");
    expect(getDivisionKey(2400)).toBe("platinum");
    expect(getDivisionKey(2999)).toBe("platinum");
    expect(getDivisionKey(3000)).toBe("diamond");
  });
});
