import { describe, it, expect } from "vitest";
import {
  getRankMultiplier,
  calcXP,
  getDivision,
  getDivisionKey,
  getDivisionProgress,
  getXpToNextDivision,
  resolveSupports,
  idr,
  cr,
  RANK_MULTIPLIERS,
  DIVISIONS,
  DIVISION_ORDER,
  type SupportEntry,
} from "../gamification";

// ═════════════════════════════════════════════════════
// getRankMultiplier
// ═════════════════════════════════════════════════════
describe("getRankMultiplier", () => {
  it("returns 2.0 for rank 1", () => {
    expect(getRankMultiplier(1)).toBe(2.0);
  });

  it("returns 1.7 for rank 2", () => {
    expect(getRankMultiplier(2)).toBe(1.7);
  });

  it("returns 1.4 for rank 3", () => {
    expect(getRankMultiplier(3)).toBe(1.4);
  });

  it("returns 1.2 for ranks 4-6", () => {
    expect(getRankMultiplier(4)).toBe(1.2);
    expect(getRankMultiplier(5)).toBe(1.2);
    expect(getRankMultiplier(6)).toBe(1.2);
  });

  it("returns 1.2 for ranks beyond 6 (clamped to last element)", () => {
    expect(getRankMultiplier(7)).toBe(1.2);
    expect(getRankMultiplier(100)).toBe(1.2);
  });

  it("has 6 multiplier values", () => {
    expect(RANK_MULTIPLIERS.length).toBe(6);
  });
});

// ═════════════════════════════════════════════════════
// calcXP
// ═════════════════════════════════════════════════════
describe("calcXP", () => {
  it("win at rank 1 = 200 (100 × 2.0)", () => {
    expect(calcXP(true, 1)).toBe(200);
  });

  it("loss at rank 1 = 100 (50 × 2.0)", () => {
    expect(calcXP(false, 1)).toBe(100);
  });

  it("win at rank 2 = 170 (100 × 1.7)", () => {
    expect(calcXP(true, 2)).toBe(170);
  });

  it("loss at rank 3 = 70 (50 × 1.4)", () => {
    expect(calcXP(false, 3)).toBe(70);
  });

  it("win at rank 5 = 120 (100 × 1.2)", () => {
    expect(calcXP(true, 5)).toBe(120);
  });

  it("loss at rank 7 = 60 (50 × 1.2, clamped)", () => {
    expect(calcXP(false, 7)).toBe(60);
  });

  it("returns a rounded integer", () => {
    const xp = calcXP(true, 2);
    expect(xp).toBe(Math.round(xp));
  });
});

// ═════════════════════════════════════════════════════
// getDivision / getDivisionKey
// ═════════════════════════════════════════════════════
describe("getDivision", () => {
  const cases: [number, string][] = [
    [0, "Bronze"],
    [450, "Bronze"],
    [899, "Bronze"],
    [900, "Silver"],
    [1200, "Silver"],
    [1599, "Silver"],
    [1600, "Gold"],
    [2000, "Gold"],
    [2399, "Gold"],
    [2400, "Platinum"],
    [2700, "Platinum"],
    [2999, "Platinum"],
    [3000, "Diamond"],
    [5000, "Diamond"],
    [10000, "Diamond"],
  ];

  it.each(cases)("XP %i → %s", (xp, expected) => {
    expect(getDivision(xp).label).toBe(expected);
  });
});

describe("getDivisionKey", () => {
  it("returns 'bronze' for 0 XP", () => {
    expect(getDivisionKey(0)).toBe("bronze");
  });

  it("returns 'silver' for 900 XP", () => {
    expect(getDivisionKey(900)).toBe("silver");
  });

  it("returns 'gold' for 1600 XP", () => {
    expect(getDivisionKey(1600)).toBe("gold");
  });

  it("returns 'platinum' for 2400 XP", () => {
    expect(getDivisionKey(2400)).toBe("platinum");
  });

  it("returns 'diamond' for 3000 XP", () => {
    expect(getDivisionKey(3000)).toBe("diamond");
  });
});

