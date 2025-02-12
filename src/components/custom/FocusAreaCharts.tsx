'use client';

import { useState, useEffect, useMemo } from 'react';
import { Label, Pie, PieChart } from 'recharts';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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
  const [allTaskCounts, setAllTaskCounts] = useState<TaskCount[]>([]);
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

        // Fetch all task counts by label
        const { data: allData, error: allError } = await supabase
          .rpc('get_all_task_counts_by_label', { user_id_param: user.id });
        
        if (allError) throw allError;
        setAllTaskCounts(allData || []);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  // Transform data for charts
  const activeChartData: ChartData[] = useMemo(() => {
    return labels.map(label => ({
      name: label.name,
      value: activeTaskCounts.find(tc => tc.label_id === label.id)?.count || 0,
      fill: label.color
    })).filter(item => item.value > 0);
  }, [labels, activeTaskCounts]);

  const allChartData: ChartData[] = useMemo(() => {
    return labels.map(label => ({
      name: label.name,
      value: allTaskCounts.find(tc => tc.label_id === label.id)?.count || 0,
      fill: label.color
    })).filter(item => item.value > 0);
  }, [labels, allTaskCounts]);

  // Calculate totals for center text
  const totalActive = useMemo(() => 
    activeChartData.reduce((acc, curr) => acc + curr.value, 0),
    [activeChartData]
  );

  const totalAll = useMemo(() => 
    allChartData.reduce((acc, curr) => acc + curr.value, 0),
    [allChartData]
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
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Active Tasks Chart */}
      <div className="flex flex-col">
        <h3 className="text-sm font-medium mb-2">Active Tasks</h3>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-full"
        >
          <PieChart>
            <Pie
              data={activeChartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={2}
              stroke="#0f172a"
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
                          className="fill-white text-2xl font-bold"
                        >
                          {totalActive}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-slate-400 text-sm"
                        >
                          notes
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="text-xs flex-wrap gap-2"
            />
          </PieChart>
        </ChartContainer>
      </div>

      {/* All Tasks Chart */}
      <div className="flex flex-col">
        <h3 className="text-sm font-medium mb-2">All Tasks</h3>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-full"
        >
          <PieChart>
            <Pie
              data={allChartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={2}
              stroke="#0f172a"
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
                          className="fill-white text-2xl font-bold"
                        >
                          {totalAll}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-slate-400 text-sm"
                        >
                          notes
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="text-xs flex-wrap gap-2"
            />
          </PieChart>
        </ChartContainer>
      </div>
    </div>
  );
} 