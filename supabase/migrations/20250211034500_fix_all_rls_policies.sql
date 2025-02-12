-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow users to read own data" ON auth.users;
DROP POLICY IF EXISTS "Allow service_role full access" ON auth.users;
DROP POLICY IF EXISTS "Allow user signup" ON auth.users;

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