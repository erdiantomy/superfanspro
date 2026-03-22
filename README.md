# Tom's Arena — Padel Gamification Platform

> **tomspadel.com** · Doubles padel · Americano & Mexicano · Live rankings · Player support system

Built on [SuperFansPro](https://github.com/erdiantomy/superfanspro) · Stack: Vite + React + TypeScript + Tailwind + Supabase

---

## Architecture

```
tomspadel.com/           → Public landing — live rankings, prize season
tomspadel.com/session/:code → Session page — auth-gated, host/player roles
tomspadel.com/host       → Host dashboard — create sessions, manage players
tomspadel.com/admin      → Staff admin — approve sessions + scores
tomspadel.com/auth       → Google OAuth sign-in
```

## Session Flow (Anti-Fraud)

```
Host creates session (pending_approval)
       ↓
Admin approves → status: active
       ↓
Host shares invite link (only after approval)
       ↓
Players open link → sign in with Google → request to join
       ↓
Host approves/declines each player
       ↓
Session runs — players self-report scores
       ↓
Admin approves scores → XP credited → support payouts resolve
       ↓
Leaderboard updates live (Supabase Realtime)
```

## Gamification

```
XP Formula:  (Win=100 / Loss=50) × rank_multiplier
Multipliers: 1st×2.0  2nd×1.7  3rd×1.4  4–6×1.2  7+×1.0

Two accumulators:
  lifetime_xp  → never resets → determines Division badge
  monthly_pts  → resets monthly → drives prize ladder

Divisions: Bronze → Silver → Gold → Platinum → Diamond
Prize:     Top 3 monthly winners share Rp 2.000.000

Support System:
  70% → winning supporters (proportional to stake)
  20% → winning player (credited to wallet)
  10% → Tom's Padel platform fee
```

## Setup

### 1. Clone & Install
```bash
git clone https://github.com/erdiantomy/superfanspro.git
cd superfanspro
npm install
```

### 2. Supabase Project
1. Create a new project at [supabase.com](https://supabase.com)
2. Run migrations in order:
   - `supabase/migrations/001_initial.sql` (existing)
   - `supabase/migrations/002_arena_tables.sql` (new)

### 3. Google OAuth
1. Supabase Dashboard → Authentication → Providers → Google
2. Add your Google OAuth credentials
3. Add redirect URL: `https://yourdomain.com/auth/callback`

### 4. Environment Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run
```bash
npm run dev
```

## Database Schema

| Table | Purpose |
|---|---|
| `padel_players` | Player profiles — XP, monthly pts, division, credits |
| `sessions` | Tournament sessions with approval workflow |
| `session_players` | Join requests + approved roster per session |
| `score_submissions` | Self-reported scores pending admin approval |
| `session_supports` | Fan/player support pool per session |
| `monthly_resets` | Monthly prize cycle tracking |

## Key Functions (Supabase RPC)

| Function | Purpose |
|---|---|
| `credit_xp_for_score(submission_id)` | Credits XP to players after admin approval |
| `resolve_support_payouts(session_id, winner_id)` | Distributes 70/20/10 support pool split |
| `update_division()` | Auto-trigger — updates division badge from XP |

## Real-time

All leaderboard updates, session changes, score approvals, and support pool changes broadcast via Supabase Realtime to all connected clients automatically. No polling required.

## Deployment

```bash
npm run build
# Deploy /dist to Vercel, Netlify, or any static host
```

---

Built with ❤️ for Tom's Padel Arena
