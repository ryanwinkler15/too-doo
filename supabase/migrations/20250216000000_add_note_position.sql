-- Add position column to notes table
ALTER TABLE notes ADD COLUMN position INTEGER;

-- Initialize position based on creation date within each label group
-- Newest notes get lowest numbers (starting at 1)
WITH ranked_notes AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY label_id 
      ORDER BY created_at DESC
    ) as new_position
  FROM notes
)
UPDATE notes
SET position = ranked_notes.new_position
FROM ranked_notes
WHERE notes.id = ranked_notes.id;

-- Add index to improve order queries
CREATE INDEX idx_notes_label_position ON notes(label_id, position);

-- Add comment explaining the field
COMMENT ON COLUMN notes.position IS 'Position of the note within its label group for ordering in label view. Lowest numbers appear at top, newest notes get lowest numbers by default.'; 