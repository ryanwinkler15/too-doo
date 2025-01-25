'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { CreateNoteDialog } from "@/components/custom/CreateNoteDialog";
import { NoteGrid } from "@/components/custom/NoteGrid";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Note {
  id: string;
  title: string;
  description: string;
  label_id?: string;
  due_date?: string;
  label?: {
    name: string;
    color: string;
  };
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const supabase = createClientComponentClient();

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        label:label_id (
          name,
          color
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return;
    }

    if (data) {
      setNotes(data);
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
