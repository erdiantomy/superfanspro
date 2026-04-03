
CREATE OR REPLACE VIEW public.donation_stats AS
SELECT
  d.player_id,
  COALESCE(SUM(d.amount), 0) AS total_raised,
  COUNT(DISTINCT CASE
    WHEN d.is_anonymous = false AND d.donor_id IS NOT NULL THEN d.donor_id::text
    WHEN d.is_anonymous = false AND d.donor_name != 'Anonymous' THEN d.donor_name
  END) AS supporter_count,
  COUNT(*) AS total_donations
FROM public.donations d
WHERE d.status = 'paid'
GROUP BY d.player_id;

ALTER VIEW public.donation_stats SET (security_invoker = on);
