
-- Fix: Replace security definer view with a regular view using SECURITY INVOKER
DROP VIEW IF EXISTS public.leaderboard;

CREATE VIEW public.leaderboard WITH (security_invoker = on) AS
SELECT 
  p.user_id,
  p.username,
  p.avatar_url,
  p.points,
  COUNT(s.id) AS total_supports,
  ROW_NUMBER() OVER (ORDER BY p.points DESC) AS rank
FROM public.profiles p
LEFT JOIN public.supports s ON s.user_id = p.user_id
GROUP BY p.user_id, p.username, p.avatar_url, p.points
ORDER BY p.points DESC;
