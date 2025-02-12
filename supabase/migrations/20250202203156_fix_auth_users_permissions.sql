-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view own user data" ON auth.users;
DROP POLICY IF EXISTS "Allow user creation" ON auth.users;
DROP POLICY IF EXISTS "Users can update own data" ON auth.users;

-- Grant basic schema usage
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;

-- Grant necessary permissions for user management
GRANT SELECT, INSERT ON auth.users TO authenticated;
GRANT SELECT, INSERT ON auth.users TO anon;

-- Ensure RLS is enabled on auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create simplified policies
CREATE POLICY "Allow public user creation"
ON auth.users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow users to view own data"
ON auth.users
FOR SELECT
TO authenticated, anon
USING (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "Allow users to update own data"
ON auth.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
