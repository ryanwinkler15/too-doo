-- Function to get active task counts by label (including unlabeled)
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
    GROUP BY notes.label_id;
END;
$$;

-- Update permissions
GRANT EXECUTE ON FUNCTION get_active_task_counts_by_label TO authenticated; 