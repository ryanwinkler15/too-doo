'use client';

import { ThemeToggle } from "@/components/ui/theme-toggle";

export function SettingsHeader() {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <ThemeToggle />
    </div>
  );
} 