
-- 1. Slugs table (unified routing)
CREATE TABLE public.slugs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  entity_type text NOT NULL CHECK (entity_type IN ('venue', 'player')),
  entity_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.slugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Slugs viewable by everyone" ON public.slugs FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage slugs" ON public.slugs FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. Player profiles table
CREATE TABLE public.player_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL UNIQUE REFERENCES public.padel_players(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL DEFAULT '',
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  social_links jsonb NOT NULL DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Player profiles viewable by everyone" ON public.player_profiles FOR SELECT TO public USING (is_public = true);
CREATE POLICY "Owner can view own profile" ON public.player_profiles FOR SELECT TO authenticated USING (player_id IN (SELECT id FROM padel_players WHERE user_id = auth.uid()));
CREATE POLICY "Owner can insert own profile" ON public.player_profiles FOR INSERT TO authenticated WITH CHECK (player_id IN (SELECT id FROM padel_players WHERE user_id = auth.uid()));
CREATE POLICY "Owner can update own profile" ON public.player_profiles FOR UPDATE TO authenticated USING (player_id IN (SELECT id FROM padel_players WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage player profiles" ON public.player_profiles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_player_profiles_updated_at
  BEFORE UPDATE ON public.player_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Donations table
CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.padel_players(id) ON DELETE CASCADE,
  donor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  donor_name text NOT NULL DEFAULT 'Anonymous',
  amount bigint NOT NULL DEFAULT 0,
  message text DEFAULT '',
  is_anonymous boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  payment_order_id uuid REFERENCES public.payment_orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donations viewable by everyone" ON public.donations FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can donate" ON public.donations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage donations" ON public.donations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. Player stats view
CREATE OR REPLACE VIEW public.player_stats AS
SELECT
  pp.id AS player_id,
  pp.name,
  pp.avatar,
  pp.matches_played AS games_played,
  pp.matches_won AS wins,
  (pp.matches_played - pp.matches_won) AS losses,
  CASE WHEN pp.matches_played > 0 THEN round((pp.matches_won::numeric / pp.matches_played) * 100, 1) ELSE 0 END AS win_rate,
  pp.lifetime_xp,
  pp.monthly_pts,
  pp.division,
  pp.streak
FROM public.padel_players pp;

-- 5. Donation stats view
CREATE OR REPLACE VIEW public.donation_stats AS
SELECT
  d.player_id,
  COALESCE(SUM(d.amount), 0) AS total_raised,
  COUNT(DISTINCT CASE WHEN d.is_anonymous = false THEN d.donor_id END) AS supporter_count,
  COUNT(*) AS total_donations
FROM public.donations d
WHERE d.status = 'paid'
GROUP BY d.player_id;

-- 6. Player profile full view (joins profile + stats + donation aggregates)
CREATE OR REPLACE VIEW public.player_profile_full AS
SELECT
  pp.id AS profile_id,
  pp.player_id,
  pp.slug,
  pp.display_name,
  pp.bio,
  pp.avatar_url,
  pp.social_links,
  pp.is_public,
  pp.created_at AS profile_created_at,
  ps.games_played,
  ps.wins,
  ps.losses,
  ps.win_rate,
  ps.lifetime_xp,
  ps.monthly_pts,
  ps.division,
  ps.streak,
  COALESCE(ds.total_raised, 0) AS total_raised,
  COALESCE(ds.supporter_count, 0) AS supporter_count,
  COALESCE(ds.total_donations, 0) AS total_donations
FROM public.player_profiles pp
LEFT JOIN public.player_stats ps ON ps.player_id = pp.player_id
LEFT JOIN public.donation_stats ds ON ds.player_id = pp.player_id;

-- 7. RPC: check slug availability
CREATE OR REPLACE FUNCTION public.check_slug_available(p_slug text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.slugs WHERE slug = p_slug);
$$;

-- 8. RPC: resolve slug to entity
CREATE OR REPLACE FUNCTION public.resolve_slug(p_slug text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object('entity_type', entity_type, 'entity_id', entity_id)
  FROM public.slugs WHERE slug = p_slug LIMIT 1;
$$;

-- 9. Seed existing venue slugs into slugs table
INSERT INTO public.slugs (slug, entity_type, entity_id)
SELECT v.slug, 'venue', v.id FROM public.venues v
ON CONFLICT (slug) DO NOTHING;

-- 10. Auto-register player profile slugs into slugs table
CREATE OR REPLACE FUNCTION public.sync_player_profile_slug()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.slugs (slug, entity_type, entity_id) VALUES (NEW.slug, 'player', NEW.player_id);
  ELSIF TG_OP = 'UPDATE' AND NEW.slug != OLD.slug THEN
    UPDATE public.slugs SET slug = NEW.slug WHERE entity_type = 'player' AND entity_id = NEW.player_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_player_profile_slug_trigger
  AFTER INSERT OR UPDATE ON public.player_profiles
  FOR EACH ROW EXECUTE FUNCTION sync_player_profile_slug();

-- 11. Auto-sync venue slugs into slugs table on insert/update
CREATE OR REPLACE FUNCTION public.sync_venue_slug()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.slugs (slug, entity_type, entity_id) VALUES (NEW.slug, 'venue', NEW.id) ON CONFLICT (slug) DO NOTHING;
  ELSIF TG_OP = 'UPDATE' AND NEW.slug != OLD.slug THEN
    UPDATE public.slugs SET slug = NEW.slug WHERE entity_type = 'venue' AND entity_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_venue_slug_trigger
  AFTER INSERT OR UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION sync_venue_slug();
