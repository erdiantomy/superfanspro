-- ═══════════════════════════════════════════════════════════════
--  NOTIFICATION SYSTEM — tables, triggers, RLS, realtime
-- ═══════════════════════════════════════════════════════════════

-- ─── ENUM ────────────────────────────────────────────────────
CREATE TYPE public.notification_type AS ENUM (
  'score_approved',
  'support_payout',
  'division_promotion',
  'session_approved',
  'session_rejected',
  'monthly_prize',
  'join_request_received',
  'join_request_approved',
  'join_request_declined',
  'payment_completed'
);

-- ─── NOTIFICATIONS TABLE ─────────────────────────────────────
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        public.notification_type NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB NOT NULL DEFAULT '{}',
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_user_unread  ON public.notifications (user_id, read, created_at DESC);
CREATE INDEX idx_notif_user_created ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System inserts via SECURITY DEFINER functions — no direct insert policy.

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ─── NOTIFICATION PREFERENCES TABLE ──────────────────────────
CREATE TABLE public.notification_preferences (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  in_app_enabled      BOOLEAN NOT NULL DEFAULT true,
  email_enabled       BOOLEAN NOT NULL DEFAULT false,
  score_approved      BOOLEAN NOT NULL DEFAULT true,
  support_payout      BOOLEAN NOT NULL DEFAULT true,
  division_promotion  BOOLEAN NOT NULL DEFAULT true,
  session_approved    BOOLEAN NOT NULL DEFAULT true,
  session_rejected    BOOLEAN NOT NULL DEFAULT true,
  monthly_prize       BOOLEAN NOT NULL DEFAULT true,
  join_request        BOOLEAN NOT NULL DEFAULT true,
  payment_completed   BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own prefs"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own prefs"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own prefs"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════
--  HELPER: create_notification()
--  Checks user preferences before inserting a notification row.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id  UUID,
  p_type     public.notification_type,
  p_title    TEXT,
  p_body     TEXT,
  p_data     JSONB DEFAULT '{}'
) RETURNS void AS $$
BEGIN
  -- Respect master in-app toggle
  IF EXISTS (
    SELECT 1 FROM public.notification_preferences
    WHERE user_id = p_user_id AND in_app_enabled = false
  ) THEN RETURN; END IF;

  -- Respect per-type toggle
  IF EXISTS (
    SELECT 1 FROM public.notification_preferences np
    WHERE np.user_id = p_user_id
      AND CASE p_type
        WHEN 'score_approved'       THEN NOT np.score_approved
        WHEN 'support_payout'       THEN NOT np.support_payout
        WHEN 'division_promotion'   THEN NOT np.division_promotion
        WHEN 'session_approved'     THEN NOT np.session_approved
        WHEN 'session_rejected'     THEN NOT np.session_rejected
        WHEN 'monthly_prize'        THEN NOT np.monthly_prize
        WHEN 'join_request_received' THEN NOT np.join_request
        WHEN 'join_request_approved' THEN NOT np.join_request
        WHEN 'join_request_declined' THEN NOT np.join_request
        WHEN 'payment_completed'    THEN NOT np.payment_completed
        ELSE false
      END
  ) THEN RETURN; END IF;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_data);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════
