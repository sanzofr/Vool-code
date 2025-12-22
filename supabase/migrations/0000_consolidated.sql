-- Create profiles table for coach information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT,
  sport TEXT NOT NULL,
  level TEXT NOT NULL,
  health_info TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'overdue')),
  sessions_remaining INTEGER DEFAULT 0,
  next_session_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Coaches can view their own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can insert their own clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own clients"
  ON public.clients FOR DELETE
  USING (auth.uid() = coach_id);

-- Create client_tags table
CREATE TABLE public.client_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on client_tags
ALTER TABLE public.client_tags ENABLE ROW LEVEL SECURITY;

-- Client tags policies
CREATE POLICY "Coaches can view tags for their clients"
  ON public.client_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = client_tags.client_id 
    AND clients.coach_id = auth.uid()
  ));

CREATE POLICY "Coaches can insert tags for their clients"
  ON public.client_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = client_tags.client_id 
    AND clients.coach_id = auth.uid()
  ));

CREATE POLICY "Coaches can delete tags for their clients"
  ON public.client_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = client_tags.client_id 
    AND clients.coach_id = auth.uid()
  ));

-- Create sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  location TEXT,
  session_type TEXT NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Coaches can view their own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can insert their own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own sessions"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own sessions"
  ON public.sessions FOR DELETE
  USING (auth.uid() = coach_id);

-- Create session_notes table
CREATE TABLE public.session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'technique', 'progress', 'homework')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on session_notes
ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;

-- Session notes policies
CREATE POLICY "Coaches can view their own session notes"
  ON public.session_notes FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can insert their own session notes"
  ON public.session_notes FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own session notes"
  ON public.session_notes FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own session notes"
  ON public.session_notes FOR DELETE
  USING (auth.uid() = coach_id);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "Coaches can view their own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can insert their own invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own invoices"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own invoices"
  ON public.invoices FOR DELETE
  USING (auth.uid() = coach_id);

-- Create trigger function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_session_notes_updated_at
  BEFORE UPDATE ON public.session_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, phone_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
-- Fix profiles table: Drop restrictive policy and create permissive one
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Fix clients table: Drop restrictive policy and create permissive one
DROP POLICY IF EXISTS "Coaches can view their own clients" ON public.clients;
CREATE POLICY "Coaches can view their own clients" 
ON public.clients 
FOR SELECT 
TO authenticated
USING (auth.uid() = coach_id);

-- Also fix other tables that may have the same issue
DROP POLICY IF EXISTS "Coaches can view their own sessions" ON public.sessions;
CREATE POLICY "Coaches can view their own sessions" 
ON public.sessions 
FOR SELECT 
TO authenticated
USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can view their own session notes" ON public.session_notes;
CREATE POLICY "Coaches can view their own session notes" 
ON public.session_notes 
FOR SELECT 
TO authenticated
USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can view their own invoices" ON public.invoices;
CREATE POLICY "Coaches can view their own invoices" 
ON public.invoices 
FOR SELECT 
TO authenticated
USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can view tags for their clients" ON public.client_tags;
CREATE POLICY "Coaches can view tags for their clients" 
ON public.client_tags 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM clients 
  WHERE clients.id = client_tags.client_id 
  AND clients.coach_id = auth.uid()
));

DROP POLICY IF EXISTS "Coaches can view their own videos" ON public.videos;
CREATE POLICY "Coaches can view their own videos" 
ON public.videos 
FOR SELECT 
TO authenticated
USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can view their own annotations" ON public.video_annotations;
CREATE POLICY "Coaches can view their own annotations" 
ON public.video_annotations 
FOR SELECT 
TO authenticated
USING (auth.uid() = coach_id);
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'coach', 'client');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow new users to insert their own role during signup
CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Migrate existing users to coach role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'coach'::app_role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles);
-- Add coach-specific fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS sport_specialty text,
ADD COLUMN IF NOT EXISTS experience_years integer,
ADD COLUMN IF NOT EXISTS certifications text[],
ADD COLUMN IF NOT EXISTS hourly_rate numeric,
ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;

-- Create coach_packages table for package pricing
CREATE TABLE public.coach_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  session_count integer NOT NULL,
  price numeric NOT NULL,
  discount_percentage numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coach_packages ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their own packages
CREATE POLICY "Coaches can insert their own packages"
ON public.coach_packages
FOR INSERT
WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own packages"
ON public.coach_packages
FOR UPDATE
USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own packages"
ON public.coach_packages
FOR DELETE
USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can view their own packages"
ON public.coach_packages
FOR SELECT
USING (auth.uid() = coach_id);

-- Anyone can view active packages for booking purposes
CREATE POLICY "Anyone can view active packages"
ON public.coach_packages
FOR SELECT
USING (is_active = true);

-- Create booking_requests table
CREATE TABLE public.booking_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  package_id uuid REFERENCES public.coach_packages(id),
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Clients can create booking requests
CREATE POLICY "Clients can create booking requests"
ON public.booking_requests
FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Clients can view their own requests
CREATE POLICY "Clients can view their own requests"
ON public.booking_requests
FOR SELECT
USING (auth.uid() = client_id);

-- Coaches can view requests sent to them
CREATE POLICY "Coaches can view their booking requests"
ON public.booking_requests
FOR SELECT
USING (auth.uid() = coach_id);

-- Coaches can update requests (accept/reject)
CREATE POLICY "Coaches can update their booking requests"
ON public.booking_requests
FOR UPDATE
USING (auth.uid() = coach_id);

-- Update profiles RLS to allow clients to view coach profiles
CREATE POLICY "Anyone can view coach profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = profiles.id
    AND user_roles.role = 'coach'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_coach_packages_updated_at
BEFORE UPDATE ON public.coach_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booking_requests_updated_at
BEFORE UPDATE ON public.booking_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
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