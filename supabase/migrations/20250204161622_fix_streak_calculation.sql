-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_note_completed ON notes;

-- Drop the existing function
DROP FUNCTION IF EXISTS handle_note_completion();

-- Create updated function to handle note completion and update streaks
CREATE OR REPLACE FUNCTION handle_note_completion()
RETURNS TRIGGER AS $$
DECLARE
    last_completion TIMESTAMPTZ;
    today_start TIMESTAMPTZ;
    yesterday_start TIMESTAMPTZ;
    has_completion_today BOOLEAN;
    has_completion_yesterday BOOLEAN;
    current_user_streak INTEGER;
    current_longest_streak INTEGER;
BEGIN
    -- Only proceed if is_completed changed from false to true
    IF (TG_OP = 'UPDATE' AND OLD.is_completed = false AND NEW.is_completed = true) THEN
        -- Calculate today and yesterday's date boundaries
        today_start := date_trunc('day', NOW());
        yesterday_start := today_start - interval '1 day';
        
        -- Check if there are any completions today (including the current one)
        SELECT EXISTS (
            SELECT 1
            FROM notes
            WHERE user_id = NEW.user_id
            AND is_completed = true
            AND completed_at >= today_start
            AND completed_at < today_start + interval '1 day'
        ) INTO has_completion_today;
        
        -- Check if there were any completions yesterday
        SELECT EXISTS (
            SELECT 1
            FROM notes
            WHERE user_id = NEW.user_id
            AND is_completed = true
            AND completed_at >= yesterday_start
            AND completed_at < today_start
        ) INTO has_completion_yesterday;
        
        -- Get current streak info
        SELECT current_streak, longest_streak, last_completion_date
        INTO current_user_streak, current_longest_streak, last_completion
        FROM user_stats
        WHERE user_id = NEW.user_id;
        
        -- Initialize if no previous stats
        IF last_completion IS NULL THEN
            UPDATE user_stats
            SET current_streak = 1,
                longest_streak = 1,
                last_completion_date = NEW.completed_at
            WHERE user_id = NEW.user_id;
        ELSE
            -- If this is the first completion today
            IF NOT has_completion_today THEN
                IF has_completion_yesterday THEN
                    -- Completed yesterday, increment streak
                    UPDATE user_stats
                    SET current_streak = current_user_streak + 1,
                        longest_streak = GREATEST(current_longest_streak, current_user_streak + 1),
                        last_completion_date = NEW.completed_at
                    WHERE user_id = NEW.user_id;
                ELSE
                    -- No completion yesterday, reset streak to 1
                    UPDATE user_stats
                    SET current_streak = 1,
                        longest_streak = GREATEST(current_longest_streak, 1),
                        last_completion_date = NEW.completed_at
                    WHERE user_id = NEW.user_id;
                END IF;
            ELSE
                -- Already completed today, just update last_completion_date
                UPDATE user_stats
                SET last_completion_date = GREATEST(last_completion, NEW.completed_at)
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

-- Add a function to recalculate streaks for all users
CREATE OR REPLACE FUNCTION recalculate_all_streaks()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    completion_dates DATE[];
    current_date DATE;
    streak_count INTEGER;
    max_streak INTEGER;
    last_completion TIMESTAMPTZ;
BEGIN
    FOR user_record IN SELECT DISTINCT user_id FROM notes WHERE is_completed = true LOOP
        -- Get all completion dates for this user
        SELECT ARRAY_AGG(DISTINCT date_trunc('day', completed_at)::date ORDER BY date_trunc('day', completed_at)::date)
        INTO completion_dates
        FROM notes
        WHERE user_id = user_record.user_id AND is_completed = true;

        IF array_length(completion_dates, 1) > 0 THEN
            current_date := completion_dates[array_length(completion_dates, 1)];
            streak_count := 1;
            max_streak := 1;
            last_completion := completion_dates[array_length(completion_dates, 1)]::timestamptz;

            -- Calculate current streak
            FOR i IN REVERSE array_length(completion_dates, 1)-1..1 LOOP
                IF completion_dates[i] = current_date - 1 THEN
                    streak_count := streak_count + 1;
                    max_streak := GREATEST(max_streak, streak_count);
                    current_date := completion_dates[i];
                ELSE
                    EXIT;
                END IF;
            END LOOP;

            -- Update user_stats
            UPDATE user_stats
            SET current_streak = streak_count,
                longest_streak = max_streak,
                last_completion_date = last_completion
            WHERE user_id = user_record.user_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the recalculation for all users
SELECT recalculate_all_streaks();
