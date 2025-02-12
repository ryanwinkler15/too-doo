-- Function to get active task counts by label
CREATE OR REPLACE FUNCTION get_active_task_counts_by_label(user_id_param UUID)
RETURNS TABLE (
    label_id UUID,
    count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        notes.label_id,
        COUNT(*)::BIGINT
    FROM notes
    WHERE 
        notes.user_id = user_id_param
        AND notes.is_completed = false
        AND notes.label_id IS NOT NULL
    GROUP BY notes.label_id;
END;
$$;

-- Function to get all task counts by label
CREATE OR REPLACE FUNCTION get_all_task_counts_by_label(user_id_param UUID)
RETURNS TABLE (
    label_id UUID,
    count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        notes.label_id,
        COUNT(*)::BIGINT
    FROM notes
    WHERE 
        notes.user_id = user_id_param
        AND notes.label_id IS NOT NULL
    GROUP BY notes.label_id;
END;
$$;

-- Add RLS policies for the functions
GRANT EXECUTE ON FUNCTION get_active_task_counts_by_label TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_task_counts_by_label TO authenticated; 