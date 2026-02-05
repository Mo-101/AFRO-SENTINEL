-- Bypass 1000-row limit with server-side aggregation
CREATE OR REPLACE FUNCTION get_signal_priority_counts()
RETURNS TABLE(priority text, count bigint) 
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT priority::text, COUNT(*) FROM signals GROUP BY priority
$$;

CREATE OR REPLACE FUNCTION get_signal_status_counts()
RETURNS TABLE(status text, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status::text, COUNT(*) FROM signals GROUP BY status
$$;

-- Get total signal count
CREATE OR REPLACE FUNCTION get_signal_total_count()
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) FROM signals
$$;

-- Get 24h trend comparison
CREATE OR REPLACE FUNCTION get_signal_24h_trend()
RETURNS TABLE(current_count bigint, previous_count bigint, trend_percent numeric)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH current_period AS (
    SELECT COUNT(*) as cnt FROM signals 
    WHERE created_at >= NOW() - INTERVAL '24 hours'
  ),
  previous_period AS (
    SELECT COUNT(*) as cnt FROM signals 
    WHERE created_at >= NOW() - INTERVAL '48 hours' 
    AND created_at < NOW() - INTERVAL '24 hours'
  )
  SELECT 
    current_period.cnt as current_count,
    previous_period.cnt as previous_count,
    CASE 
      WHEN previous_period.cnt > 0 
      THEN ROUND(((current_period.cnt - previous_period.cnt)::numeric / previous_period.cnt) * 100, 1)
      ELSE 0 
    END as trend_percent
  FROM current_period, previous_period
$$;

-- Fix RLS for real-time feed visibility - allow authenticated users to see all signals
DROP POLICY IF EXISTS "Viewers can see validated signals" ON signals;

CREATE POLICY "Authenticated users can view all signals"
  ON signals FOR SELECT 
  USING (auth.uid() IS NOT NULL);