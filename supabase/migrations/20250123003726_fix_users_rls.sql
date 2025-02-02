-- Drop ALL existing policies
DROP POLICY IF EXISTS "Enable read access for users own notes" ON "public"."notes";
DROP POLICY IF EXISTS "Enable insert access for authenticated users only" ON "public"."notes";
DROP POLICY IF EXISTS "Enable update access for users own notes" ON "public"."notes";
DROP POLICY IF EXISTS "Enable delete access for users own notes" ON "public"."notes";
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON "public"."notes";

DROP POLICY IF EXISTS "Enable read access for users own labels" ON "public"."labels";
DROP POLICY IF EXISTS "Enable insert access for authenticated users only" ON "public"."labels";
DROP POLICY IF EXISTS "Enable update access for users own labels" ON "public"."labels";
DROP POLICY IF EXISTS "Enable delete access for users own labels" ON "public"."labels";
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON "public"."labels";

-- Create new policies for notes
CREATE POLICY "Enable read access for users own notes" ON "public"."notes"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Enable insert access for authenticated users only" ON "public"."notes"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  CASE 
    WHEN auth.uid() IS NULL THEN false
    WHEN user_id::text != auth.uid()::text THEN false
    ELSE true
  END
);

CREATE POLICY "Enable update access for users own notes" ON "public"."notes"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Enable delete access for users own notes" ON "public"."notes"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id::text);

-- Create new policies for labels
CREATE POLICY "Enable read access for users own labels" ON "public"."labels"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Enable insert access for authenticated users only" ON "public"."labels"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Enable update access for users own labels" ON "public"."labels"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Enable delete access for users own labels" ON "public"."labels"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id::text);

-- Ensure RLS is enabled
ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."labels" ENABLE ROW LEVEL SECURITY; 