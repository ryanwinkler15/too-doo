'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { FannedNoteGrid } from "@/components/custom/FannedNoteGrid";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Note } from "@/lib/types";
import Link from 'next/link';
import { NavBar } from "@/components/ui/tubelight-navbar";

export default function CompletedPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState("Completed");
  const supabase = createClientComponentClient();

  const navItems = [
    { name: 'Active', url: '/' },
    { name: 'Schedule', url: '/schedule' },
    { name: 'Completed', url: '/completed' },
    { name: 'Analytics', url: '/analytics' },
    { name: 'Settings', url: '/settings' }
  ];

  const fetchCompletedNotes = async () => {
    const { data: rawData, error } = await supabase
      .from('notes')
      .select(`
        id,
        title,
        description,
        due_date,
        label:label_id (
          id,
          name,
          color
        )
      `)
      .eq('is_completed', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching completed notes:', error);
      return;
    }

    if (rawData) {
      const transformedData = rawData.map(note => ({
        ...note,
        label: Array.isArray(note.label) ? note.label[0] : note.label
      }));
      setNotes(transformedData);
    }
  };

  useEffect(() => {
    fetchCompletedNotes();
  }, []);

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
      
      {/* Main Content Area - Fanned Note Grid */}
      <div className="px-4">
        <FannedNoteGrid notes={notes} onDelete={fetchCompletedNotes} />
      </div>
    </div>
  );
} 