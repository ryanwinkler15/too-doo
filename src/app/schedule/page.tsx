'use client';

import { useState } from 'react';
import { NavBar } from "@/components/ui/tubelight-navbar";

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState("Schedule");

  const navItems = [
    { name: 'Active', url: '/' },
    { name: 'Schedule', url: '/schedule' },
    { name: 'Completed', url: '/completed' },
    { name: 'Analytics', url: '/analytics' },
    { name: 'Settings', url: '/settings' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
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
        <h1 className="text-4xl font-bold text-white/60">Coming soon!</h1>
      </div>
    </div>
  );
} 