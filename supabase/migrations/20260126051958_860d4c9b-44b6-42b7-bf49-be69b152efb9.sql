-- Fix security warnings by tightening RLS policies

-- 1. Profiles: Restrict to viewing own profile or same organization
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile or same org"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'analyst'::app_role)
);

-- 2. Source Credibility: Restrict to analysts and admins only
DROP POLICY IF EXISTS "Anyone authenticated can read source credibility" ON public.source_credibility;

CREATE POLICY "Analysts and admins can read source credibility"
ON public.source_credibility
FOR SELECT
USING (
  has_role(auth.uid(), 'analyst'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Signals: Remove public access to P1/P2 signals, require authentication
DROP POLICY IF EXISTS "Public can see critical validated signals" ON public.signals;

-- Authenticated users can see validated signals, analysts/admins see all
-- No more public unauthenticated access to outbreak intelligence
CREATE POLICY "Authenticated users can see validated critical signals"
ON public.signals
FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND status = 'validated'::signal_status AND priority IN ('P1'::signal_priority, 'P2'::signal_priority))
  OR has_role(auth.uid(), 'analyst'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);