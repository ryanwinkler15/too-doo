-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_note_completed ON notes;

-- Drop the existing function
DROP FUNCTION IF EXISTS handle_note_completion();

-- Create updated function to handle note completion and update streaks
CREATE OR REPLACE FUNCTION handle_note_completion()
RETURNS TRIGGER AS $$
DECLARE
    user_last_completion TIMESTAMPTZ;
    current_user_streak INTEGER;
    current_longest_streak INTEGER;
BEGIN
    -- Only proceed if is_completed changed from false to true
    IF (TG_OP = 'UPDATE' AND OLD.is_completed = false AND NEW.is_completed = true) THEN
        -- Get the last completion date and current streak for this user
        SELECT last_completion_date, current_streak, longest_streak
        INTO user_last_completion, current_user_streak, current_longest_streak
        FROM user_stats
        WHERE user_id = NEW.user_id;

        IF user_last_completion IS NULL THEN
            -- First completion ever
            UPDATE user_stats
            SET current_streak = 1,
                longest_streak = 1,
                last_completion_date = NEW.completed_at
            WHERE user_id = NEW.user_id;
        ELSE
            -- Update streaks based on completion pattern
            IF date_trunc('day', user_last_completion) = date_trunc('day', NEW.completed_at) THEN
                -- Another completion today
                -- Keep current streak, but ensure it's at least 1
                UPDATE user_stats
                SET last_completion_date = NEW.completed_at,
                    current_streak = GREATEST(1, current_user_streak),
                    longest_streak = GREATEST(current_longest_streak, GREATEST(1, current_user_streak))
                WHERE user_id = NEW.user_id;
            ELSIF date_trunc('day', user_last_completion) = date_trunc('day', NEW.completed_at - interval '1 day') THEN
                -- Completed yesterday, increment streak
                UPDATE user_stats
                SET current_streak = current_user_streak + 1,
                    longest_streak = GREATEST(current_longest_streak, current_user_streak + 1),
                    last_completion_date = NEW.completed_at
                WHERE user_id = NEW.user_id;
            ELSE
                -- Break in streak, reset to 1
                -- But maintain the longest streak achieved
                UPDATE user_stats
                SET current_streak = 1,
                    longest_streak = GREATEST(current_longest_streak, 1),
                    last_completion_date = NEW.completed_at
                WHERE user_id = NEW.user_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the trigger
CREATE TRIGGER on_note_completed
    AFTER UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION handle_note_completion();

-- Update existing user_stats to fix any incorrect longest_streak values
UPDATE user_stats
SET longest_streak = GREATEST(longest_streak, current_streak)
WHERE longest_streak < current_streak;
