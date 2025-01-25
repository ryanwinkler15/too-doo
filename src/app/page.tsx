'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { CreateNoteDialog } from "@/components/custom/CreateNoteDialog";
import { NoteGrid } from "@/components/custom/NoteGrid";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Plus } from "lucide-react";
import { Note } from "@/lib/types";

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const supabase = createClientComponentClient();

  const fetchNotes = async () => {
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return;
    }

    if (rawData) {
      // Transform the data to handle the array of labels
      const transformedData = rawData.map(note => ({
        ...note,
        label: Array.isArray(note.label) ? note.label[0] : note.label
      }));
      setNotes(transformedData);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      {/* Title */}
      <h1 className="text-4xl font-bold text-center mb-8">Do it all</h1>
      
      {/* Header Bar */}
      <div className="flex justify-between items-center mb-8">
        {/* Left side - View Toggle */}
        <div className="space-x-2">
          <Button variant="outline" className="bg-slate-800 text-white hover:bg-slate-700">
            Active
          </Button>
          <Button variant="outline" className="bg-slate-800 text-white hover:bg-slate-700">
            Completed
          </Button>
        </div>
        
        {/* Right side - Action Buttons */}
        <div className="space-x-2">
          <CreateNoteDialog onNoteCreated={fetchNotes} />
          <Button variant="outline" className="bg-slate-800 text-white hover:bg-slate-700">
            Organize
          </Button>
          <Button variant="outline" className="bg-slate-800 text-white hover:bg-slate-700">
            Prioritize
          </Button>
        </div>
      </div>
      
      {/* Main Content Area - Note Grid */}
      <div className="px-4">
        <NoteGrid notes={notes} onDelete={fetchNotes} />
      </div>
    </div>
  );
}
