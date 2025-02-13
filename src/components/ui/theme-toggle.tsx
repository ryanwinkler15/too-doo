"use client"

import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Theme toggle clicked');
    console.log('Current theme:', theme);
    toggleTheme();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTheme();
    }
  };

  return (
    <button
      className={cn(
        "flex w-16 h-8 p-1 rounded-full transition-all duration-300",
        "hover:ring-2 hover:ring-primary/50 active:scale-95",
        isDark 
          ? "bg-zinc-800 border border-zinc-700" 
          : "bg-zinc-100 border border-zinc-200",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyPress}
      role="button"
      tabIndex={0}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <div className="flex justify-between items-center w-full pointer-events-none">
        <div
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300",
            isDark 
              ? "transform translate-x-0 bg-zinc-950" 
              : "transform translate-x-8 bg-white"
          )}
        >
          {isDark ? (
            <Moon 
              className="w-4 h-4 text-white" 
              strokeWidth={1.5}
            />
          ) : (
            <Sun 
              className="w-4 h-4 text-zinc-900" 
              strokeWidth={1.5}
            />
          )}
        </div>
        <div
          className={cn(
            "flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300",
            isDark 
              ? "bg-transparent" 
              : "transform -translate-x-8"
          )}
        >
          {isDark ? (
            <Sun 
              className="w-4 h-4 text-zinc-400" 
              strokeWidth={1.5}
            />
          ) : (
            <Moon 
              className="w-4 h-4 text-zinc-600" 
              strokeWidth={1.5}
            />
          )}
        </div>
      </div>
    </button>
  )
} 