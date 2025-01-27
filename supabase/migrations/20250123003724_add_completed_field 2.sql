-- Add completed field to notes table
ALTER TABLE notes ADD COLUMN completed BOOLEAN NOT NULL DEFAULT false; 