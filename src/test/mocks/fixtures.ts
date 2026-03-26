/* eslint-disable @typescript-eslint/no-explicit-any */
// ─── Synthetic Test Data ─────────────────────────────
// Types imported from hooks — but we define plain objects to avoid
// importing the real supabase client at fixture-time.

// ─── PLAYERS ─────────────────────────────────────────
export const MOCK_PLAYERS = [
  {
    id: "p1", user_id: "u1", name: "Rafi Syahputra", avatar: "RS",
    email: "rafi@test.com", lifetime_xp: 3200, monthly_pts: 850,
    wins: 32, losses: 8, streak: 5, credits: 500000, division: "diamond",
  },
  {
    id: "p2", user_id: "u2", name: "Bima Prasetyo", avatar: "BP",
    email: "bima@test.com", lifetime_xp: 2500, monthly_pts: 600,
    wins: 25, losses: 12, streak: 2, credits: 300000, division: "platinum",
  },
  {
    id: "p3", user_id: "u3", name: "Deva Kusuma", avatar: "DK",
    email: "deva@test.com", lifetime_xp: 1700, monthly_pts: 420,
    wins: 18, losses: 14, streak: 0, credits: 150000, division: "gold",
  },
  {
    id: "p4", user_id: "u4", name: "Andi Wirawan", avatar: "AW",
    email: "andi@test.com", lifetime_xp: 950, monthly_pts: 280,
    wins: 12, losses: 15, streak: 1, credits: 80000, division: "silver",
  },
  {
    id: "p5", user_id: "u5", name: "Fajar Nugraha", avatar: "FN",
    email: "fajar@test.com", lifetime_xp: 400, monthly_pts: 120,
    wins: 5, losses: 10, streak: 0, credits: 50000, division: "bronze",
  },
  {
    id: "p6", user_id: "u6", name: "Gilang Ramadhan", avatar: "GR",
    email: "gilang@test.com", lifetime_xp: 0, monthly_pts: 0,
    wins: 0, losses: 0, streak: 0, credits: 100000, division: "bronze",
  },
];

// ─── VENUES ──────────────────────────────────────────
export const MOCK_VENUE = {
  id: "v1", slug: "tomspadel", name: "Tom's Padel Arena",
  logo_url: null, city: "Jakarta", country: "Indonesia",
  courts_default: 4, monthly_prize: 5000000,
  prize_split_1st: 50, prize_split_2nd: 30, prize_split_3rd: 20,
  primary_color: "#00E676",
  contact_name: "Tom Admin", contact_email: "tom@test.com",
  contact_phone: "+62812345678", status: "active",
  created_at: "2026-01-01T00:00:00Z",
};

export const MOCK_VENUE_2 = {
  id: "v2", slug: "balipadel", name: "Bali Padel Club",
  logo_url: "https://example.com/logo.png", city: "Bali", country: "Indonesia",
  courts_default: 2, monthly_prize: 3000000,
  prize_split_1st: 60, prize_split_2nd: 25, prize_split_3rd: 15,
  primary_color: "#1890FF",
  contact_name: "Bali Admin", contact_email: "bali@test.com",
  contact_phone: "+62898765432", status: "active",
  created_at: "2026-02-01T00:00:00Z",
};

// ─── SESSIONS ────────────────────────────────────────
export const MOCK_SESSIONS = [
  {
    id: "s1", code: "TOMSP-0001", name: "Wednesday Night Padel",
    format: "americano" as const, partner_type: "random" as const,
    courts: 4, total_rounds: 7, current_round: 3,
    status: "live" as const, host_id: "p1", max_players: 16,
    locked: false, scheduled_at: "2026-03-26T18:00:00Z",
    admin_note: null, approved_at: "2026-03-25T10:00:00Z",
    created_at: "2026-03-24T08:00:00Z",
    host: MOCK_PLAYERS[0],
  },
  {
    id: "s2", code: "TOMSP-0002", name: "Weekend Tournament",
    format: "mexicano" as const, partner_type: "fixed" as const,
    courts: 2, total_rounds: 5, current_round: 0,
    status: "active" as const, host_id: "p2", max_players: 8,
    locked: false, scheduled_at: "2026-03-28T10:00:00Z",
    admin_note: null, approved_at: "2026-03-26T08:00:00Z",
    created_at: "2026-03-25T12:00:00Z",
    host: MOCK_PLAYERS[1],
  },
  {
    id: "s3", code: "TOMSP-0003", name: "Morning Drill",
    format: "americano" as const, partner_type: "random" as const,
    courts: 2, total_rounds: 5, current_round: 0,
    status: "pending_approval" as const, host_id: "p3", max_players: 8,
    locked: false, scheduled_at: "2026-03-30T07:00:00Z",
    admin_note: null, approved_at: null,
    created_at: "2026-03-26T06:00:00Z",
    host: MOCK_PLAYERS[2],
  },
  {
    id: "s4", code: "TOMSP-0004", name: "Last Week Finals",
    format: "americano" as const, partner_type: "random" as const,
    courts: 4, total_rounds: 7, current_round: 7,
    status: "finished" as const, host_id: "p1", max_players: 16,
    locked: true, scheduled_at: "2026-03-20T18:00:00Z",
    admin_note: null, approved_at: "2026-03-19T10:00:00Z",
    created_at: "2026-03-18T08:00:00Z",
    host: MOCK_PLAYERS[0],
  },
];

