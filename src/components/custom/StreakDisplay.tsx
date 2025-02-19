'use client';

import { useState, useEffect } from "react";
import { AiFillFire } from "react-icons/ai";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface StreakDisplayProps {
  size?: 'sm' | 'lg';
  className?: string;
}

export function StreakDisplay({ size = 'lg', className }: StreakDisplayProps) {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const supabase = createClientComponentClient();

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

  const sizeClasses = {
    sm: {
      container: "h-1",
      flame: "w-28 h-28",
      number: "text-5xl translate-y-3",
      text: "text-2xl translate-y-3"
    },
    lg: {
      container: "h-full",
      flame: "w-48 h-48",
      number: "text-7xl",
      text: "text-4xl"
    }
  };

  if (size === 'sm') {
    return (
      <div className={cn(
        "flex items-center gap-4 justify-start",
        className
      )}>
        <div className={cn(
          "relative flex items-center justify-center",
          sizeClasses.sm.container
        )}>
          <div className="relative flex items-center justify-center">
            <Link href="/analytics" className="cursor-pointer hover:opacity-80 transition-opacity">
              <div className={cn(
                "relative flex items-center justify-center",
                sizeClasses.sm.flame
              )}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <AiFillFire className="w-full h-full absolute text-orange-500" />
                </div>
                <span className={cn(
                  "font-bold text-foreground relative z-10",
                  sizeClasses.sm.number
                )}>
                  {currentStreak}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center w-full h-full -mt-8",
      className
    )}>
      <div className="flex items-center justify-center -translate-y-8">
        <div className="relative">
          <div className={cn(
            "relative flex items-center justify-center",
            sizeClasses.lg.flame
          )}>
            <div className="absolute inset-0 flex items-center justify-center">
              <AiFillFire className="w-full h-full absolute text-orange-500" />
            </div>
            <span className={cn(
              "font-bold text-foreground relative z-10 transform translate-y-4",
              sizeClasses.lg.number
            )}>
              {currentStreak}
            </span>
          </div>
        </div>
        <span className={cn(
          "text-foreground ml-4 transform translate-y-4",
          sizeClasses.lg.text
        )}>
          days
        </span>
      </div>
      <div className="-mt-4">
        <p className="text-sm text-foreground">
          Longest streak: {longestStreak} days 🔥
        </p>
      </div>
    </div>
  );
} 