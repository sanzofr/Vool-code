-- Add WhatsApp and Telegram to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS telegram text;

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- System can insert notifications for any user (using service role or triggers)
CREATE POLICY "Allow insert for authenticated users"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Add uploaded_by field to client_media to distinguish coach vs client uploads
ALTER TABLE public.client_media
ADD COLUMN IF NOT EXISTS uploaded_by text DEFAULT 'coach';

-- Allow clients to insert their own media
CREATE POLICY "Clients can insert their own media"
ON public.client_media
FOR INSERT
WITH CHECK (
  auth.uid()::text = client_id::text OR 
  EXISTS (
    SELECT 1 FROM coach_client_relationships
    WHERE coach_client_relationships.client_id = auth.uid()
    AND coach_client_relationships.coach_id = client_media.coach_id
  )
);

-- Allow clients to view their own media
CREATE POLICY "Clients can view their own media"
ON public.client_media
FOR SELECT
USING (
  auth.uid()::text = client_id::text OR
  EXISTS (
    SELECT 1 FROM coach_client_relationships
    WHERE coach_client_relationships.client_id = auth.uid()
    AND coach_client_relationships.coach_id = client_media.coach_id
  )
);