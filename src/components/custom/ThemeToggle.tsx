"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleClick = () => {
    console.log('Theme toggle clicked');
    console.log('Current theme:', theme);
    toggleTheme();
    console.log('New theme:', theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="rounded-full w-9 h-9 hover:bg-slate-800/50 border border-border"
      style={{ cursor: 'pointer' }}
    >
      <div className="relative">
        {theme === "dark" ? (
          <Sun className="h-5 w-5 text-white transition-all" />
        ) : (
          <Moon className="h-5 w-5 transition-all" />
        )}
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
} 