--  TRIGGER: Score Approved → notify 4 players
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.notify_score_approved()
RETURNS TRIGGER AS $$
DECLARE
  player_ids UUID[];
  pid UUID;
  xp_val INTEGER;
  player_user_id UUID;
  session_name TEXT;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    SELECT s.name INTO session_name
    FROM public.sessions s WHERE s.id = NEW.session_id;

    player_ids := ARRAY[NEW.team_a_p1, NEW.team_a_p2, NEW.team_b_p1, NEW.team_b_p2];

    FOREACH pid IN ARRAY player_ids LOOP
      SELECT p.user_id INTO player_user_id
      FROM public.padel_players p WHERE p.id = pid;

      IF player_user_id IS NOT NULL THEN
        IF (NEW.winner_team = 'a' AND pid IN (NEW.team_a_p1, NEW.team_a_p2))
           OR (NEW.winner_team = 'b' AND pid IN (NEW.team_b_p1, NEW.team_b_p2)) THEN
          xp_val := ROUND(100 * CASE COALESCE(NEW.session_rank_winners, 5)
            WHEN 1 THEN 2.0 WHEN 2 THEN 1.7 WHEN 3 THEN 1.4 ELSE 1.2 END);
          PERFORM public.create_notification(
            player_user_id, 'score_approved',
            'Match Won! +' || xp_val || ' XP',
            'Score approved in ' || COALESCE(session_name, 'session') || '. You earned ' || xp_val || ' XP!',
            jsonb_build_object('session_id', NEW.session_id, 'score_id', NEW.id, 'xp', xp_val, 'won', true)
          );
        ELSE
          xp_val := ROUND(50 * CASE COALESCE(NEW.session_rank_losers, 5)
            WHEN 1 THEN 2.0 WHEN 2 THEN 1.7 WHEN 3 THEN 1.4 ELSE 1.2 END);
          PERFORM public.create_notification(
            player_user_id, 'score_approved',
            'Match Result +' || xp_val || ' XP',
            'Score approved in ' || COALESCE(session_name, 'session') || '. You earned ' || xp_val || ' XP.',
            jsonb_build_object('session_id', NEW.session_id, 'score_id', NEW.id, 'xp', xp_val, 'won', false)
          );
        END IF;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_score_approved
  AFTER UPDATE OF status ON public.score_submissions
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION public.notify_score_approved();


-- ═══════════════════════════════════════════════════════════════
--  TRIGGER: Support Payout Resolved → notify supporter
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.notify_support_payout()
RETURNS TRIGGER AS $$
DECLARE
  supporter_user_id UUID;
