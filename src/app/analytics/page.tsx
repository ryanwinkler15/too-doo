'use client';

import { useState, useEffect } from "react";
import { NavBar } from "@/components/ui/tubelight-navbar";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Bar, BarChart, XAxis, Tooltip, Legend } from "recharts";
import { StreakDisplay } from "@/components/custom/StreakDisplay";
import { FocusAreaCharts } from "@/components/custom/FocusAreaCharts";
import { navItems } from "@/lib/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type TimeFrame = '1 week' | '1 month' | '3 months';

interface ActivityData {
  day: string;
  created: number;
  completed: number;
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("Analytics");
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('1 week');
  const supabase = createClientComponentClient();

  // Fetch activity data
  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('No user found');

        let chartData: ActivityData[] = [];

        if (selectedTimeFrame === '1 month') {
          // Get 5 weekly sections
          const weeklySections = Array.from({ length: 5 }, (_, i) => {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - (i * 7));
            endDate.setHours(23, 59, 59, 999);
            
            const startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            
            return { startDate, endDate };
          });

          // Fetch data for each weekly section
          const weeklyDataPromises = weeklySections.map(async ({ startDate, endDate }, index) => {
            const [createdRes, completedRes] = await Promise.all([
              supabase
                .from('notes')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id)
                .gte('created_at', startDate.toISOString())
                .lt('created_at', endDate.toISOString()),
              supabase
                .from('notes')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id)
                .gte('completed_at', startDate.toISOString())
                .lt('completed_at', endDate.toISOString())
            ]);

            const weekLabels = [
              'This Week',
              'Last Week',
              '2 Weeks Ago',
              '3 Weeks Ago',
              '4 Weeks Ago'
            ];

