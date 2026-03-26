import { describe, it, expect } from "vitest";
import { resolveSupports, type SupportEntry } from "@/lib/gamification";

/**
 * Integration test: Support & Payout System
 *
 * Tests the complete fan support economy:
 * 1. Multiple fans back different players
 * 2. Match concludes with a winner
 * 3. resolveSupports calculates correct payouts
 * 4. 70/20/10 split applied correctly
 */

describe("Support & Payout Flow Integration", () => {
  const supports: SupportEntry[] = [
    // 3 fans back player A (winner)
    { supporterId: "fan1", backedId: "playerA", amount: 100000 },
    { supporterId: "fan2", backedId: "playerA", amount: 50000 },
    { supporterId: "fan3", backedId: "playerA", amount: 50000 },
    // 2 fans back player B (loser)
    { supporterId: "fan4", backedId: "playerB", amount: 80000 },
    { supporterId: "fan5", backedId: "playerB", amount: 120000 },
  ];

  const result = resolveSupports(supports, "playerA");

  it("calculates correct total pool", () => {
    expect(result.totalPool).toBe(400000);
  });

  it("calculates correct losing pool (only loser backers)", () => {
    expect(result.losingPool).toBe(200000); // 80k + 120k
  });

  it("splits 70% of losing pool to winning supporters", () => {
    const toSupporters = Math.floor(200000 * 0.7); // 140000
    const totalWinStake = 200000; // 100k + 50k + 50k

    // fan1: 100k/200k * 140000 = 70000
    const fan1 = result.payouts.find(p => p.supporterId === "fan1")!;
    expect(fan1.profit).toBe(Math.floor((100000 / totalWinStake) * toSupporters));
    expect(fan1.payout).toBe(100000 + fan1.profit);
    expect(fan1.won).toBe(true);

    // fan2: 50k/200k * 140000 = 35000
    const fan2 = result.payouts.find(p => p.supporterId === "fan2")!;
    expect(fan2.profit).toBe(Math.floor((50000 / totalWinStake) * toSupporters));
    expect(fan2.won).toBe(true);

    // fan3: same as fan2
    const fan3 = result.payouts.find(p => p.supporterId === "fan3")!;
    expect(fan3.profit).toBe(Math.floor((50000 / totalWinStake) * toSupporters));
  });

  it("gives losing supporters 0 payout and negative profit", () => {
    const fan4 = result.payouts.find(p => p.supporterId === "fan4")!;
    expect(fan4.payout).toBe(0);
    expect(fan4.profit).toBe(-80000);
    expect(fan4.won).toBe(false);

    const fan5 = result.payouts.find(p => p.supporterId === "fan5")!;
    expect(fan5.payout).toBe(0);
    expect(fan5.profit).toBe(-120000);
    expect(fan5.won).toBe(false);
  });

  it("gives 20% of losing pool to winning player", () => {
    expect(result.playerBonus).toBe(Math.floor(200000 * 0.2)); // 40000
  });

  it("gives 10% of losing pool to platform", () => {
    expect(result.platformFee).toBe(Math.floor(200000 * 0.1)); // 20000
  });

  it("total distribution does not exceed total pool", () => {
    const totalPaidOut = result.payouts.reduce((sum, p) => sum + Math.max(0, p.payout), 0);
    // Total paid out = winning stakes returned + their profits
    // Should not exceed total pool
    expect(totalPaidOut + result.playerBonus + result.platformFee).toBeLessThanOrEqual(result.totalPool);
  });

  // Edge case: no supporters at all
  it("handles empty support list gracefully", () => {
    const empty = resolveSupports([], "playerA");
    expect(empty.totalPool).toBe(0);
    expect(empty.losingPool).toBe(0);
    expect(empty.playerBonus).toBe(0);
    expect(empty.platformFee).toBe(0);
    expect(empty.payouts).toHaveLength(0);
  });

  // Edge case: single supporter on the winner
  it("handles single supporter on winner (no losers)", () => {
    const single = resolveSupports(
      [{ supporterId: "fan1", backedId: "winner", amount: 50000 }],
      "winner"
    );
    expect(single.losingPool).toBe(0);
    expect(single.payouts[0].payout).toBe(50000); // gets stake back
    expect(single.payouts[0].profit).toBe(0);
    expect(single.playerBonus).toBe(0);
    expect(single.platformFee).toBe(0);
  });

  // Edge case: everyone backed the loser
  it("handles all backing the loser", () => {
    const allLose = resolveSupports(
      [
        { supporterId: "fan1", backedId: "loser", amount: 50000 },
        { supporterId: "fan2", backedId: "loser", amount: 100000 },
      ],
      "winner"
    );
    expect(allLose.losingPool).toBe(150000);
    expect(allLose.payouts[0].payout).toBe(0);
    expect(allLose.payouts[1].payout).toBe(0);
    // No winners to distribute to, but player and platform still get their cut
    expect(allLose.playerBonus).toBe(Math.floor(150000 * 0.2));
    expect(allLose.platformFee).toBe(Math.floor(150000 * 0.1));
  });
});
