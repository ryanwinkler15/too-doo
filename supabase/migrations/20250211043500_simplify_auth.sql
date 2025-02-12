-- Disable RLS on auth.users (we don't really need it since Supabase Auth handles security)
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Grant basic permissions
GRANT USAGE ON SCHEMA auth TO postgres, authenticated, anon;
GRANT ALL ON auth.users TO postgres;
GRANT SELECT ON auth.users TO authenticated;
GRANT SELECT ON auth.users TO anon;

-- That's it! No complicated policies needed for auth.users 