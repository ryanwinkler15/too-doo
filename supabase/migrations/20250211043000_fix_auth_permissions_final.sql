-- Temporarily disable RLS
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on auth.users
DROP POLICY IF EXISTS "Allow service_role full access" ON auth.users;
DROP POLICY IF EXISTS "Allow postgres full access" ON auth.users;
DROP POLICY IF EXISTS "Allow users to read own data" ON auth.users;
DROP POLICY IF EXISTS "Allow user signup" ON auth.users;

-- Grant full permissions to necessary roles
GRANT USAGE ON SCHEMA auth TO postgres, authenticated, anon, service_role;
GRANT ALL ON auth.users TO postgres;
GRANT ALL ON auth.users TO service_role;
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO anon;

-- Allow authenticated and anon roles to use the auth API
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;

-- Re-enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create policies with proper order
CREATE POLICY "Allow service_role full access"
ON auth.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow postgres full access"
ON auth.users
FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow user signup"
ON auth.users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow users to read own data"
ON auth.users
FOR SELECT
TO authenticated, anon
USING (auth.uid() = id);

-- Set proper ownership
ALTER TABLE auth.users OWNER TO supabase_admin;

-- Ensure postgres can bypass RLS
ALTER TABLE auth.users FORCE ROW LEVEL SECURITY;
ALTER ROLE postgres BYPASSRLS;

-- Grant execute on auth functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO postgres, authenticated, anon, service_role;

-- Additional permissions that might be needed
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, service_role; 