'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { NoteGrid } from "@/components/custom/NoteGrid";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Note } from "@/lib/types";
import Link from 'next/link';

export default function CompletedPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const supabase = createClientComponentClient();

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
      .eq('is_completed', true)  // Using is_completed instead of completed
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
      {/* Title */}
      <h1 className="text-4xl font-bold text-center mb-8">Completed Tasks</h1>
      
      {/* Header Bar */}
      <div className="flex justify-between items-center mb-8">
        {/* Left side - View Toggle */}
        <div className="space-x-2">
          <Link href="/">
            <Button variant="outline" className="bg-slate-800 text-white hover:bg-slate-700">
              Active
            </Button>
          </Link>
          <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
            Completed
          </Button>
        </div>
      </div>
      
      {/* Main Content Area - Note Grid */}
      <div className="px-4">
        <NoteGrid notes={notes} onDelete={fetchCompletedNotes} />
      </div>
    </div>
  );
} 