-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.notes;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON public.notes;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.notes;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.notes;

-- Super simple policy for notes: if you're logged in, you can only see/edit your own stuff
CREATE POLICY "Enable all for users based on user_id" ON public.notes
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Drop existing policies for labels
DROP POLICY IF EXISTS "Users can create their own labels" ON public.labels;
DROP POLICY IF EXISTS "Users can view their own labels" ON public.labels;
DROP POLICY IF EXISTS "Users can update their own labels" ON public.labels;
DROP POLICY IF EXISTS "Users can delete their own labels" ON public.labels;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.labels;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON public.labels;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.labels;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.labels;

-- Super simple policy for labels
CREATE POLICY "Enable all for users based on user_id" ON public.labels
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Make sure RLS is enabled
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;

-- Give authenticated users full access (RLS will still restrict them to their own data)
GRANT ALL ON public.notes TO authenticated;
GRANT ALL ON public.labels TO authenticated; 