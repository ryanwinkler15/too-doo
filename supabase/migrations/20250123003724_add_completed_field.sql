-- Add completed column to notes table
ALTER TABLE notes ADD COLUMN completed BOOLEAN DEFAULT false; 