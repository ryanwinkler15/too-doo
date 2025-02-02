-- Revert all auth schema changes
REVOKE ALL ON ALL TABLES IN SCHEMA auth FROM authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA auth FROM anon;
REVOKE USAGE ON SCHEMA auth FROM authenticated;
REVOKE USAGE ON SCHEMA auth FROM anon;

-- Drop any policies we created on auth tables
DROP POLICY IF EXISTS "Users can view own user data" ON auth.users;

-- Disable RLS on auth.users (return to default)
ALTER TABLE IF EXISTS auth.users DISABLE ROW LEVEL SECURITY;

-- Reset auth.users permissions to default
GRANT ALL ON auth.users TO service_role;  -- This is the default
