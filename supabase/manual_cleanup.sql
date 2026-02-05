-- =====================================================
-- AFRO SENTINEL - Manual Cleanup Script
-- =====================================================
-- Run this in Supabase SQL Editor to:
-- 1. Deploy the new cleanup functions
-- 2. Clear all old non-validated signals immediately
-- =====================================================

-- Step 1: Create the daily cleanup function
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

-- Step 2: Create the retention stats function
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

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.cleanup_daily_signals() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_signal_retention_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_signal_retention_stats() TO authenticated;

-- =====================================================
-- IMMEDIATE CLEANUP - Run this to clear old signals NOW
-- =====================================================

-- Check what will be deleted (PREVIEW)
SELECT 
  'PREVIEW: Signals to be deleted' as action,
  DATE(created_at) as signal_date,
  status,
  COUNT(*) as count
FROM signals
WHERE DATE(created_at) < CURRENT_DATE
AND status != 'validated'
GROUP BY DATE(created_at), status
ORDER BY signal_date DESC;

-- Execute the cleanup (UNCOMMENT to run)
-- SELECT * FROM cleanup_daily_signals();

-- Verify results after cleanup
SELECT 
  'AFTER CLEANUP: Remaining signals' as action,
  DATE(created_at) as signal_date,
  status,
  COUNT(*) as count
FROM signals
GROUP BY DATE(created_at), status
ORDER BY signal_date DESC;

-- Get retention statistics
SELECT * FROM get_signal_retention_stats();
