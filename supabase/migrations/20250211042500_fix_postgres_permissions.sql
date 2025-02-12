-- Grant necessary permissions to postgres role
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT ALL ON auth.users TO postgres;

-- Create policy for postgres role
CREATE POLICY "Allow postgres full access"
ON auth.users
FOR ALL
TO postgres
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled but postgres can bypass
ALTER TABLE auth.users FORCE ROW LEVEL SECURITY;
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats FORCE ROW LEVEL SECURITY;

-- Allow postgres to bypass RLS
ALTER TABLE auth.users FORCE ROW LEVEL SECURITY;
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.users FORCE ROW LEVEL SECURITY;
ALTER TABLE auth.users ALTER COLUMN email SET DEFAULT '';

-- Grant additional permissions that might be needed
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres; 