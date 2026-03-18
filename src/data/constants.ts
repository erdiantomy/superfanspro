export interface Player {
  id: number;
  name: string;
  av: string;
  sport: string;
  tier: string;
  earnings: number;
  win: number;
}

export interface Match {
  id: number;
  title: string;
  pA: Player;
  pB: Player;
  status: "live" | "upcoming" | "finished";
  sA: number;
  sB: number;
  pool: number;
  supA: number;
  supB: number;
  fans: number;
  winner?: Player;
}

export interface Reward {
  id: number;
  title: string;
  value: string;
  points: number;
  stock: number;
  type: string;
  color: string;
}

export interface LeaderboardUser {
  rank: number;
  user: string;
  pts: number;
  sup: number;
  badge: string;
}

export interface Transaction {
  id: number;
  type: string;
  desc: string;
  idr: string;
  sp: string;
  time: string;
}

export const PLAYERS: Player[] = [
  { id: 1, name: "Rafi Syahputra", av: "RS", sport: "Padel", tier: "Pro", earnings: 12500000, win: 68 },
  { id: 2, name: "Bima Prasetyo", av: "BP", sport: "Padel", tier: "Pro", earnings: 9800000, win: 61 },
  { id: 3, name: "Deva Kusuma", av: "DK", sport: "Badminton", tier: "Elite", earnings: 18200000, win: 74 },
  { id: 4, name: "Andi Wirawan", av: "AW", sport: "Tennis", tier: "Rising", earnings: 5600000, win: 55 },
];

export const MATCHES: Match[] = [
  { id: 1, title: "Jakarta Open – Semifinal", pA: PLAYERS[0], pB: PLAYERS[1], status: "live", sA: 6, sB: 5, pool: 2450000, supA: 62, supB: 38, fans: 47 },
  { id: 2, title: "Bali Challenge – Final", pA: PLAYERS[2], pB: PLAYERS[3], status: "upcoming", sA: 0, sB: 0, pool: 1200000, supA: 71, supB: 29, fans: 28 },
  { id: 3, title: "Surabaya Cup – Quarterfinal", pA: PLAYERS[1], pB: PLAYERS[3], status: "upcoming", sA: 0, sB: 0, pool: 680000, supA: 45, supB: 55, fans: 19 },
  { id: 4, title: "Jakarta League – Round 1", pA: PLAYERS[2], pB: PLAYERS[0], status: "finished", sA: 7, sB: 5, pool: 3200000, supA: 58, supB: 42, fans: 89, winner: PLAYERS[2] },
];

export const REWARDS: Reward[] = [
  { id: 1, title: "GoPay Voucher", value: "Rp 10.000", points: 500, stock: 50, type: "voucher", color: "#00AED6" },
  { id: 2, title: "OVO Cashback", value: "Rp 25.000", points: 1000, stock: 30, type: "voucher", color: "#4C3494" },
  { id: 3, title: "Court Booking 20% OFF", value: "20% OFF", points: 750, stock: 20, type: "sports", color: "#00E676" },
  { id: 4, title: "FanPrize Jersey", value: "Exclusive", points: 2500, stock: 10, type: "merch", color: "#FF5252" },
  { id: 5, title: "Coaching Session", value: "1 Hour", points: 3000, stock: 5, type: "experience", color: "#FF9800" },
  { id: 6, title: "DANA Voucher", value: "Rp 50.000", points: 2000, stock: 15, type: "voucher", color: "#1890FF" },
];

export const LEADERBOARD: LeaderboardUser[] = [
  { rank: 1, user: "SportFan88", pts: 12450, sup: 34, badge: "🏆" },
  { rank: 2, user: "PadelKing", pts: 9800, sup: 28, badge: "🥈" },
  { rank: 3, user: "BaliRacer", pts: 7320, sup: 22, badge: "🥉" },
  { rank: 4, user: "TomRYU", pts: 5680, sup: 18, badge: "⭐" },
  { rank: 5, user: "CourtSide", pts: 4290, sup: 15, badge: "⭐" },
];

export const TRANSACTIONS: Transaction[] = [
  { id: 1, type: "support", desc: "Supported Rafi – Jakarta Open", idr: "Rp 50.000", sp: "+100 SP", time: "2h ago" },
  { id: 2, type: "points", desc: "Match Watch Bonus", idr: "Rp 0", sp: "+10 SP", time: "2h ago" },
  { id: 3, type: "topup", desc: "Top Up via GoPay", idr: "Rp 200.000", sp: "", time: "1d ago" },
  { id: 4, type: "redeem", desc: "GoPay Voucher Rp10k", idr: "Rp 0", sp: "-500 SP", time: "3d ago" },
  { id: 5, type: "support", desc: "Supported Deva – Bali Final", idr: "Rp 25.000", sp: "+20 SP", time: "4d ago" },
];

export const idr = (n: number) =>
  "Rp " + n.toLocaleString("id-ID");

export const typeEmoji: Record<string, string> = {
  voucher: "🎫",
  sports: "🏸",
  merch: "👕",
  experience: "⭐",
};

export const txIcon: Record<string, string> = {
  support: "↑",
  points: "🪙",
  topup: "↓",
  redeem: "↗",
};
