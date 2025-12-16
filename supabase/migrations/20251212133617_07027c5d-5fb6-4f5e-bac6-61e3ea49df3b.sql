-- Allow anyone authenticated to view coach roles (so clients can find coaches)
CREATE POLICY "Anyone can view coach roles"
ON public.user_roles
FOR SELECT
USING (role = 'coach');

-- Update profiles policy to allow clients to view coach profiles
-- First drop the existing policy
DROP POLICY IF EXISTS "Anyone can view coach profiles" ON public.profiles;

-- Create a more permissive policy for viewing coach profiles
CREATE POLICY "Anyone can view coach profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = profiles.id 
    AND user_roles.role = 'coach'
  )
  OR auth.uid() = id
);