            return {
              day: weekLabels[index],
              created: createdRes.count || 0,
              completed: completedRes.count || 0,
              order: index // Add order to maintain sequence
            };
          });

          chartData = (await Promise.all(weeklyDataPromises))
            .sort((a, b) => a.order - b.order) // Sort by order
            .map(({ day, created, completed }) => ({ day, created, completed })); // Remove order from final data
        } else if (selectedTimeFrame === '1 week') {
          // Existing weekly view logic
          const dates = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date;
          });

          const formattedDates = dates.map(date => ({
            display: date.toLocaleDateString('en-US', { weekday: 'short' }),
            start: new Date(date.setHours(0, 0, 0, 0)).toISOString(),
            end: new Date(date.setHours(23, 59, 59, 999)).toISOString(),
            isToday: new Date().toDateString() === date.toDateString()
          }));

          const activityPromises = formattedDates.map(async ({ start, end, display, isToday }) => {
            const [createdRes, completedRes] = await Promise.all([
              supabase
                .from('notes')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id)
                .gte('created_at', start)
                .lte('created_at', end),
              supabase
                .from('notes')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id)
                .gte('completed_at', start)
                .lte('completed_at', end)
            ]);

            return {
              day: display + (isToday ? ' (Today)' : ''),
              created: createdRes.count || 0,
              completed: completedRes.count || 0
            };
          });

          chartData = await Promise.all(activityPromises);
        } else {
          // 3 months view - 6 two-week blocks
          const twoWeekSections = Array.from({ length: 6 }, (_, i) => {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - (i * 14));
            endDate.setHours(23, 59, 59, 999);
            
            const startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 13);
            startDate.setHours(0, 0, 0, 0);
            
            return { startDate, endDate };
          });

          // Fetch data for each two-week section
          const twoWeekDataPromises = twoWeekSections.map(async ({ startDate, endDate }, index) => {
            const [createdRes, completedRes] = await Promise.all([
              supabase
                .from('notes')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id)
                .gte('created_at', startDate.toISOString())
                .lt('created_at', endDate.toISOString()),
              supabase
                .from('notes')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id)
                .gte('completed_at', startDate.toISOString())
                .lt('completed_at', endDate.toISOString())
            ]);

            // Format the end date (which is the label date) as M/D
            const labelDate = endDate.toLocaleDateString('en-US', {
              month: 'numeric',
              day: 'numeric'
            });

            return {
              day: labelDate,
              created: createdRes.count || 0,
              completed: completedRes.count || 0,
              order: index
            };
          });

          chartData = (await Promise.all(twoWeekDataPromises))
            .sort((a, b) => a.order - b.order)
            .map(({ day, created, completed }) => ({ day, created, completed }));
        }

        setActivityData(chartData);
      } catch (error) {
        console.error('Error fetching activity data:', error);
      }
    };

    fetchActivityData();
  }, [supabase, selectedTimeFrame]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 pb-0 z-10">
        <NavBar 
          items={navItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          className="relative"
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-10 pt-[72px]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Analytics Dashboard</h1>
          
          {/* Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {/* Streak Card */}
            <div className="h-[300px] bg-card rounded-xl p-6 border border-border shadow-lg dark:shadow-[0_20px_35px_-20px_rgba(255,255,255,0.1)]">
              <div className="flex flex-col h-full">
                <div>
                  <h2 className="text-2xl font-semibold">Streak</h2>
                  <p className="text-foreground text-sm mt-1 max-w-[120px]">
                    Complete at least one note per day
                  </p>
                </div>
                <div className="flex-1 flex items-center justify-center -mt-4">
                  <StreakDisplay size="lg" />
                </div>
              </div>
            </div>

            {/* Score Card */}
            <div className="h-[300px] bg-card rounded-xl p-6 border border-border shadow-lg dark:shadow-[0_20px_35px_-20px_rgba(255,255,255,0.1)]">
              <h2 className="text-2xl font-semibold">Score</h2>
            </div>

            {/* Recent Activity Chart */}
            <div className="h-[300px] bg-card rounded-xl p-6 border border-border shadow-lg dark:shadow-[0_20px_35px_-20px_rgba(255,255,255,0.1)]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Recent Activity</h2>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={cn(
                        "w-[110px] justify-between",
                        "bg-background/50 border-border/50 hover:bg-background/80"
                      )}
                    >
                      {selectedTimeFrame}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[110px] p-0" 
                    align="end"
                  >
                    <div className="flex flex-col">
                      {(['1 week', '1 month', '3 months'] as TimeFrame[]).map((timeFrame) => (
                        <Button
                          key={timeFrame}
                          variant={selectedTimeFrame === timeFrame ? "secondary" : "ghost"}
                          className="justify-center rounded-none first:rounded-t-md last:rounded-b-md"
                          onClick={() => {
                            setSelectedTimeFrame(timeFrame);
                          }}
                        >
                          {timeFrame}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="h-[250px] mt-4">
                <BarChart 
                  data={activityData} 
                  margin={{ top: 32, right: 10, left: 10, bottom: 16 }}
                  width={500}
                  height={230}
                  barGap={0}
                >
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                    stroke="currentColor"
                    interval={0}
                  />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "12px",
                      color: "var(--foreground)"
                    }}
                    labelStyle={{ color: "currentColor" }}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    height={24}
                    iconType="rect"
                    iconSize={8}
                    wrapperStyle={{
                      color: "currentColor",
                      marginTop: "16px",
                      paddingBottom: "4px",
                      fontSize: "12px"
                    }}
                    formatter={(value: string) => <span style={{ color: 'currentColor', fontSize: '12px' }}>{value}</span>}
                  />
                  <Bar 
                    name="Created"
                    dataKey="created" 
                    fill="hsl(217, 91%, 60%)"
                    radius={[4, 4, 0, 0]}
                    label={{ 
                      position: 'top',
                      fill: "currentColor",
                      fontSize: 12,
                      formatter: (value: number) => value > 0 ? value : '',
                      dy: -4
                    }}
                  />
                  <Bar 
                    name="Completed"
                    dataKey="completed" 
                    fill="hsl(142, 71%, 45%)"
                    radius={[4, 4, 0, 0]}
                    label={{ 
                      position: 'top',
                      fill: "currentColor",
                      fontSize: 12,
                      formatter: (value: number) => value > 0 ? value : '',
                      dy: -4
                    }}
                  />
                </BarChart>
              </div>
            </div>

            <div className="h-[300px] bg-card rounded-xl p-6 border border-border shadow-lg dark:shadow-[0_20px_35px_-20px_rgba(255,255,255,0.1)]">
              <h2 className="text-2xl font-semibold mb-4">Active Focus</h2>
              <FocusAreaCharts />
            </div>

            <div className="col-span-2 h-[250px] bg-card rounded-xl p-6 border border-border shadow-lg dark:shadow-[0_20px_35px_-20px_rgba(255,255,255,0.1)]">
              <h2 className="text-lg font-semibold mb-4">Completion Time</h2>
              {/* Visualization will go here */}
            </div>

            {/* Wide Card - Timeline */}
            <div className="col-span-2 h-[200px] bg-card rounded-xl p-6 border border-border shadow-lg dark:shadow-[0_20px_35px_-20px_rgba(255,255,255,0.1)]">
              <h2 className="text-lg font-semibold mb-4">Task Timeline</h2>
              {/* Visualization will go here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Logo = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-foreground py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-foreground rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-foreground whitespace-pre"
      >
        Too-Doo
      </motion.span>
    </Link>
  );
}; 