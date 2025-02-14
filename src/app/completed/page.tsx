'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { FannedNoteGrid } from "@/components/custom/FannedNoteGrid";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Note } from "@/lib/types";
import Link from 'next/link';
import { NavBar } from "@/components/ui/tubelight-navbar";
import { navItems } from "@/lib/navigation";

export default function CompletedPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState("Completed");
  const supabase = createClientComponentClient();

  const fetchCompletedNotes = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      const { data: rawData, error } = await supabase
        .from('notes')
        .select(`
          id,
          title,
          description,
          due_date,
          is_list,
          label:label_id (
            id,
            name,
            color
          )
        `)
        .eq('is_completed', true)
        .eq('user_id', user.id) // Only fetch user's notes
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (rawData) {
        const transformedData = rawData.map(note => ({
          ...note,
          label: Array.isArray(note.label) ? note.label[0] : note.label
        }));
        setNotes(transformedData);
      }
    } catch (error) {
      console.error('Error fetching completed notes:', error);
    }
  };

  useEffect(() => {
    fetchCompletedNotes();
  }, []);

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
      
      {/* Main Content Area - Fanned Note Grid */}
      <div className="px-4">
        <FannedNoteGrid notes={notes} onDelete={fetchCompletedNotes} />
      </div>
    </div>
  );
} 