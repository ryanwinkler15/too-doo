-- Fix any cases where longest_streak is less than current_streak
UPDATE user_stats
SET longest_streak = GREATEST(longest_streak, current_streak);

-- Ensure longest_streak is at least 1 if current_streak is 1
UPDATE user_stats
SET longest_streak = GREATEST(longest_streak, 1)
WHERE current_streak > 0; 