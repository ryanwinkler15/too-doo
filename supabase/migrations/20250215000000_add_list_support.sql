-- Add is_list column to notes table
ALTER TABLE notes 
ADD COLUMN is_list BOOLEAN DEFAULT FALSE;

-- Add comment to explain the description field usage
COMMENT ON COLUMN notes.description IS 'Stores either plain text description or serialized JSON list items when is_list is true';

-- Update RLS policies to include new column
DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
CREATE POLICY "Users can insert their own notes"
ON notes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
CREATE POLICY "Users can update their own notes"
ON notes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id); 