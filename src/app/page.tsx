'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { CreateNoteDialog } from "@/components/custom/CreateNoteDialog";
import { NoteGrid } from "@/components/custom/NoteGrid";
import { getSupabaseClient } from '@/lib/supabase-client';
import { Plus, Star, AlignJustify } from "lucide-react";
import { Note } from "@/lib/types";
import Link from "next/link";
import { OrganizeMenu } from "@/components/custom/OrganizeMenu";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/navigation";
import { StreakDisplay } from "@/components/custom/StreakDisplay";

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showPriorityOnly, setShowPriorityOnly] = useState(false);
  const [sortByDueDate, setSortByDueDate] = useState(false);
  const [activeTab, setActiveTab] = useState("Active");
  const supabase = getSupabaseClient();

  const fetchNotes = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

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
        .eq('is_completed', false)
        .eq('user_id', user.id); // Only fetch user's notes

      // Add label filter if selected
      if (selectedLabelId) {
        query = query.eq('label_id', selectedLabelId);
      }

      // Add priority filter if enabled
      if (showPriorityOnly) {
        query = query.eq('is_priority', true);
      }

      // Sort by due date if enabled
      if (sortByDueDate) {
        query = query.order('due_date', { ascending: true, nullsFirst: false });
      } else {
        // Default sorting: Priority first, then chronological within each group
        query = query
          .order('is_priority', { ascending: false }) // Priority notes first
          .order('due_date', { ascending: true, nullsFirst: false }); // Then by due date
      }

      const { data: rawData, error } = await query;

      if (error) throw error;

      if (rawData) {
        const transformedData = rawData.map(note => ({
          ...note,
          label: Array.isArray(note.label) ? note.label[0] : note.label
        }));
        setNotes(transformedData);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
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
      <CreateNoteDialog 
        onNoteCreated={fetchNotes} 
        isOpen={isCreating}
        onOpenChange={setIsCreating}
      />
      
      {/* Top Navigation Bar */}
      <div className="mb-8">
        <NavBar 
          items={navItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          className="relative"
        />
      </div>
      
      {/* Streak Display */}
      <div className="mb-4 ml-2">
        <StreakDisplay size="sm" />
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end mb-8">
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={() => setIsCreating(true)}
            className="bg-[#0A0A0A] border border-[#1A1A1A] text-white hover:text-white rounded-full px-6 py-2 font-bold text-sm shadow-lg ring-1 ring-white/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
          <OrganizeMenu 
            onLabelSelect={handleLabelSelect} 
            onPriorityFilter={handlePriorityFilter}
            onDueDateSort={handleDueDateSort}
            showPriorityOnly={showPriorityOnly}
            sortByDueDate={sortByDueDate}
          />
          <Button 
            variant="outline" 
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            className={cn(
              "bg-[#0A0A0A] border border-[#1A1A1A] rounded-full px-6 py-2 font-bold text-sm shadow-lg ring-1 ring-white/20",
              isSelectionMode 
                ? "text-white" 
                : "text-white hover:text-white"
            )}
          >
            <Star className="w-4 h-4 mr-2" />
            {isSelectionMode ? "Finalize" : "Prioritize"}
          </Button>
        </div>
      </div>
      
      {/* Note Grid */}
      <NoteGrid 
        notes={notes} 
        onDelete={fetchNotes} 
        isSelectionMode={isSelectionMode} 
        onExitSelectionMode={handleExitSelectionMode}
      />
    </div>
  );
}
