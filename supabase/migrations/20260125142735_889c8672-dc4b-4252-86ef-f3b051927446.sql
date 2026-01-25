-- =====================================================
-- AFRO SENTINEL WATCHTOWER - Phase 1 Database Schema
-- =====================================================

-- 1. Create ENUMs for type safety
CREATE TYPE public.app_role AS ENUM ('admin', 'analyst', 'viewer');
CREATE TYPE public.signal_priority AS ENUM ('P1', 'P2', 'P3', 'P4');
CREATE TYPE public.signal_status AS ENUM ('new', 'triaged', 'validated', 'dismissed');
CREATE TYPE public.source_tier AS ENUM ('tier_1', 'tier_2', 'tier_3');
CREATE TYPE public.disease_category AS ENUM ('vhf', 'respiratory', 'enteric', 'vector_borne', 'zoonotic', 'vaccine_preventable', 'environmental', 'unknown');

-- 2. Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  organization TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create user_roles table (SEPARATE from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

-- 4. Create disease_lexicon table for keyword matching
CREATE TABLE public.disease_lexicon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_name TEXT NOT NULL UNIQUE,
  category disease_category NOT NULL DEFAULT 'unknown',
  keywords_en TEXT[] DEFAULT '{}',
  keywords_fr TEXT[] DEFAULT '{}',
  keywords_ar TEXT[] DEFAULT '{}',
  keywords_sw TEXT[] DEFAULT '{}', -- Swahili
  keywords_ha TEXT[] DEFAULT '{}', -- Hausa
  keywords_yo TEXT[] DEFAULT '{}', -- Yoruba
  keywords_am TEXT[] DEFAULT '{}', -- Amharic
  keywords_pt TEXT[] DEFAULT '{}', -- Portuguese
  symptoms_cluster TEXT[] DEFAULT '{}',
  endemic_regions TEXT[] DEFAULT '{}',
  seasonal_peak_months INTEGER[] DEFAULT '{}',
  case_fatality_rate DECIMAL(5,2),
  incubation_days_min INTEGER,
  incubation_days_max INTEGER,
  transmission_routes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create source_credibility table for tracking source reliability
CREATE TABLE public.source_credibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL UNIQUE,
  source_url TEXT,
  source_type TEXT NOT NULL, -- official, media, social, community
  tier source_tier NOT NULL DEFAULT 'tier_3',
  credibility_score INTEGER NOT NULL DEFAULT 50 CHECK (credibility_score >= 0 AND credibility_score <= 100),
  total_signals INTEGER NOT NULL DEFAULT 0,
  validated_signals INTEGER NOT NULL DEFAULT 0,
  false_positive_count INTEGER NOT NULL DEFAULT 0,
  last_signal_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create signals table (core intelligence data)
CREATE TABLE public.signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Signal classification
  signal_type TEXT NOT NULL DEFAULT 'disease', -- disease, hazard, rumor
  disease_name TEXT,
  disease_category disease_category,
  
  -- Location data
  location_country TEXT NOT NULL,
  location_country_iso TEXT,
  location_admin1 TEXT, -- Region/State
  location_admin2 TEXT, -- District/County
  location_locality TEXT,
  location_lat DECIMAL(10,7),
  location_lng DECIMAL(10,7),
  
  -- Original content (NEVER modified - Lingua Fidelity)
  original_text TEXT NOT NULL,
  original_language TEXT,
  original_script TEXT, -- latin, arabic, ge_ez, nko
  
  -- Translated content
  translated_text TEXT,
  translation_confidence INTEGER CHECK (translation_confidence >= 0 AND translation_confidence <= 100),
  lingua_fidelity_score INTEGER CHECK (lingua_fidelity_score >= 0 AND lingua_fidelity_score <= 100),
  
  -- Source information
  source_id UUID REFERENCES public.source_credibility(id),
  source_tier source_tier NOT NULL DEFAULT 'tier_3',
  source_name TEXT NOT NULL,
  source_url TEXT,
  source_type TEXT, -- official, media, social, community, radio
  source_timestamp TIMESTAMPTZ, -- When the source published
  
  -- Triage data
  priority signal_priority NOT NULL DEFAULT 'P4',
  confidence_score INTEGER NOT NULL DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  status signal_status NOT NULL DEFAULT 'new',
  
  -- Affected population
  reported_cases INTEGER,
  reported_deaths INTEGER,
  affected_population TEXT,
  
  -- Validation
  corroborating_signals UUID[] DEFAULT '{}',
  cross_border_risk BOOLEAN DEFAULT false,
  seasonal_pattern_match BOOLEAN DEFAULT false,
  
  -- Analyst notes
  analyst_notes TEXT,
  triaged_by UUID REFERENCES auth.users(id),
  triaged_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMPTZ,
  
  -- Metadata
  ingestion_source TEXT, -- promed, who, news_api, manual
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create indexes for performance
CREATE INDEX idx_signals_country ON public.signals(location_country);
CREATE INDEX idx_signals_priority ON public.signals(priority);
CREATE INDEX idx_signals_status ON public.signals(status);
CREATE INDEX idx_signals_disease ON public.signals(disease_name);
CREATE INDEX idx_signals_created ON public.signals(created_at DESC);
CREATE INDEX idx_signals_location ON public.signals(location_lat, location_lng) WHERE location_lat IS NOT NULL;
CREATE INDEX idx_disease_lexicon_name ON public.disease_lexicon(disease_name);
CREATE INDEX idx_source_credibility_tier ON public.source_credibility(tier);

-- 8. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_lexicon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_credibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- 9. Create security definer function for role checking (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- 10. Create function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'analyst' THEN 2 
      WHEN 'viewer' THEN 3 
    END
  LIMIT 1
$$;

-- 11. Profiles RLS policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 12. User roles RLS policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 13. Disease lexicon RLS policies (read-only for most users)
CREATE POLICY "Anyone authenticated can read disease lexicon"
  ON public.disease_lexicon FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify disease lexicon"
  ON public.disease_lexicon FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 14. Source credibility RLS policies
CREATE POLICY "Anyone authenticated can read source credibility"
  ON public.source_credibility FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Analysts and admins can modify sources"
  ON public.source_credibility FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));

-- 15. Signals RLS policies (tiered access)
-- Viewers: only validated signals
CREATE POLICY "Viewers can see validated signals"
  ON public.signals FOR SELECT
  TO authenticated
  USING (
    status = 'validated' 
    OR public.has_role(auth.uid(), 'analyst') 
    OR public.has_role(auth.uid(), 'admin')
  );

-- Public (anonymous): only validated P1/P2 signals
CREATE POLICY "Public can see critical validated signals"
  ON public.signals FOR SELECT
  TO anon
  USING (status = 'validated' AND priority IN ('P1', 'P2'));

-- Analysts can create and update signals
CREATE POLICY "Analysts can create signals"
  ON public.signals FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'analyst') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Analysts can update signals"
  ON public.signals FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'analyst') OR public.has_role(auth.uid(), 'admin'));

-- Only admins can delete signals
CREATE POLICY "Only admins can delete signals"
  ON public.signals FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 16. Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 17. Apply update triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_signals_updated_at
  BEFORE UPDATE ON public.signals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_disease_lexicon_updated_at
  BEFORE UPDATE ON public.disease_lexicon
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_source_credibility_updated_at
  BEFORE UPDATE ON public.source_credibility
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 18. Create profile automatically on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Assign default 'viewer' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();