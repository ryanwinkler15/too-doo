'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { CreateNoteDialog } from "@/components/custom/CreateNoteDialog";
import { NoteGrid } from "@/components/custom/NoteGrid";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Plus } from "lucide-react";
import { Note } from "@/lib/types";
import Link from "next/link";
import { OrganizeMenu } from "@/components/custom/OrganizeMenu";

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showPriorityOnly, setShowPriorityOnly] = useState(false);
  const [sortByDueDate, setSortByDueDate] = useState(false);
  const supabase = createClientComponentClient();

  const fetchNotes = async () => {
    let query = supabase
      .from('notes')
      .select(`
        id,
        title,
        description,
        due_date,
        is_priority,
        label:label_id (
          id,
          name,
          color
        )
      `)
      .eq('is_completed', false);

    // Add label filter if selected
    if (selectedLabelId) {
      query = query.eq('label_id', selectedLabelId);
    }

    // Add priority filter if enabled
    if (showPriorityOnly) {
      query = query.eq('is_priority', true);
    }

    // Sort by due date if enabled, otherwise by created_at
    if (sortByDueDate) {
      query = query.order('due_date', { ascending: true, nullsFirst: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: rawData, error } = await query;

    if (error) {
      console.error('Error fetching notes:', error);
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
    fetchNotes();
  }, [selectedLabelId, showPriorityOnly, sortByDueDate]); // Re-fetch when filters or sort change

  const handleLabelSelect = (labelId: string) => {
    setSelectedLabelId(labelId === selectedLabelId ? null : labelId);
  };

  const handlePriorityFilter = () => {
    setShowPriorityOnly(!showPriorityOnly);
  };

  const handleDueDateSort = () => {
    setSortByDueDate(!sortByDueDate);
  };

  const handleExitSelectionMode = () => {
    setIsSelectionMode(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      {/* Title */}
      <h1 className="text-4xl font-bold text-center mb-8">Do it all</h1>
      
      {/* Header Bar */}
      <div className="flex justify-between items-center mb-8">
        {/* Left side - View Toggle */}
        <div className="space-x-2">
          <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
            Active
          </Button>
          <Link href="/completed">
            <Button variant="outline" className="bg-slate-800 text-white hover:bg-slate-700">
              Completed
            </Button>
          </Link>
        </div>
        
        {/* Right side - Action Buttons */}
        <div className="space-x-2">
          <div className="flex gap-4">
            <CreateNoteDialog onNoteCreated={fetchNotes} />
            <OrganizeMenu 
              onLabelSelect={handleLabelSelect} 
              onPriorityFilter={handlePriorityFilter}
              onDueDateSort={handleDueDateSort}
              showPriorityOnly={showPriorityOnly}
              sortByDueDate={sortByDueDate}
            />
            <Button 
              variant="outline" 
              className={`${isSelectionMode ? "bg-green-500 hover:bg-green-600" : "bg-slate-800 hover:bg-slate-700"} text-white`}
              onClick={() => setIsSelectionMode(!isSelectionMode)}
            >
              {isSelectionMode ? "Finalize" : "Prioritize"}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content Area - Note Grid */}
      <div className="px-4">
        <NoteGrid 
          notes={notes} 
          onDelete={fetchNotes} 
          isSelectionMode={isSelectionMode}
          onExitSelectionMode={handleExitSelectionMode}
          onPriorityChange={fetchNotes}
        />
      </div>
    </div>
  );
}
