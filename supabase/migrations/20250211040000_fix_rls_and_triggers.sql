-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow users to read own data" ON auth.users;
DROP POLICY IF EXISTS "Allow service_role full access" ON auth.users;
DROP POLICY IF EXISTS "Allow user signup" ON auth.users;

DROP POLICY IF EXISTS "Enable read access for users own labels" ON public.labels;
DROP POLICY IF EXISTS "Enable insert access for authenticated users only" ON public.labels;
DROP POLICY IF EXISTS "Enable update access for users own labels" ON public.labels;
DROP POLICY IF EXISTS "Enable delete access for users own labels" ON public.labels;

DROP POLICY IF EXISTS "Enable read access for users own notes" ON public.notes;
DROP POLICY IF EXISTS "Enable insert access for authenticated users only" ON public.notes;
DROP POLICY IF EXISTS "Enable update access for users own notes" ON public.notes;
DROP POLICY IF EXISTS "Enable delete access for users own notes" ON public.notes;

DROP POLICY IF EXISTS "Enable read access for users own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Enable insert access for authenticated users only" ON public.user_stats;
DROP POLICY IF EXISTS "Enable update access for users own stats" ON public.user_stats;

-- Enable RLS on all tables
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, authenticated, anon;
GRANT ALL ON auth.users TO postgres;
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO anon;

-- Auth users policies
CREATE POLICY "Allow service_role full access"
ON auth.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow users to read own data"
ON auth.users
FOR SELECT
TO authenticated, anon
USING ((auth.uid() = id) OR (auth.uid() IS NULL));

CREATE POLICY "Allow user signup"
ON auth.users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Labels table policies
CREATE POLICY "Enable read access for users own labels"
ON public.labels
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for authenticated users"
ON public.labels
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for users own labels"
ON public.labels
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete access for users own labels"
ON public.labels
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Notes table policies
CREATE POLICY "Enable read access for users own notes"
ON public.notes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for authenticated users"
ON public.notes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for users own notes"
ON public.notes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete access for users own notes"
ON public.notes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- User stats table policies
CREATE POLICY "Enable read access for users own stats"
ON public.user_stats
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for authenticated users"
ON public.user_stats
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for users own stats"
ON public.user_stats
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to create user_stats on first note
CREATE OR REPLACE FUNCTION ensure_user_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO user_stats (user_id, current_streak, longest_streak)
    VALUES (NEW.user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Add trigger to notes table
DROP TRIGGER IF EXISTS ensure_user_stats_exists ON notes;
CREATE TRIGGER ensure_user_stats_exists
    BEFORE INSERT ON notes
    FOR EACH ROW
    EXECUTE FUNCTION ensure_user_stats(); 