-- Drop duplicate policies
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.labels;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.notes;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.user_stats;

-- The following policies remain:
-- auth.users:
--   - "Allow service_role full access" (ALL)
--   - "Allow users to read own data" (SELECT)
--   - "Allow user signup" (INSERT)

-- public.labels:
--   - "Users can view their own labels" (SELECT)
--   - "Users can insert their own labels" (INSERT)
--   - "Users can update their own labels" (UPDATE)
--   - "Users can delete their own labels" (DELETE)

-- public.notes:
--   - "Users can view their own notes" (SELECT)
--   - "Users can insert their own notes" (INSERT)
--   - "Users can update their own notes" (UPDATE)
--   - "Users can delete their own notes" (DELETE)

-- public.user_stats:
--   - "Allow service_role full access" (ALL)
--   - "Users can view their own stats" (SELECT)
--   - "Users can insert their own stats" (INSERT)
--   - "Users can update their own stats" (UPDATE) 