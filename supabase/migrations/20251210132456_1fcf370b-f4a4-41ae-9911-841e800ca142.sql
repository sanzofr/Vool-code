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