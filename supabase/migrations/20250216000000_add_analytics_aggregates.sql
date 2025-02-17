-- Create analytics_aggregates table
CREATE TABLE IF NOT EXISTS analytics_aggregates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_count INTEGER NOT NULL DEFAULT 0,
  completed_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure periods don't overlap for a user
  CONSTRAINT unique_user_period UNIQUE (user_id, period_start, period_end)
);

-- Create index for efficient querying
CREATE INDEX idx_analytics_period ON analytics_aggregates(user_id, period_start);

-- Enable Row Level Security
ALTER TABLE analytics_aggregates ENABLE ROW LEVEL SECURITY;

-- Create policy to ensure users can only see their own analytics
CREATE POLICY "Users can view their own analytics"
  ON analytics_aggregates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy to allow the edge function to insert/update analytics
CREATE POLICY "Edge function can manage analytics"
  ON analytics_aggregates
  FOR ALL
  TO service_role
  USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_analytics_aggregates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_analytics_aggregates_updated_at
  BEFORE UPDATE ON analytics_aggregates
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_aggregates_updated_at(); 