// ═════════════════════════════════════════════════════
// getDivisionProgress
// ═════════════════════════════════════════════════════
describe("getDivisionProgress", () => {
  it("0 XP = 0% progress (Bronze)", () => {
    expect(getDivisionProgress(0)).toBe(0);
  });

  it("450 XP = 50% progress (Bronze: 0-900)", () => {
    expect(getDivisionProgress(450)).toBe(50);
  });

  it("900 XP = 0% progress (Silver: 900-1600)", () => {
    expect(getDivisionProgress(900)).toBe(0);
  });

  it("1250 XP = 50% progress (Silver: 900-1600)", () => {
    expect(getDivisionProgress(1250)).toBe(50);
  });

  it("3000+ XP = 100% (Diamond, no next)", () => {
    expect(getDivisionProgress(3000)).toBe(100);
    expect(getDivisionProgress(5000)).toBe(100);
  });
});

// ═════════════════════════════════════════════════════
// getXpToNextDivision
// ═════════════════════════════════════════════════════
describe("getXpToNextDivision", () => {
  it("0 XP → 900 to Silver", () => {
    expect(getXpToNextDivision(0)).toBe(900);
  });

  it("450 XP → 450 to Silver", () => {
    expect(getXpToNextDivision(450)).toBe(450);
  });

  it("900 XP → 700 to Gold", () => {
    expect(getXpToNextDivision(900)).toBe(700);
  });

  it("2400 XP → 600 to Diamond", () => {
    expect(getXpToNextDivision(2400)).toBe(600);
  });

  it("3000 XP → null (Diamond, max division)", () => {
    expect(getXpToNextDivision(3000)).toBeNull();
  });
});

