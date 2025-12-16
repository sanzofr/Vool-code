-- Add requested_sessions column to booking_requests
ALTER TABLE public.booking_requests 
ADD COLUMN IF NOT EXISTS requested_sessions integer DEFAULT 1;

-- Create trigger function to decrement sessions when session is completed
CREATE OR REPLACE FUNCTION public.handle_session_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When session status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Decrement sessions_remaining for the client
    UPDATE public.clients 
    SET sessions_remaining = GREATEST(0, COALESCE(sessions_remaining, 0) - 1)
    WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for session status changes
DROP TRIGGER IF EXISTS on_session_status_change ON public.sessions;
CREATE TRIGGER on_session_status_change
  AFTER UPDATE OF status ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_session_status_change();