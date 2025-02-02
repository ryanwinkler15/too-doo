-- Remove foreign key constraints from notes and labels tables
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_user_id_fkey;
ALTER TABLE labels DROP CONSTRAINT IF EXISTS labels_user_id_fkey;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

DROP POLICY IF EXISTS "Users can view their own labels" ON labels;
DROP POLICY IF EXISTS "Users can insert their own labels" ON labels;
DROP POLICY IF EXISTS "Users can update their own labels" ON labels;
DROP POLICY IF EXISTS "Users can delete their own labels" ON labels;

-- Create updated policies for notes
CREATE POLICY "Users can view their own notes"
ON notes FOR SELECT
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own notes"
ON notes FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own notes"
ON notes FOR UPDATE
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own notes"
ON notes FOR DELETE
USING (auth.uid()::text = user_id::text);

-- Create updated policies for labels
CREATE POLICY "Users can view their own labels"
ON labels FOR SELECT
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own labels"
ON labels FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own labels"
ON labels FOR UPDATE
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own labels"
ON labels FOR DELETE
USING (auth.uid()::text = user_id::text);
