'use client';

import { useState, useEffect, useMemo } from 'react';
import { Label, Pie, PieChart } from 'recharts';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface Label {
  id: string;
  name: string;
  color: string;
}

interface TaskCount {
  label_id: string;
  count: number;
}

interface ChartData {
  name: string;
  value: number;
  fill: string;
}

export function FocusAreaCharts() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [activeTaskCounts, setActiveTaskCounts] = useState<TaskCount[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('No user found');

        // Fetch labels
        const { data: labelsData, error: labelsError } = await supabase
          .from('labels')
          .select('id, name, color')
          .order('name');
        
        if (labelsError) throw labelsError;
        setLabels(labelsData || []);

        // Fetch active task counts by label
        const { data: activeData, error: activeError } = await supabase
          .rpc('get_active_task_counts_by_label', { user_id_param: user.id });
        
        if (activeError) throw activeError;
        setActiveTaskCounts(activeData || []);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  // Transform data for charts
  const chartData: ChartData[] = useMemo(() => {
    // First, create the full dataset including unlabeled notes
    const fullData = [
      // Add "Unmarked" entry for notes with null label_id
      {
        name: 'Unmarked',
        value: activeTaskCounts.find(tc => tc.label_id === null)?.count || 0,
        fill: '#64748b' // slate-500 for unmarked notes
      },
      // Add all labeled notes
      ...labels.map(label => ({
        name: label.name,
        value: activeTaskCounts.find(tc => tc.label_id === label.id)?.count || 0,
        fill: label.color
      }))
    ].filter(item => item.value > 0);

    // Sort by value in descending order
    const sortedData = [...fullData].sort((a, b) => b.value - a.value);

    // If we have 6 or fewer items, return them all
    if (sortedData.length <= 5) {
      return sortedData;
    }

    // Take top 5 items
    const topItems = sortedData.slice(0, 5);

    // Calculate sum of remaining items
    const otherValue = sortedData
      .slice(5)
      .reduce((sum, item) => sum + item.value, 0);

    // Add "Other" category if there are remaining items
    if (otherValue > 0) {
      topItems.push({
        name: 'Other',
        value: otherValue,
        fill: '#475569' // slate-600 for "Other" category
      });
    }

    return topItems;
  }, [labels, activeTaskCounts]);

  // Calculate total for center text
  const total = useMemo(() => 
    chartData.reduce((acc, curr) => acc + curr.value, 0),
    [chartData]
  );

  // Create chart config from labels
  const chartConfig = useMemo(() => {
    const config: Record<string, any> = {
      value: { label: 'Tasks' }
    };
    
    labels.forEach(label => {
      config[label.name] = {
        label: label.name,
        color: label.color
      };
    });

    return config as ChartConfig;
  }, [labels]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-full">
      <ChartContainer
        config={chartConfig}
        className="mx-auto h-[250px] pb-4"
      >
        <div className="flex items-center justify-between">
          {/* Legend - Left Side */}
          <div className="flex flex-col space-y-2 pl-4">
            {chartData.map((entry) => (
              <div key={entry.name} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="text-sm text-foreground">
                  {entry.name}
                </span>
              </div>
            ))}
          </div>

          {/* Pie Chart - Right Side */}
          <PieChart width={250} height={200}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={45}
              outerRadius={80}
              strokeWidth={2}
              stroke="var(--background)"
              cy={85}
              cx={125}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-sm"
                        >
                          notes
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </div>
      </ChartContainer>
    </div>
  );
} 