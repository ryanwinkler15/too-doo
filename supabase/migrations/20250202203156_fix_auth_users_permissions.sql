-- Grant usage on auth schema
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO anon;

-- Grant select on specific columns of auth.users to authenticated users
GRANT SELECT (id, email, raw_user_meta_data) ON auth.users TO authenticated;
GRANT SELECT (id, email, raw_user_meta_data) ON auth.users TO anon;

-- Ensure RLS is enabled on auth.users
ALTER TABLE auth.users FORCE ROW LEVEL SECURITY;

-- Create policy to allow users to see their own auth.users record
CREATE POLICY "Users can view own user data"
ON auth.users
FOR SELECT
TO authenticated, anon
USING (auth.uid() = id);
