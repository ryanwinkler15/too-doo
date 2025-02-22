-- Drop existing objects in the correct order
DROP TRIGGER IF EXISTS log_note_created ON notes;
DROP TRIGGER IF EXISTS log_note_updated ON notes;
DROP TRIGGER IF EXISTS log_note_deleted ON notes;

DROP FUNCTION IF EXISTS on_note_created();
DROP FUNCTION IF EXISTS on_note_updated();
DROP FUNCTION IF EXISTS on_note_deleted();
DROP FUNCTION IF EXISTS log_user_activity(UUID, user_activity_type, JSONB);
DROP FUNCTION IF EXISTS update_user_streak(UUID);

DROP TABLE IF EXISTS user_activity;
DROP TYPE IF EXISTS user_activity_type CASCADE;

-- Rename last_completion_date to last_activity_date in user_stats
ALTER TABLE user_stats RENAME COLUMN last_completion_date TO last_activity_date;

-- Create an enum for activity types
CREATE TYPE user_activity_type AS ENUM (
    'login',
    'note_create',
    'note_edit',
    'note_delete',
    'note_complete',
    'note_uncomplete'
);

-- Create user_activity table to track all user actions
CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    activity_type user_activity_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for efficient querying
CREATE INDEX idx_user_activity_user_date ON user_activity(user_id, created_at);

-- Enable RLS
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own activity"
    ON user_activity FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
    ON user_activity FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    user_id_param UUID,
    activity_type_param user_activity_type,
    metadata_param JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO user_activity (user_id, activity_type, metadata)
    VALUES (user_id_param, activity_type_param, metadata_param)
    RETURNING id INTO activity_id;

    -- Update user stats with new streak calculation
    PERFORM update_user_streak(user_id_param);
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate streak based on any activity
CREATE OR REPLACE FUNCTION update_user_streak(user_id_param UUID)
RETURNS void AS $$
DECLARE
    activity_dates DATE[];
    latest_activity_date DATE;
    today DATE;
    yesterday DATE;
    streak_count INTEGER;
    max_streak INTEGER;
    last_activity TIMESTAMPTZ;
BEGIN
    -- Get current date boundaries
    today := date_trunc('day', NOW())::date;
    yesterday := today - 1;

    -- Get all distinct activity dates for this user
    SELECT ARRAY_AGG(DISTINCT date_trunc('day', created_at)::date ORDER BY date_trunc('day', created_at)::date)
    INTO activity_dates
    FROM user_activity
    WHERE user_id = user_id_param;

    IF array_length(activity_dates, 1) > 0 THEN
        latest_activity_date := activity_dates[array_length(activity_dates, 1)];
        
        -- Initialize streak count based on most recent activity
        IF latest_activity_date = today THEN
            -- Active today, start streak at 1
            streak_count := 1;
        ELSIF latest_activity_date = yesterday THEN
            -- Active yesterday but not today, streak still alive
            streak_count := 1;
            latest_activity_date := yesterday;
        ELSE
            -- No activity today or yesterday, streak is 0
            streak_count := 0;
        END IF;

        -- Get the last activity timestamp
        SELECT MAX(created_at)
        INTO last_activity
        FROM user_activity
        WHERE user_id = user_id_param;

        -- If we have a streak going, look back for more days
        IF streak_count > 0 THEN
            -- Calculate rest of streak
            FOR i IN REVERSE array_length(activity_dates, 1)-1..1 LOOP
                IF activity_dates[i] = latest_activity_date - 1 THEN
                    streak_count := streak_count + 1;
                    latest_activity_date := activity_dates[i];
                ELSE
                    EXIT;
                END IF;
            END LOOP;
        END IF;

        -- Update max streak
        max_streak := GREATEST(streak_count, 
            (SELECT longest_streak FROM user_stats WHERE user_id = user_id_param));

        -- Update user_stats
        UPDATE user_stats
        SET current_streak = streak_count,
            longest_streak = max_streak,
            last_activity_date = last_activity
        WHERE user_id = user_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for various activities

-- Note creation trigger
CREATE OR REPLACE FUNCTION on_note_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_user_activity(
        NEW.user_id,
        'note_create'::user_activity_type,
        jsonb_build_object('note_id', NEW.id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_note_created
    AFTER INSERT ON notes
    FOR EACH ROW
    EXECUTE FUNCTION on_note_created();

-- Note update trigger
CREATE OR REPLACE FUNCTION on_note_updated()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if meaningful changes were made
    IF NEW.title != OLD.title OR NEW.content != OLD.content OR NEW.items != OLD.items THEN
        PERFORM log_user_activity(
            NEW.user_id,
            'note_edit'::user_activity_type,
            jsonb_build_object('note_id', NEW.id)
        );
    END IF;

    -- Handle completion status changes
    IF NEW.is_completed != OLD.is_completed THEN
        PERFORM log_user_activity(
            NEW.user_id,
            CASE WHEN NEW.is_completed THEN 'note_complete' ELSE 'note_uncomplete' END::user_activity_type,
            jsonb_build_object('note_id', NEW.id)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_note_updated
    AFTER UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION on_note_updated();

-- Note deletion trigger
CREATE OR REPLACE FUNCTION on_note_deleted()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_user_activity(
        OLD.user_id,
        'note_delete'::user_activity_type,
        jsonb_build_object('note_id', OLD.id)
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_note_deleted
    AFTER DELETE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION on_note_deleted();

-- Backfill existing activity data
INSERT INTO user_activity (user_id, activity_type, created_at, metadata)
SELECT 
    user_id,
    'note_create'::user_activity_type,
    created_at,
    jsonb_build_object('note_id', id)
FROM notes;

INSERT INTO user_activity (user_id, activity_type, created_at, metadata)
SELECT 
    user_id,
    'note_complete'::user_activity_type,
    completed_at,
    jsonb_build_object('note_id', id)
FROM notes
WHERE is_completed = true
AND completed_at IS NOT NULL;

-- Recalculate streaks for all users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT DISTINCT user_id FROM user_activity LOOP
        PERFORM update_user_streak(user_record.user_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql; 