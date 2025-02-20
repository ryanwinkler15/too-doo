-- Drop the position column and its index if they exist
DROP INDEX IF EXISTS idx_notes_label_position;
ALTER TABLE notes DROP COLUMN IF EXISTS position; 