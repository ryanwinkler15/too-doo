-- Create user_stats table
CREATE TABLE user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,  -- One row per user
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completion_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on user_id for faster lookups
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);

-- Enable Row Level Security
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own stats"
ON user_stats FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own stats"
ON user_stats FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own stats"
ON user_stats FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id::text);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_stats_updated_at
    BEFORE UPDATE ON user_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle note completion and update streaks
CREATE OR REPLACE FUNCTION handle_note_completion()
RETURNS TRIGGER AS $$
DECLARE
    user_last_completion TIMESTAMPTZ;
    current_user_streak INTEGER;
BEGIN
    -- Only proceed if is_completed changed from false to true
    IF (TG_OP = 'UPDATE' AND OLD.is_completed = false AND NEW.is_completed = true) THEN
        -- Get the last completion date and current streak for this user
        SELECT last_completion_date, current_streak 
        INTO user_last_completion, current_user_streak
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
                -- If streak is 0, set it to 1, otherwise keep current streak
                UPDATE user_stats
                SET last_completion_date = NEW.completed_at,
                    current_streak = GREATEST(1, current_user_streak)
                WHERE user_id = NEW.user_id;
            ELSIF date_trunc('day', user_last_completion) = date_trunc('day', NEW.completed_at - interval '1 day') THEN
                -- Completed yesterday, increment streak
                UPDATE user_stats
                SET current_streak = current_user_streak + 1,
                    longest_streak = GREATEST(longest_streak, current_user_streak + 1),
                    last_completion_date = NEW.completed_at
                WHERE user_id = NEW.user_id;
            ELSE
                -- Break in streak, reset to 1
                UPDATE user_stats
                SET current_streak = 1,
                    last_completion_date = NEW.completed_at
                WHERE user_id = NEW.user_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update streaks on note completion
CREATE TRIGGER on_note_completed
    AFTER UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION handle_note_completion();

-- Create function to initialize user_stats on user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert user_stats with null last_completion_date for new users
    INSERT INTO public.user_stats (user_id, last_completion_date, current_streak, longest_streak)
    VALUES (NEW.id, NULL, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically create user_stats for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Initialize user_stats for existing users
INSERT INTO user_stats (user_id, last_completion_date, current_streak)
SELECT DISTINCT
    notes.user_id,
    MAX(notes.completed_at) as last_completion_date,
    CASE 
        WHEN MAX(notes.completed_at) >= NOW() - interval '1 day' THEN 1
        ELSE 0
    END as current_streak
FROM notes
WHERE notes.is_completed = true
GROUP BY notes.user_id
ON CONFLICT (user_id) DO UPDATE
SET last_completion_date = EXCLUDED.last_completion_date,
    current_streak = EXCLUDED.current_streak;
