-- Create coach_client_relationships table (many-to-many)
CREATE TABLE public.coach_client_relationships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid NOT NULL,
  client_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(coach_id, client_id)
);

-- Enable RLS
ALTER TABLE public.coach_client_relationships ENABLE ROW LEVEL SECURITY;

-- RLS policies for coach_client_relationships
CREATE POLICY "Coaches can view their client relationships"
ON public.coach_client_relationships
FOR SELECT
USING (auth.uid() = coach_id);

CREATE POLICY "Clients can view their coach relationships"
ON public.coach_client_relationships
FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Coaches can create relationships"
ON public.coach_client_relationships
FOR INSERT
WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete relationships"
ON public.coach_client_relationships
FOR DELETE
USING (auth.uid() = coach_id);

-- Create feed_messages table for coach broadcasts
CREATE TABLE public.feed_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feed_messages ENABLE ROW LEVEL SECURITY;

-- Coaches can insert their own messages
CREATE POLICY "Coaches can insert their own messages"
ON public.feed_messages
FOR INSERT
WITH CHECK (auth.uid() = coach_id);

-- Coaches can view their own messages
CREATE POLICY "Coaches can view their own messages"
ON public.feed_messages
FOR SELECT
USING (auth.uid() = coach_id);

-- Coaches can delete their own messages
CREATE POLICY "Coaches can delete their own messages"
ON public.feed_messages
FOR DELETE
USING (auth.uid() = coach_id);

-- Clients can view messages from their coaches
CREATE POLICY "Clients can view their coaches messages"
ON public.feed_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coach_client_relationships
    WHERE coach_client_relationships.coach_id = feed_messages.coach_id
    AND coach_client_relationships.client_id = auth.uid()
  )
);

-- Add user_client_id to sessions table to link to registered users
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS user_client_id uuid;

-- Add RLS policy for clients to view their sessions
CREATE POLICY "Clients can view their own sessions"
ON public.sessions
FOR SELECT
USING (auth.uid() = user_client_id);