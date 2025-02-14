'use client';

import { useState } from 'react';
import { NavBar } from "@/components/ui/tubelight-navbar";
import { navItems } from "@/lib/navigation";

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState("Schedule");

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      {/* Top Navigation Bar */}
      <div className="mb-8">
        <NavBar 
          items={navItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          className="relative"
        />
      </div>
      
      {/* Main Content Area */}
      <div className="flex items-center justify-center h-[60vh]">
        <h1 className="text-4xl font-bold text-foreground/60">Coming soon!</h1>
      </div>
    </div>
  );
} 