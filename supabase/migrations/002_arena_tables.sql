-- =====================================================
-- TOM'S ARENA — PADEL GAMIFICATION SYSTEM
-- Migration 002: Core arena tables
-- =====================================================

-- ─── ENUMS ───────────────────────────────────────────
CREATE TYPE public.session_status AS ENUM (
  'pending_approval', 'active', 'live', 'finished', 'rejected'
);

CREATE TYPE public.session_format AS ENUM ('americano', 'mexicano');
CREATE TYPE public.partner_type   AS ENUM ('random', 'fixed');
CREATE TYPE public.player_role    AS ENUM ('host', 'player');
CREATE TYPE public.join_status    AS ENUM ('pending', 'approved', 'declined');
CREATE TYPE public.score_status   AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.division_tier  AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');

-- ─── 1. PADEL PLAYERS ────────────────────────────────
-- Extended player profile on top of auth.users / profiles
CREATE TABLE public.padel_players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT '',
  avatar          TEXT NOT NULL DEFAULT 'PP',   -- 2-letter initials
  email           TEXT NOT NULL DEFAULT '',
  lifetime_xp     INTEGER NOT NULL DEFAULT 0,
  monthly_pts     INTEGER NOT NULL DEFAULT 0,
  wins            INTEGER NOT NULL DEFAULT 0,
  losses          INTEGER NOT NULL DEFAULT 0,
  streak          INTEGER NOT NULL DEFAULT 0,
  credits         BIGINT  NOT NULL DEFAULT 0,   -- in-app credits (Cr)
  division        division_tier NOT NULL DEFAULT 'bronze',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.padel_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players readable by all"     ON public.padel_players FOR SELECT USING (true);
CREATE POLICY "Players insert own"          ON public.padel_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Players update own"          ON public.padel_players FOR UPDATE USING (auth.uid() = user_id);

-- Auto-update division based on lifetime_xp
CREATE OR REPLACE FUNCTION public.update_division()
RETURNS TRIGGER AS $$
BEGIN
  NEW.division := CASE
    WHEN NEW.lifetime_xp >= 3000 THEN 'diamond'::division_tier
    WHEN NEW.lifetime_xp >= 2400 THEN 'platinum'::division_tier
    WHEN NEW.lifetime_xp >= 1600 THEN 'gold'::division_tier
    WHEN NEW.lifetime_xp >= 900  THEN 'silver'::division_tier
    ELSE 'bronze'::division_tier
  END;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_division
  BEFORE INSERT OR UPDATE OF lifetime_xp ON public.padel_players
  FOR EACH ROW EXECUTE FUNCTION public.update_division();

-- ─── 2. SESSIONS ─────────────────────────────────────
CREATE TABLE public.sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT NOT NULL UNIQUE,               -- e.g. TOMSP-A7R2
  name             TEXT NOT NULL,
  format           session_format NOT NULL DEFAULT 'americano',
  partner_type     partner_type   NOT NULL DEFAULT 'random',
  courts           INTEGER NOT NULL DEFAULT 2,
  total_rounds     INTEGER NOT NULL DEFAULT 7,
  current_round    INTEGER NOT NULL DEFAULT 0,
  points_per_match INTEGER NOT NULL DEFAULT 32,        -- display only
  status           session_status NOT NULL DEFAULT 'pending_approval',
  host_id          UUID NOT NULL REFERENCES public.padel_players(id),
  max_players      INTEGER NOT NULL DEFAULT 8,
  locked           BOOLEAN NOT NULL DEFAULT false,
  scheduled_at     TIMESTAMPTZ,
  started_at       TIMESTAMPTZ,
  finished_at      TIMESTAMPTZ,
  admin_note       TEXT,
  approved_by      UUID REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sessions readable by all"    ON public.sessions FOR SELECT USING (true);
CREATE POLICY "Sessions insert by auth"     ON public.sessions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Sessions update by host"     ON public.sessions FOR UPDATE USING (
  host_id IN (SELECT id FROM public.padel_players WHERE user_id = auth.uid())
  OR auth.uid() IN (SELECT user_id FROM public.padel_players WHERE id = host_id)
);

-- Auto-generate session code
CREATE OR REPLACE FUNCTION public.generate_session_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'TOMSP-' || upper(substring(md5(random()::text) from 1 for 4));
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_session_code
  BEFORE INSERT ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.generate_session_code();

-- ─── 3. SESSION PLAYERS ──────────────────────────────
-- Tracks who is in each session and their join status
CREATE TABLE public.session_players (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES public.padel_players(id) ON DELETE CASCADE,
  role        player_role NOT NULL DEFAULT 'player',
  status      join_status NOT NULL DEFAULT 'pending',
  joined_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, player_id)
);