BEGIN
  IF NEW.resolved = true AND OLD.resolved = false THEN
    SELECT p.user_id INTO supporter_user_id
    FROM public.padel_players p WHERE p.id = NEW.supporter_id;

    IF supporter_user_id IS NOT NULL THEN
      IF COALESCE(NEW.payout, 0) > 0 THEN
        PERFORM public.create_notification(
          supporter_user_id, 'support_payout',
          'Support Won! +Cr ' || NEW.payout::TEXT,
          'Your backed player won! You earned Cr ' || NEW.payout::TEXT || '.',
          jsonb_build_object('session_id', NEW.session_id, 'payout', NEW.payout, 'won', true)
        );
      ELSE
        PERFORM public.create_notification(
          supporter_user_id, 'support_payout',
          'Support Result',
          'Your backed player did not win. Your Cr ' || NEW.amount::TEXT || ' stake was lost.',
          jsonb_build_object('session_id', NEW.session_id, 'amount', NEW.amount, 'won', false)
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_support_payout
  AFTER UPDATE OF resolved ON public.session_supports
  FOR EACH ROW
  WHEN (NEW.resolved = true AND OLD.resolved = false)
  EXECUTE FUNCTION public.notify_support_payout();


-- ═══════════════════════════════════════════════════════════════
--  TRIGGER: Division Promotion → notify player
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.notify_division_promotion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.division != OLD.division AND NEW.lifetime_xp > OLD.lifetime_xp THEN
    PERFORM public.create_notification(
      NEW.user_id, 'division_promotion',
      'Promoted to ' || initcap(NEW.division::TEXT) || '!',
      'Congratulations! You''ve reached the ' || initcap(NEW.division::TEXT) || ' division with ' || NEW.lifetime_xp || ' XP.',
      jsonb_build_object('division', NEW.division, 'lifetime_xp', NEW.lifetime_xp)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_division_promotion
  AFTER UPDATE OF division ON public.padel_players
  FOR EACH ROW
  WHEN (NEW.division IS DISTINCT FROM OLD.division)
  EXECUTE FUNCTION public.notify_division_promotion();


-- ═══════════════════════════════════════════════════════════════
--  TRIGGER: Session Approved / Rejected → notify host
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.notify_session_status_change()
RETURNS TRIGGER AS $$
DECLARE
  host_user_id UUID;
BEGIN
  SELECT p.user_id INTO host_user_id
  FROM public.padel_players p WHERE p.id = NEW.host_id;

  IF host_user_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.status = 'active' AND OLD.status = 'pending_approval' THEN
    PERFORM public.create_notification(
      host_user_id, 'session_approved',
      'Session Approved!',
      'Your session "' || NEW.name || '" has been approved. Share the invite link!',
      jsonb_build_object('session_id', NEW.id, 'session_code', NEW.code)
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending_approval' THEN
    PERFORM public.create_notification(
      host_user_id, 'session_rejected',
      'Session Rejected',
      'Your session "' || NEW.name || '" was not approved.' || COALESCE(' Reason: ' || NEW.admin_note, ''),
      jsonb_build_object('session_id', NEW.id, 'admin_note', NEW.admin_note)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_session_status
  AFTER UPDATE OF status ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_session_status_change();


-- ═══════════════════════════════════════════════════════════════
--  TRIGGER: Join Request → notify host / player
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.notify_join_request()
RETURNS TRIGGER AS $$
DECLARE
  session_rec   RECORD;
  host_user_id  UUID;
  req_user_id   UUID;
  req_name      TEXT;
BEGIN
  -- Fetch session + host info
  SELECT s.id, s.name, s.code, p.user_id AS host_uid
    INTO session_rec
  FROM public.sessions s
  JOIN public.padel_players p ON p.id = s.host_id
  WHERE s.id = NEW.session_id;

  -- New join request → notify host
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    SELECT p.name, p.user_id INTO req_name, req_user_id
    FROM public.padel_players p WHERE p.id = NEW.player_id;

    IF session_rec.host_uid IS NOT NULL THEN
      PERFORM public.create_notification(
        session_rec.host_uid, 'join_request_received',
        'New Join Request',
        COALESCE(req_name, 'A player') || ' wants to join "' || session_rec.name || '".',
        jsonb_build_object('session_id', NEW.session_id, 'player_id', NEW.player_id, 'session_code', session_rec.code)
      );
    END IF;
  END IF;

  -- Status changed → notify the requesting player
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status IN ('approved', 'declined') THEN
    SELECT p.user_id INTO req_user_id
    FROM public.padel_players p WHERE p.id = NEW.player_id;

    IF req_user_id IS NOT NULL THEN
      IF NEW.status = 'approved' THEN
        PERFORM public.create_notification(
          req_user_id, 'join_request_approved',
          'You''re In!',
          'Your request to join "' || session_rec.name || '" was approved.',
          jsonb_build_object('session_id', NEW.session_id, 'session_code', session_rec.code)
        );
      ELSE
        PERFORM public.create_notification(
          req_user_id, 'join_request_declined',
          'Request Declined',
          'Your request to join "' || session_rec.name || '" was declined.',
          jsonb_build_object('session_id', NEW.session_id)
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_join_request
  AFTER INSERT OR UPDATE OF status ON public.session_players
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_join_request();


-- ═══════════════════════════════════════════════════════════════
--  TRIGGER: Payment Completed → notify player
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.notify_payment_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    -- payment_orders.player_id is auth.users.id (confirmed by RLS: player_id = auth.uid())
    PERFORM public.create_notification(
      NEW.player_id, 'payment_completed',
      'Credits Added!',
      'Cr ' || NEW.credits_amount::TEXT || ' has been added to your wallet.',
      jsonb_build_object('order_id', NEW.id, 'credits', NEW.credits_amount)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_payment
  AFTER UPDATE OF status ON public.payment_orders
  FOR EACH ROW
  WHEN (NEW.status = 'paid' AND OLD.status != 'paid')
  EXECUTE FUNCTION public.notify_payment_completed();