// ─── SESSION PLAYERS ─────────────────────────────────
export const MOCK_SESSION_PLAYERS = [
  { id: "sp1", session_id: "s1", player_id: "p1", role: "host" as const, status: "approved" as const, joined_at: "2026-03-24T08:00:00Z", created_at: "2026-03-24T08:00:00Z", player: MOCK_PLAYERS[0] },
  { id: "sp2", session_id: "s1", player_id: "p2", role: "player" as const, status: "approved" as const, joined_at: "2026-03-25T09:00:00Z", created_at: "2026-03-25T09:00:00Z", player: MOCK_PLAYERS[1] },
  { id: "sp3", session_id: "s1", player_id: "p3", role: "player" as const, status: "approved" as const, joined_at: "2026-03-25T10:00:00Z", created_at: "2026-03-25T10:00:00Z", player: MOCK_PLAYERS[2] },
  { id: "sp4", session_id: "s1", player_id: "p4", role: "player" as const, status: "pending" as const, joined_at: null, created_at: "2026-03-26T07:00:00Z", player: MOCK_PLAYERS[3] },
  { id: "sp5", session_id: "s1", player_id: "p5", role: "player" as const, status: "declined" as const, joined_at: null, created_at: "2026-03-26T08:00:00Z", player: MOCK_PLAYERS[4] },
];

// ─── SCORE SUBMISSIONS ──────────────────────────────
export const MOCK_SCORES = [
  {
    id: "sc1", session_id: "s1", court: 1, round: 1,
    team_a_p1: "p1", team_a_p2: "p2", team_b_p1: "p3", team_b_p2: "p4",
    score_a: "6", score_b: "4", winner_team: "a" as const,
    reported_by: "p1", session_rank_winners: 1, session_rank_losers: 3,
    status: "approved" as const, xp_credited: true,
    created_at: "2026-03-26T18:30:00Z",
  },
  {
    id: "sc2", session_id: "s1", court: 2, round: 1,
    team_a_p1: "p5", team_a_p2: "p6", team_b_p1: "p1", team_b_p2: "p3",
    score_a: "3", score_b: "6", winner_team: "b" as const,
    reported_by: "p1", session_rank_winners: 2, session_rank_losers: 4,
    status: "pending" as const, xp_credited: false,
    created_at: "2026-03-26T19:00:00Z",
  },
  {
    id: "sc3", session_id: "s1", court: 1, round: 2,
    team_a_p1: "p2", team_a_p2: "p4", team_b_p1: "p1", team_b_p2: "p5",
    score_a: "5", score_b: "7", winner_team: "b" as const,
    reported_by: "p1", session_rank_winners: 1, session_rank_losers: 2,
    status: "pending" as const, xp_credited: false,
    created_at: "2026-03-26T19:30:00Z",
  },
  {
    id: "sc4", session_id: "s4", court: 1, round: 1,
    team_a_p1: "p1", team_a_p2: "p3", team_b_p1: "p2", team_b_p2: "p4",
    score_a: "4", score_b: "6", winner_team: "b" as const,
    reported_by: "p1", session_rank_winners: 2, session_rank_losers: 3,
    status: "rejected" as const, xp_credited: false,
    created_at: "2026-03-20T19:00:00Z",
  },
];

// ─── SESSION SUPPORTS ────────────────────────────────
export const MOCK_SUPPORTS = [
  { id: "sup1", session_id: "s1", supporter_id: "p3", backed_id: "p1", amount: 50000, payout: null, resolved: false },
  { id: "sup2", session_id: "s1", supporter_id: "p4", backed_id: "p1", amount: 30000, payout: null, resolved: false },
  { id: "sup3", session_id: "s1", supporter_id: "p5", backed_id: "p2", amount: 40000, payout: null, resolved: false },
  { id: "sup4", session_id: "s2", supporter_id: "p1", backed_id: "p3", amount: 100000, payout: null, resolved: false },
  { id: "sup5", session_id: "s4", supporter_id: "p2", backed_id: "p1", amount: 25000, payout: 35000, resolved: true },
  { id: "sup6", session_id: "s4", supporter_id: "p3", backed_id: "p4", amount: 25000, payout: 0, resolved: true },
];

// ─── CREDIT PACKAGES ─────────────────────────────────
export const MOCK_CREDIT_PACKAGES = [
  { id: "cp1", name: "Starter", credits: 50000, price_idr: 50000, bonus_pct: 0, active: true, sort_order: 1 },
  { id: "cp2", name: "Regular", credits: 110000, price_idr: 100000, bonus_pct: 10, active: true, sort_order: 2 },
  { id: "cp3", name: "Pro", credits: 250000, price_idr: 200000, bonus_pct: 25, active: true, sort_order: 3 },
  { id: "cp4", name: "Elite", credits: 600000, price_idr: 500000, bonus_pct: 20, active: true, sort_order: 4 },
];

// ─── VENUE REGISTRATIONS ─────────────────────────────
export const MOCK_REGISTRATIONS = [
  {
    id: "vr1", venue_name: "Surabaya Padel", slug: "surabayapadel",
    contact_name: "Ahmad", contact_email: "ahmad@test.com",
    contact_phone: "+6281234567", city: "Surabaya", country: "Indonesia",
    courts: 3, monthly_prize: 2000000,
    prize_split_1st: 50, prize_split_2nd: 30, prize_split_3rd: 20,
    admin_password_hash: "hashed", logo_url: null,
    primary_color: "#FF5252", status: "pending",
    created_at: "2026-03-25T12:00:00Z",
  },
];

// ─── AUTH OBJECTS ─────────────────────────────────────
export const MOCK_USER = {
  id: "u1",
  email: "rafi@test.com",
  user_metadata: {
    full_name: "Rafi Syahputra",
    name: "Rafi Syahputra",
    avatar_url: "https://example.com/avatar.jpg",
  },
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
};

export const MOCK_AUTH_SESSION = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user: MOCK_USER,
};
