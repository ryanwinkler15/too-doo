-- Grant basic permissions needed for auth
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;

-- Grant necessary permissions for user management
GRANT SELECT, INSERT ON auth.users TO authenticated;
GRANT SELECT, INSERT ON auth.users TO anon;

-- Ensure RLS is enabled
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public user creation" ON auth.users;

-- Create basic policy for user creation
CREATE POLICY "Allow public user creation"
ON auth.users
FOR INSERT
TO anon, authenticated
WITH CHECK (true); 