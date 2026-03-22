// ─────────────────────────────────────────────────────
// GAMIFICATION ENGINE — Tom's Arena
// Single source of truth for all XP/points logic
// ─────────────────────────────────────────────────────

export const RANK_MULTIPLIERS = [2.0, 1.7, 1.4, 1.2, 1.2, 1.2] as const;

export function getRankMultiplier(rank: number): number {
  return RANK_MULTIPLIERS[Math.min(rank - 1, RANK_MULTIPLIERS.length - 1)] ?? 1.0;
}

export function calcXP(won: boolean, sessionRank: number): number {
  return Math.round((won ? 100 : 50) * getRankMultiplier(sessionRank));
}

// ─── DIVISIONS ──────────────────────────────────────
export interface Division {
  label: string;
  color: string;
  min: number;
  next: number | null;
}

export const DIVISIONS: Record<string, Division> = {
  diamond:  { label: "Diamond",  color: "#60D5FF", min: 3000, next: null },
  platinum: { label: "Platinum", color: "#B8A9FF", min: 2400, next: 3000 },
  gold:     { label: "Gold",     color: "#FFD166", min: 1600, next: 2400 },
  silver:   { label: "Silver",   color: "#C0C0C0", min: 900,  next: 1600 },
  bronze:   { label: "Bronze",   color: "#CD7F32", min: 0,    next: 900  },
};

export const DIVISION_ORDER = ["diamond", "platinum", "gold", "silver", "bronze"] as const;
export type DivisionKey = typeof DIVISION_ORDER[number];

export function getDivision(xp: number): Division {
  for (const key of DIVISION_ORDER) {
    if (xp >= DIVISIONS[key].min) return DIVISIONS[key];
  }
  return DIVISIONS.bronze;
}

export function getDivisionKey(xp: number): DivisionKey {
  for (const key of DIVISION_ORDER) {
    if (xp >= DIVISIONS[key].min) return key;
  }
  return "bronze";
}

export function getDivisionProgress(xp: number): number {
  const div = getDivision(xp);
  if (!div.next) return 100;
  return Math.min(((xp - div.min) / (div.next - div.min)) * 100, 100);
}

export function getXpToNextDivision(xp: number): number | null {
  const div = getDivision(xp);
  return div.next ? div.next - xp : null;
}

// ─── SUPPORT PAYOUT CALCULATOR ───────────────────────
export interface SupportEntry {
  supporterId: string;
  backedId: string;
  amount: number;
}

export interface PayoutResult {
  supporterId: string;
  backedId: string;
  stake: number;
  payout: number;
  profit: number;
  won: boolean;
}

export interface SupportResolution {
  payouts: PayoutResult[];
  playerBonus: number;       // 20% to winning player
  platformFee: number;       // 10% to Tom's
  losingPool: number;
  totalPool: number;
}

export function resolveSupports(
  supports: SupportEntry[],
  winnerId: string
): SupportResolution {
  const totalPool  = supports.reduce((s, x) => s + x.amount, 0);
  const losingPool = supports.filter(s => s.backedId !== winnerId).reduce((s, x) => s + x.amount, 0);

  const toSupporters = Math.floor(losingPool * 0.70);
  const toPlayer     = Math.floor(losingPool * 0.20);
  const toPlatform   = Math.floor(losingPool * 0.10);

  const winStake = supports.filter(s => s.backedId === winnerId).reduce((s, x) => s + x.amount, 0);

  const payouts: PayoutResult[] = supports.map(s => {
    if (s.backedId === winnerId) {
      const share = winStake > 0 ? Math.floor((s.amount / winStake) * toSupporters) : 0;
      const payout = s.amount + share;
      return { supporterId: s.supporterId, backedId: s.backedId, stake: s.amount, payout, profit: share, won: true };
    }
    return { supporterId: s.supporterId, backedId: s.backedId, stake: s.amount, payout: 0, profit: -s.amount, won: false };
  });

  return { payouts, playerBonus: toPlayer, platformFee: toPlatform, losingPool, totalPool };
}

// ─── FORMATTERS ──────────────────────────────────────
export const idr = (n: number) => "Rp " + n.toLocaleString("id-ID");
export const cr  = (n: number) => "Cr " + n.toLocaleString("id-ID");