ALTER TABLE public.session_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Session players readable by all"  ON public.session_players FOR SELECT USING (true);
CREATE POLICY "Session players insert by auth"   ON public.session_players FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Session players update by host"   ON public.session_players FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ─── 4. SCORE SUBMISSIONS ────────────────────────────
-- Self-reported match scores — require admin approval before XP is credited
CREATE TABLE public.score_submissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id            UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  court                 INTEGER NOT NULL,
  round                 INTEGER NOT NULL,
  team_a_p1             UUID NOT NULL REFERENCES public.padel_players(id),
  team_a_p2             UUID NOT NULL REFERENCES public.padel_players(id),
  team_b_p1             UUID NOT NULL REFERENCES public.padel_players(id),
  team_b_p2             UUID NOT NULL REFERENCES public.padel_players(id),
  score_a               TEXT NOT NULL DEFAULT '0',  -- free text, any format
  score_b               TEXT NOT NULL DEFAULT '0',
  winner_team           TEXT CHECK (winner_team IN ('a','b')),
  reported_by           UUID NOT NULL REFERENCES public.padel_players(id),
  session_rank_winners  INTEGER NOT NULL DEFAULT 1,
  session_rank_losers   INTEGER NOT NULL DEFAULT 5,
  status                score_status NOT NULL DEFAULT 'pending',
  admin_note            TEXT,
  reviewed_by           UUID REFERENCES auth.users(id),
  reviewed_at           TIMESTAMPTZ,
  xp_credited           BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.score_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scores readable by all"    ON public.score_submissions FOR SELECT USING (true);
CREATE POLICY "Scores insert by auth"     ON public.score_submissions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Scores update by admin"    ON public.score_submissions FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ─── 5. SESSION SUPPORTS ─────────────────────────────
-- Players/fans back a player in a session (support pool)
-- Window: open until session scheduled_at — enforced by trigger
CREATE TABLE public.session_supports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  supporter_id UUID NOT NULL REFERENCES public.padel_players(id),
  backed_id    UUID NOT NULL REFERENCES public.padel_players(id),
  amount       BIGINT NOT NULL,    -- in credits
  payout       BIGINT,             -- filled after resolution
  resolved     BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_support CHECK (supporter_id != backed_id),
  UNIQUE(session_id, supporter_id)  -- one support per session per person
);

ALTER TABLE public.session_supports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supports readable by all"   ON public.session_supports FOR SELECT USING (true);
CREATE POLICY "Supports insert by auth"    ON public.session_supports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Supports update by admin"   ON public.session_supports FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ─── 6. MONTHLY RESETS ───────────────────────────────
-- Tracks monthly reset cycles for the prize ladder
CREATE TABLE public.monthly_resets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reset_date     DATE NOT NULL DEFAULT current_date,
  prize_first    BIGINT NOT NULL DEFAULT 1000000,
  prize_second   BIGINT NOT NULL DEFAULT 600000,
  prize_third    BIGINT NOT NULL DEFAULT 400000,
  winner_first   UUID REFERENCES public.padel_players(id),
  winner_second  UUID REFERENCES public.padel_players(id),
  winner_third   UUID REFERENCES public.padel_players(id),
  completed      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_resets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resets readable by all"  ON public.monthly_resets FOR SELECT USING (true);

-- ─── REALTIME SUBSCRIPTIONS ──────────────────────────
-- Enable Supabase Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.padel_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.score_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_supports;

-- ─── LEADERBOARD VIEWS ───────────────────────────────
CREATE OR REPLACE VIEW public.monthly_leaderboard AS
  SELECT
    p.id, p.user_id, p.name, p.avatar, p.monthly_pts,
    p.lifetime_xp, p.division, p.wins, p.losses, p.streak,
    rank() OVER (ORDER BY p.monthly_pts DESC) AS monthly_rank
  FROM public.padel_players p
  ORDER BY p.monthly_pts DESC;

CREATE OR REPLACE VIEW public.lifetime_leaderboard AS
  SELECT
    p.id, p.user_id, p.name, p.avatar, p.monthly_pts,
    p.lifetime_xp, p.division, p.wins, p.losses, p.streak,
    rank() OVER (ORDER BY p.lifetime_xp DESC) AS lifetime_rank
  FROM public.padel_players p
  ORDER BY p.lifetime_xp DESC;

