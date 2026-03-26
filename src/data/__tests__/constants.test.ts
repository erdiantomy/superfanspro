import { describe, it, expect } from "vitest";
import {
  PLAYERS,
  MATCHES,
  REWARDS,
  LEADERBOARD,
  TRANSACTIONS,
  typeEmoji,
  txIcon,
  idr,
} from "../constants";

describe("PLAYERS", () => {
  it("is non-empty", () => {
    expect(PLAYERS.length).toBeGreaterThan(0);
  });

  it("each player has required fields", () => {
    for (const p of PLAYERS) {
      expect(p.id).toBeDefined();
      expect(p.name).toBeTruthy();
      expect(p.av).toBeTruthy();
      expect(typeof p.win).toBe("number");
      expect(typeof p.earnings).toBe("number");
    }
  });
});

describe("MATCHES", () => {
  it("is non-empty", () => {
    expect(MATCHES.length).toBeGreaterThan(0);
  });

  it("each match has valid status", () => {
    for (const m of MATCHES) {
      expect(["live", "upcoming", "finished"]).toContain(m.status);
    }
  });

  it("each match has two players", () => {
    for (const m of MATCHES) {
      expect(m.pA).toBeDefined();
      expect(m.pB).toBeDefined();
    }
  });

  it("finished matches have a winner", () => {
    for (const m of MATCHES.filter(m => m.status === "finished")) {
      expect(m.winner).toBeDefined();
    }
  });
});

describe("REWARDS", () => {
  it("is non-empty", () => {
    expect(REWARDS.length).toBeGreaterThan(0);
  });

  it("each reward has valid type covered by typeEmoji", () => {
    for (const r of REWARDS) {
      expect(typeEmoji[r.type]).toBeDefined();
    }
  });

  it("each reward has positive points", () => {
    for (const r of REWARDS) {
      expect(r.points).toBeGreaterThan(0);
    }
  });
});

describe("LEADERBOARD", () => {
  it("is non-empty", () => {
    expect(LEADERBOARD.length).toBeGreaterThan(0);
  });

  it("is sorted by rank ascending", () => {
    for (let i = 1; i < LEADERBOARD.length; i++) {
      expect(LEADERBOARD[i].rank).toBeGreaterThan(LEADERBOARD[i - 1].rank);
    }
  });
});

describe("TRANSACTIONS", () => {
  it("is non-empty", () => {
    expect(TRANSACTIONS.length).toBeGreaterThan(0);
  });

  it("each transaction type is covered by txIcon", () => {
    for (const t of TRANSACTIONS) {
      expect(txIcon[t.type]).toBeDefined();
    }
  });
});

describe("typeEmoji map", () => {
  it("covers voucher, sports, merch, experience", () => {
    expect(typeEmoji.voucher).toBeDefined();
    expect(typeEmoji.sports).toBeDefined();
    expect(typeEmoji.merch).toBeDefined();
    expect(typeEmoji.experience).toBeDefined();
  });
});

describe("txIcon map", () => {
  it("covers support, points, topup, redeem", () => {
    expect(txIcon.support).toBeDefined();
    expect(txIcon.points).toBeDefined();
    expect(txIcon.topup).toBeDefined();
    expect(txIcon.redeem).toBeDefined();
  });
});

describe("idr formatter", () => {
  it("formats number with Rp prefix", () => {
    const result = idr(1000000);
    expect(result).toContain("Rp");
  });
});
