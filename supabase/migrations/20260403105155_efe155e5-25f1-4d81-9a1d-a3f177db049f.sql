
-- Fix security definer views by recreating with security_invoker
ALTER VIEW public.player_stats SET (security_invoker = on);
ALTER VIEW public.donation_stats SET (security_invoker = on);
ALTER VIEW public.player_profile_full SET (security_invoker = on);

-- Tighten donation insert policy
DROP POLICY "Authenticated users can donate" ON public.donations;
CREATE POLICY "Authenticated users can donate" ON public.donations FOR INSERT TO authenticated WITH CHECK (donor_id = auth.uid());
