-- =====================================================
-- MIGRATION: Deduplicate Signals & Enforce Uniqueness
-- =====================================================

-- 1. Remove duplicate signals, keeping the OLDEST record (by id/created_at)
-- We use a CTE to identify duplicates based on identical 'original_text'
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY original_text 
           ORDER BY created_at ASC, id ASC
         ) as row_num
  FROM public.signals
)
DELETE FROM public.signals
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- 2. Add unique constraint to prevent future duplicates
-- This ensures 'original_text' is unique across the entire table
ALTER TABLE public.signals 
ADD CONSTRAINT signals_unique_content UNIQUE (original_text);

-- 3. Log the operation
DO $$
BEGIN
  RAISE NOTICE 'Deduplication complete. Unique constraint added to signals.original_text';
END $$;
