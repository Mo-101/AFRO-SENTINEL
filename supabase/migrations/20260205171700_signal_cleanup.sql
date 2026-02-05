-- =====================================================
-- AFRO SENTINEL WATCHTOWER - Daily Signal Retention
-- =====================================================
-- STRICT POLICY: Only TODAY's signals + ALL validated signals persist
-- All non-validated signals from previous days are purged daily at midnight

-- Function to cleanup non-validated signals from previous days
CREATE OR REPLACE FUNCTION public.cleanup_daily_signals()
RETURNS TABLE(deleted_count BIGINT, validated_preserved BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count BIGINT;
  v_validated_count BIGINT;
BEGIN
  -- Count validated signals before cleanup (for reporting)
  SELECT COUNT(*) INTO v_validated_count
  FROM public.signals
  WHERE status = 'validated';
  
  -- Delete all signals from previous days EXCEPT validated ones
  DELETE FROM public.signals
  WHERE DATE(created_at) < CURRENT_DATE
  AND status != 'validated';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  -- Log the cleanup
  RAISE NOTICE 'Daily cleanup complete. Deleted % non-validated signals. Preserved % validated signals.',
    v_deleted_count, v_validated_count;
  
  -- Return stats for monitoring
  RETURN QUERY SELECT v_deleted_count, v_validated_count;
END;
$$;

-- Function to get signal retention stats (for monitoring dashboard)
CREATE OR REPLACE FUNCTION public.get_signal_retention_stats()
RETURNS TABLE(
  today_total BIGINT,
  today_new BIGINT,
  today_validated BIGINT,
  archive_validated BIGINT,
  total_signals BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_total,
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND status = 'new') as today_new,
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND status = 'validated') as today_validated,
    COUNT(*) FILTER (WHERE DATE(created_at) < CURRENT_DATE AND status = 'validated') as archive_validated,
    COUNT(*) as total_signals
  FROM public.signals;
END;
$$;

-- Grant execution to service role (used by edge functions)
GRANT EXECUTE ON FUNCTION public.cleanup_daily_signals() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_signal_retention_stats() TO service_role;

-- Grant to authenticated users for dashboard monitoring
GRANT EXECUTE ON FUNCTION public.get_signal_retention_stats() TO authenticated;

-- Optional: Create a pg_cron job to run cleanup at midnight UTC
-- Uncomment if pg_cron extension is enabled
-- SELECT cron.schedule(
--   'daily-signal-cleanup',
--   '0 0 * * *',  -- Every day at midnight UTC
--   $$SELECT public.cleanup_daily_signals()$$
-- );
