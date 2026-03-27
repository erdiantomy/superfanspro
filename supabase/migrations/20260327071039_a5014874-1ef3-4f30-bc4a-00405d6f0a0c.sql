
-- Create verify function with explicit schema for crypt
CREATE OR REPLACE FUNCTION public.verify_venue_password(venue_slug text, plain_password text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.venues
    WHERE slug = venue_slug
      AND admin_password_hash = crypt(plain_password, admin_password_hash)
  );
END;
$$;
