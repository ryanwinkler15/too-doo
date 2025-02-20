'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { CreateNoteDialog } from "@/components/custom/CreateNoteDialog";
import { NoteGrid } from "@/components/custom/NoteGrid";
import { getSupabaseClient } from '@/lib/supabase-client';
import { Plus, Star, AlignJustify, LayoutGrid, ListFilter } from "lucide-react";
import { Note } from "@/lib/types";
import Link from "next/link";
import { OrganizeMenu } from "@/components/custom/OrganizeMenu";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/navigation";
import { StreakDisplay } from "@/components/custom/StreakDisplay";
import { motion } from "framer-motion";
import { LabelView } from "@/components/custom/LabelView";
import dynamic from 'next/dynamic';

// Function to get stored view mode
const getStoredViewMode = (): 'task' | 'label' => {
  if (typeof window === 'undefined') return 'task';
  try {
    const storedViewMode = window.localStorage.getItem('viewMode');
    return (storedViewMode === 'task' || storedViewMode === 'label') ? storedViewMode : 'task';
  } catch (e) {
    return 'task';
  }
};

// Create a client-side only ViewContent component
const ViewContent = dynamic(() => Promise.resolve(({ 
  viewMode, 
  notes, 
  onDelete, 
  isSelectionMode, 
  onExitSelectionMode, 
  onPriorityChange 
}: { 
  viewMode: 'task' | 'label';
  notes: Note[];
  onDelete: () => void;
  isSelectionMode: boolean;
  onExitSelectionMode: () => void;
  onPriorityChange: () => void;
}) => {
  return viewMode === 'task' ? (
    <NoteGrid 
      notes={notes} 
      onDelete={onDelete} 
      isSelectionMode={isSelectionMode} 
      onExitSelectionMode={onExitSelectionMode}
      onPriorityChange={onPriorityChange}
    />
  ) : (
    <LabelView
      notes={notes}
      onDelete={onDelete}
    />
  );
}), { ssr: false });

// Create a client-side only ViewToggle component
const ViewToggle = dynamic(() => Promise.resolve(({ viewMode, setViewMode }: { viewMode: 'task' | 'label', setViewMode: (mode: 'task' | 'label') => void }) => {
  // Initialize from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('viewMode');
    if (savedViewMode === 'task' || savedViewMode === 'label') {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  return (
    <div className="relative">
      <div className="relative rounded-full border border-border bg-background px-1.5 py-1.5 shadow-lg dark:shadow-[0_20px_35px_-20px_rgba(255,255,255,0.1)]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('task')}
            className={cn(
              "relative rounded-full px-3 py-1.5 text-sm font-bold outline-2 outline-sky-400 transition focus-visible:outline",
              "text-black dark:text-foreground hover:text-black dark:hover:text-foreground"
            )}
            style={{
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {viewMode === 'task' && (
              <motion.div
                layoutId="view-toggle-bubble"
                className="absolute inset-0 bg-primary/10 dark:bg-primary/20 border-border"
                style={{ borderRadius: 9999 }}
                transition={{
                  type: "spring",
                  bounce: 0.2,
                  duration: 0.6,
                }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Task View
            </span>
          </button>
          <button
            onClick={() => setViewMode('label')}
            className={cn(
              "relative rounded-full px-3 py-1.5 text-sm font-bold outline-2 outline-sky-400 transition focus-visible:outline",
              "text-black dark:text-foreground hover:text-black dark:hover:text-foreground"
            )}
            style={{
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {viewMode === 'label' && (
              <motion.div
                layoutId="view-toggle-bubble"
                className="absolute inset-0 bg-primary/10 dark:bg-primary/20 border-border"
                style={{ borderRadius: 9999 }}
                transition={{
                  type: "spring",
                  bounce: 0.2,
                  duration: 0.6,
                }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <ListFilter className="w-4 h-4" />
              Label View
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}), { ssr: false });

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showPriorityOnly, setShowPriorityOnly] = useState(false);
  const [sortByDueDate, setSortByDueDate] = useState(false);
  const [activeTab, setActiveTab] = useState("Active");
  const [viewMode, setViewMode] = useState<'task' | 'label'>(getStoredViewMode);
  const supabase = getSupabaseClient();

  // Save viewMode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

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
          is_list,
          position,
          created_at,
          label:label_id (
            id,
            name,
            color,
            position
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
      } else if (viewMode === 'label') {
        // When in label view, first get labels ordered by position
        const { data: labels, error: labelError } = await supabase
          .from('labels')
          .select('id, position')
          .order('position', { ascending: true });
          
        if (labelError) throw labelError;
        
        // Then order notes within each label
        query = query
          .order('is_priority', { ascending: false }) // Priority notes first
          .order('position', { ascending: true }); // Then by position
      } else {
        // Default sorting for task view: Priority first, then by due date
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
    <div className="min-h-screen bg-background text-foreground p-4">
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
      <div className="mb-1 ml-2 mt-12">
        <StreakDisplay size="sm" />
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-4">
        {/* Empty left space to balance layout */}
        <div className="w-[200px]"></div>

        {/* View Toggle - Centered */}
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />

        {/* Action Buttons - Right */}
        <div className="flex gap-4 w-[200px] justify-end">
          <Button 
            variant="outline" 
            onClick={() => setIsCreating(true)}
            className="bg-background border border-border text-foreground hover:text-foreground rounded-full px-6 py-2 font-bold text-sm shadow-lg"
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
              "bg-background border border-border rounded-full px-6 py-2 font-bold text-sm shadow-lg",
              isSelectionMode 
                ? "text-foreground" 
                : "text-foreground hover:text-foreground"
            )}
          >
            <Star className="w-4 h-4 mr-2" />
            {isSelectionMode ? "Finalize" : "Prioritize"}
          </Button>
        </div>
      </div>
      
      {/* Note Grid */}
      <ViewContent 
        viewMode={viewMode}
        notes={notes}
        onDelete={fetchNotes}
        isSelectionMode={isSelectionMode}
        onExitSelectionMode={handleExitSelectionMode}
        onPriorityChange={fetchNotes}
      />
    </div>
  );
}
