-- Add position column to labels table
ALTER TABLE labels ADD COLUMN position INTEGER;

-- Initialize position based on name alphabetically
WITH ranked_labels AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY name ASC
    ) as new_position
  FROM labels
)
UPDATE labels
SET position = ranked_labels.new_position
FROM ranked_labels
WHERE labels.id = ranked_labels.id;

-- Add index to improve order queries
CREATE INDEX idx_labels_position ON labels(position);

-- Add comment explaining the field
COMMENT ON COLUMN labels.position IS 'Position of the label for ordering in the label view. Lowest numbers appear at left.'; 