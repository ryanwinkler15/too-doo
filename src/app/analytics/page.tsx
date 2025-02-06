'use client';

import { useState, useEffect } from "react";
import { NavBar } from "@/components/ui/tubelight-navbar";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { AiFillFire } from "react-icons/ai";
import { Bar, BarChart, XAxis, Tooltip, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ActivityData {
  day: string;
  created: number;
  completed: number;
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("Analytics");
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const supabase = createClientComponentClient();

  const navItems = [
    { name: 'Active', url: '/' },
    { name: 'Schedule', url: '/schedule' },
    { name: 'Completed', url: '/completed' },
    { name: 'Analytics', url: '/analytics' },
    { name: 'Settings', url: '/settings' }
  ];

  // Fetch user stats
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('No user found');

        // Get user stats
        const { data, error } = await supabase
          .from('user_stats')
          .select('current_streak, longest_streak')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setCurrentStreak(data.current_streak);
          setLongestStreak(data.longest_streak);
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchUserStats();
  }, [supabase]);

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
    <div className="min-h-screen bg-slate-950 text-white">
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
            <div className="h-[300px] bg-slate-900 rounded-xl p-6 border border-slate-800">
              <div className="flex flex-col">
                <h2 className="text-2xl font-semibold">Streak</h2>
                <p className="text-white text-sm mt-1 max-w-[120px]">
                  Complete at least one note per day
                </p>
              </div>
              <div className="flex flex-col items-center h-[calc(100%-5rem)] justify-center gap-4 -mt-8">
                <div className="relative flex items-center justify-center w-full">
                  <div className="flex items-center justify-center">
                    <div className="relative w-48 h-48 flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <AiFillFire className="w-full h-full absolute text-orange-500" />
                      </div>
                      <span className="text-7xl font-bold text-white relative z-10 transform translate-y-6 -translate-x-1">
                        {currentStreak}
                      </span>
                    </div>
                    <span className="text-4xl text-white ml-2 transform translate-y-6">
                      days
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center -mt-2">
                  <p className="text-sm text-white">
                    Longest streak: {longestStreak} days 🔥
                  </p>
                </div>
              </div>
            </div>

            {/* Score Card */}
            <div className="h-[300px] bg-slate-900 rounded-xl p-6 border border-slate-800">
              <h2 className="text-2xl font-semibold">Score</h2>
            </div>

            {/* Recent Activity Chart */}
            <div className="h-[300px] bg-slate-900 rounded-xl p-6 border border-slate-800">
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
                    stroke="#ffffff"
                  />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      background: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      padding: "12px"
                    }}
                    labelStyle={{ color: "#ffffff" }}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    height={24}
                    iconType="rect"
                    iconSize={8}
                    wrapperStyle={{
                      color: "#ffffff",
                      marginTop: "16px",
                      paddingBottom: "4px",
                      fontSize: "12px"
                    }}
                    formatter={(value: string) => <span style={{ color: '#ffffff', fontSize: '12px' }}>{value}</span>}
                  />
                  <Bar 
                    name="Created"
                    dataKey="created" 
                    fill="hsl(217, 91%, 60%)"
                    radius={[4, 4, 0, 0]}
                    label={{ 
                      position: 'top',
                      fill: '#ffffff',
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
                      fill: '#ffffff',
                      fontSize: 12,
                      formatter: (value: number) => value > 0 ? value : '',
                      dy: -4
                    }}
                  />
                </BarChart>
              </div>
            </div>

            <div className="h-[300px] bg-slate-900 rounded-xl p-6 border border-slate-800">
              <h2 className="text-2xl font-semibold mb-4">Priority Tasks</h2>
              {/* Visualization will go here */}
            </div>

            <div className="col-span-2 h-[250px] bg-slate-900 rounded-xl p-6 border border-slate-800">
              <h2 className="text-lg font-semibold mb-4">Completion Time</h2>
              {/* Visualization will go here */}
            </div>

            {/* Wide Card - Timeline */}
            <div className="col-span-2 h-[200px] bg-slate-900 rounded-xl p-6 border border-slate-800">
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
      className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-white whitespace-pre"
      >
        Too-Doo
      </motion.span>
    </Link>
  );
}; 