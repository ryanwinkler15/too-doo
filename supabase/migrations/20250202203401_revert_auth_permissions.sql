-- Revert auth schema permissions
REVOKE ALL ON SCHEMA auth FROM authenticated;
REVOKE ALL ON SCHEMA auth FROM anon;

-- Revert auth.users permissions
REVOKE ALL ON auth.users FROM authenticated;
REVOKE ALL ON auth.users FROM anon;

-- Drop the policy we created
DROP POLICY IF EXISTS "Users can view own user data" ON auth.users;

-- Disable RLS on auth.users (return to default)
ALTER TABLE IF EXISTS auth.users DISABLE ROW LEVEL SECURITY;