-- ─── FUNCTION: CREDIT XP AFTER SCORE APPROVAL ────────
-- Called by admin when approving a score submission
CREATE OR REPLACE FUNCTION public.credit_xp_for_score(submission_id UUID)
RETURNS void AS $$
DECLARE
  sub RECORD;
  xp_win  INTEGER;
  xp_lose INTEGER;
BEGIN
  SELECT * INTO sub FROM public.score_submissions WHERE id = submission_id;
  IF sub IS NULL OR sub.xp_credited THEN RETURN; END IF;

  -- XP formula: (Win=100/Loss=50) × rank_multiplier
  xp_win  := ROUND(100 * CASE sub.session_rank_winners
    WHEN 1 THEN 2.0 WHEN 2 THEN 1.7 WHEN 3 THEN 1.4
    WHEN 4 THEN 1.2 WHEN 5 THEN 1.2 WHEN 6 THEN 1.2
    ELSE 1.0 END);
  xp_lose := ROUND(50 * CASE sub.session_rank_losers
    WHEN 1 THEN 2.0 WHEN 2 THEN 1.7 WHEN 3 THEN 1.4
    WHEN 4 THEN 1.2 WHEN 5 THEN 1.2 WHEN 6 THEN 1.2
    ELSE 1.0 END);

  -- Determine winner team from score
  IF sub.winner_team = 'a' THEN
    UPDATE public.padel_players SET
      lifetime_xp = lifetime_xp + xp_win,
      monthly_pts = monthly_pts + xp_win,
      wins        = wins + 1
    WHERE id IN (sub.team_a_p1, sub.team_a_p2);

    UPDATE public.padel_players SET
      lifetime_xp = lifetime_xp + xp_lose,
      monthly_pts = monthly_pts + xp_lose,
      losses      = losses + 1
    WHERE id IN (sub.team_b_p1, sub.team_b_p2);
  ELSE
    UPDATE public.padel_players SET
      lifetime_xp = lifetime_xp + xp_win,
      monthly_pts = monthly_pts + xp_win,
      wins        = wins + 1
    WHERE id IN (sub.team_b_p1, sub.team_b_p2);

    UPDATE public.padel_players SET
      lifetime_xp = lifetime_xp + xp_lose,
      monthly_pts = monthly_pts + xp_lose,
      losses      = losses + 1
    WHERE id IN (sub.team_a_p1, sub.team_a_p2);
  END IF;

  -- Mark as credited
  UPDATE public.score_submissions
  SET xp_credited = true, status = 'approved', reviewed_at = now()
  WHERE id = submission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── FUNCTION: RESOLVE SUPPORT PAYOUTS ───────────────
-- 70% to winning supporters (pro-rata) / 20% to winning player / 10% platform
CREATE OR REPLACE FUNCTION public.resolve_support_payouts(p_session_id UUID, winner_player_id UUID)
RETURNS void AS $$
DECLARE
  losing_pool   BIGINT;
  to_supporters BIGINT;
  to_player     BIGINT;
  total_win_stake BIGINT;
  sup RECORD;
BEGIN
  -- Calculate losing pool
  SELECT COALESCE(SUM(amount), 0) INTO losing_pool
  FROM public.session_supports
  WHERE session_id = p_session_id AND backed_id != winner_player_id;

  IF losing_pool = 0 THEN RETURN; END IF;

  to_supporters := (losing_pool * 70) / 100;
  to_player     := (losing_pool * 20) / 100;

  -- Total stake on winner (for proportional split)
  SELECT COALESCE(SUM(amount), 0) INTO total_win_stake
  FROM public.session_supports
  WHERE session_id = p_session_id AND backed_id = winner_player_id;

  -- Pay winning supporters (stake back + proportional share)
  FOR sup IN
    SELECT * FROM public.session_supports
    WHERE session_id = p_session_id AND backed_id = winner_player_id
  LOOP
    DECLARE payout BIGINT;
    BEGIN
      payout := sup.amount + CASE WHEN total_win_stake > 0
        THEN (sup.amount * to_supporters) / total_win_stake
        ELSE 0 END;

      UPDATE public.session_supports SET payout = payout, resolved = true WHERE id = sup.id;
      UPDATE public.padel_players SET credits = credits + payout WHERE id = sup.supporter_id;
    END;
  END LOOP;

  -- Pay winning player
  UPDATE public.padel_players SET credits = credits + to_player WHERE id = winner_player_id;

  -- Mark losing supports as resolved (payout = 0)
  UPDATE public.session_supports
  SET payout = 0, resolved = true
  WHERE session_id = p_session_id AND backed_id != winner_player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

