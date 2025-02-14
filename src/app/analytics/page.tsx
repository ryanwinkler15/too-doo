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

interface ActivityData {
  day: string;
  created: number;
  completed: number;
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("Analytics");
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const supabase = createClientComponentClient();

  // Fetch activity data
  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('No user found');

        // Get the last 7 days
        const dates = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date;
        });

        // Format dates for display and query
        const formattedDates = dates.map(date => ({
          display: date.toLocaleDateString('en-US', { weekday: 'short' }),
          start: new Date(date.setHours(0, 0, 0, 0)).toISOString(),
          end: new Date(date.setHours(23, 59, 59, 999)).toISOString(),
          isToday: new Date().toDateString() === date.toDateString()
        }));

        // Fetch data for each day
        const activityPromises = formattedDates.map(async ({ start, end }) => {
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
            created: createdRes.count || 0,
            completed: completedRes.count || 0
          };
        });

        const activityCounts = await Promise.all(activityPromises);

        // Combine the data
        const chartData = formattedDates.map((date, index) => ({
          day: date.display + (date.isToday ? ' (Today)' : ''),
          created: activityCounts[index].created,
          completed: activityCounts[index].completed
        }));

        setActivityData(chartData);
      } catch (error) {
        console.error('Error fetching activity data:', error);
      }
    };

    fetchActivityData();
  }, [supabase]);

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
              <h2 className="text-2xl font-semibold">Recent Activity</h2>
              <div className="h-[250px] mt-4">
                <BarChart 
                  data={activityData} 
                  margin={{ top: 32, right: 10, left: 10, bottom: 16 }}
                  width={500}
                  height={230}
                >
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                    stroke="currentColor"
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