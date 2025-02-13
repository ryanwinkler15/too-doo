"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

export function ThemeDebug() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-card border border-border rounded-lg shadow-lg z-50">
      <div className="space-y-2">
        <p className="text-sm">Current Theme: <span className="font-bold">{theme}</span></p>
        <p className="text-sm">Dark Class Present: <span className="font-bold">{document.documentElement.classList.contains('dark') ? 'Yes' : 'No'}</span></p>
        <Button 
          onClick={() => {
            console.log('Debug button clicked');
            toggleTheme();
          }}
          variant="outline"
          className="w-full"
        >
          Debug Toggle Theme
        </Button>
      </div>
    </div>
  );
} 