
-- Function to notify admin via edge function
CREATE OR REPLACE FUNCTION public.notify_admin_on_score_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log directly into admin_notifications table
  INSERT INTO public.admin_notifications (type, subject, body, metadata, recipient)
  VALUES (
    'score_submitted',
    'New Score Submitted: Round ' || NEW.round || ' Court ' || NEW.court,
    'A player submitted scores for session round ' || NEW.round || ', court ' || NEW.court || '. Score: ' || NEW.score_a || ' - ' || NEW.score_b,
    jsonb_build_object(
      'Session ID', NEW.session_id::text,
      'Round', NEW.round::text,
      'Court', NEW.court::text,
      'Score', NEW.score_a || ' - ' || NEW.score_b,
      'Status', NEW.status
    ),
    'superfans.games@gmail.com'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admin_score_insert
  AFTER INSERT ON public.score_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_score_insert();

-- Function to notify admin on payment completion
CREATE OR REPLACE FUNCTION public.notify_admin_on_payment_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  player_name text;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    SELECT name INTO player_name FROM public.padel_players WHERE id = NEW.player_id;
    INSERT INTO public.admin_notifications (type, subject, body, metadata, recipient)
    VALUES (
      'payment_completed',
      'Payment Completed: Cr ' || NEW.credits_amount,
      COALESCE(player_name, 'A player') || ' completed a payment of Rp ' || to_char(NEW.price_idr, 'FM999,999,999') || ' for ' || NEW.credits_amount || ' credits.',
      jsonb_build_object(
        'Player', COALESCE(player_name, 'Unknown'),
        'Credits', NEW.credits_amount::text,
        'Amount (IDR)', 'Rp ' || to_char(NEW.price_idr, 'FM999,999,999'),
        'Payment Channel', COALESCE(NEW.payment_channel, 'N/A'),
        'Order ID', NEW.id::text
      ),
      'superfans.games@gmail.com'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admin_payment_paid
  AFTER INSERT OR UPDATE ON public.payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_payment_paid();
