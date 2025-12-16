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

DROP POLICY IF EXISTS "Coaches can view their own payments" ON public.payments;
CREATE POLICY "Coaches can view their own payments" 
ON public.payments 
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

DROP POLICY IF EXISTS "Coaches can view media for their clients" ON public.client_media;
CREATE POLICY "Coaches can view media for their clients" 
ON public.client_media 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM clients 
  WHERE clients.id = client_media.client_id 
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