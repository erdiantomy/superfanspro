
-- Create venues table
CREATE TABLE public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  logo_url text,
  city text,
  country text DEFAULT 'Indonesia',
  courts_default integer DEFAULT 2,
  monthly_prize bigint DEFAULT 2000000,
  prize_split_1st integer DEFAULT 50,
  prize_split_2nd integer DEFAULT 30,
  prize_split_3rd integer DEFAULT 20,
  primary_color text DEFAULT '#00E676',
  admin_password_hash text,
  contact_name text,
  contact_email text,
  contact_phone text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Everyone can read active venues
CREATE POLICY "Active venues are viewable by everyone"
  ON public.venues FOR SELECT
  USING (status = 'active');

-- Admins can manage venues
CREATE POLICY "Admins can manage venues"
  ON public.venues FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create venue_registrations table
CREATE TABLE public.venue_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  city text NOT NULL,
  country text NOT NULL DEFAULT 'Indonesia',
  venue_name text NOT NULL,
  slug text NOT NULL,
  courts integer NOT NULL DEFAULT 2,
  primary_color text DEFAULT '#00E676',
  monthly_prize bigint DEFAULT 2000000,
  prize_split_1st integer DEFAULT 50,
  prize_split_2nd integer DEFAULT 30,
  prize_split_3rd integer DEFAULT 20,
  admin_password_hash text,
  logo_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.venue_registrations ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a registration (public form)
CREATE POLICY "Anyone can submit a registration"
  ON public.venue_registrations FOR INSERT
  WITH CHECK (true);

-- Only admins can view registrations
CREATE POLICY "Admins can view registrations"
  ON public.venue_registrations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed Tom's Padel as active venue
INSERT INTO public.venues (slug, name, city, country, courts_default, monthly_prize, prize_split_1st, prize_split_2nd, prize_split_3rd, primary_color, status)
VALUES ('tomspadel', 'Tom''s Padel', 'Jakarta', 'Indonesia', 2, 2000000, 50, 30, 20, '#00E676', 'active');