// ═════════════════════════════════════════════════════
// resolveSupports
// ═════════════════════════════════════════════════════
describe("resolveSupports", () => {
  it("returns zeros for empty supports", () => {
    const result = resolveSupports([], "winner");
    expect(result.totalPool).toBe(0);
    expect(result.losingPool).toBe(0);
    expect(result.playerBonus).toBe(0);
    expect(result.platformFee).toBe(0);
    expect(result.payouts).toHaveLength(0);
  });

  it("single supporter on winner gets stake back, zero profit", () => {
    const supports: SupportEntry[] = [
      { supporterId: "fan1", backedId: "winner", amount: 100 },
    ];
    const result = resolveSupports(supports, "winner");
    expect(result.totalPool).toBe(100);
    expect(result.losingPool).toBe(0);
    expect(result.payouts[0].payout).toBe(100); // gets stake back
    expect(result.payouts[0].profit).toBe(0);
    expect(result.payouts[0].won).toBe(true);
    expect(result.playerBonus).toBe(0);
    expect(result.platformFee).toBe(0);
  });

  it("calculates correct 70/20/10 split with winner and losers", () => {
    const supports: SupportEntry[] = [
      { supporterId: "fan1", backedId: "winner", amount: 100 },
      { supporterId: "fan2", backedId: "loser", amount: 100 },
    ];
    const result = resolveSupports(supports, "winner");

    expect(result.totalPool).toBe(200);
    expect(result.losingPool).toBe(100);

    // 70% of 100 = 70 to supporters
    expect(Math.floor(100 * 0.7)).toBe(70);
    expect(result.payouts[0].payout).toBe(100 + 70); // stake + share
    expect(result.payouts[0].profit).toBe(70);
    expect(result.payouts[0].won).toBe(true);

    // Loser gets 0
    expect(result.payouts[1].payout).toBe(0);
    expect(result.payouts[1].profit).toBe(-100);
    expect(result.payouts[1].won).toBe(false);

    // 20% player, 10% platform
    expect(result.playerBonus).toBe(20);
    expect(result.platformFee).toBe(10);
  });

  it("distributes proportionally to multiple winners", () => {
    const supports: SupportEntry[] = [
      { supporterId: "fan1", backedId: "winner", amount: 200 },
      { supporterId: "fan2", backedId: "winner", amount: 100 },
      { supporterId: "fan3", backedId: "loser", amount: 300 },
    ];
    const result = resolveSupports(supports, "winner");

    expect(result.totalPool).toBe(600);
    expect(result.losingPool).toBe(300);

    const toSupporters = Math.floor(300 * 0.7); // 210
    // fan1 staked 200 out of 300 total winning stake → 200/300 * 210 = 140
    expect(result.payouts[0].profit).toBe(Math.floor((200 / 300) * toSupporters));
    // fan2 staked 100 out of 300 → 100/300 * 210 = 70
    expect(result.payouts[1].profit).toBe(Math.floor((100 / 300) * toSupporters));

    expect(result.playerBonus).toBe(Math.floor(300 * 0.2)); // 60
    expect(result.platformFee).toBe(Math.floor(300 * 0.1)); // 30
  });

  it("all supporters back the loser → everyone gets 0 payout", () => {
    const supports: SupportEntry[] = [
      { supporterId: "fan1", backedId: "loser", amount: 100 },
      { supporterId: "fan2", backedId: "loser", amount: 200 },
    ];
    const result = resolveSupports(supports, "winner");

    expect(result.losingPool).toBe(300);
    expect(result.payouts[0].payout).toBe(0);
    expect(result.payouts[1].payout).toBe(0);
    // No winning supporters to distribute to
    expect(result.playerBonus).toBe(60);
    expect(result.platformFee).toBe(30);
  });

  it("all supporters back the winner → no losing pool", () => {
    const supports: SupportEntry[] = [
      { supporterId: "fan1", backedId: "winner", amount: 100 },
      { supporterId: "fan2", backedId: "winner", amount: 200 },
    ];
    const result = resolveSupports(supports, "winner");

    expect(result.losingPool).toBe(0);
    // Everyone gets stake back, zero profit
    expect(result.payouts[0].payout).toBe(100);
    expect(result.payouts[0].profit).toBe(0);
    expect(result.payouts[1].payout).toBe(200);
    expect(result.payouts[1].profit).toBe(0);
    expect(result.playerBonus).toBe(0);
    expect(result.platformFee).toBe(0);
  });

  it("uses Math.floor for all calculations", () => {
    const supports: SupportEntry[] = [
      { supporterId: "fan1", backedId: "winner", amount: 100 },
      { supporterId: "fan2", backedId: "loser", amount: 7 }, // odd number for rounding
    ];
    const result = resolveSupports(supports, "winner");

    // losingPool = 7
    // toSupporters = floor(7 * 0.7) = floor(4.9) = 4
    // toPlayer = floor(7 * 0.2) = floor(1.4) = 1
    // toPlatform = floor(7 * 0.1) = floor(0.7) = 0
    expect(result.payouts[0].profit).toBe(4);
    expect(result.playerBonus).toBe(1);
    expect(result.platformFee).toBe(0);
  });
});

// ═════════════════════════════════════════════════════
// Formatters
// ═════════════════════════════════════════════════════
describe("idr formatter", () => {
  it("formats with Indonesian locale", () => {
    const result = idr(1000000);
    expect(result).toContain("Rp");
    expect(result).toContain("1");
  });

  it("formats zero", () => {
    expect(idr(0)).toContain("Rp");
    expect(idr(0)).toContain("0");
  });
});

describe("cr formatter", () => {
  it("formats credits", () => {
    const result = cr(50000);
    expect(result).toContain("Cr");
    expect(result).toContain("50");
  });
});

// ═════════════════════════════════════════════════════
// Constants integrity
// ═════════════════════════════════════════════════════
describe("DIVISIONS constant", () => {
  it("has 5 divisions", () => {
    expect(Object.keys(DIVISIONS)).toHaveLength(5);
  });

  it("division order has 5 entries in descending order", () => {
    expect(DIVISION_ORDER).toEqual(["diamond", "platinum", "gold", "silver", "bronze"]);
  });

  it("each division has min less than or equal to previous", () => {
    let prevMin = Infinity;
    for (const key of DIVISION_ORDER) {
      expect(DIVISIONS[key].min).toBeLessThanOrEqual(prevMin);
      prevMin = DIVISIONS[key].min;
    }
  });

  it("diamond has no next division", () => {
    expect(DIVISIONS.diamond.next).toBeNull();
  });

  it("bronze starts at 0", () => {
    expect(DIVISIONS.bronze.min).toBe(0);
  });
});
