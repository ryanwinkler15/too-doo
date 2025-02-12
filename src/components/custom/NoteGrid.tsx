import { NoteCard } from "@/components/custom/NoteCard";
import { Note } from "@/lib/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState, useEffect } from "react";

interface NoteGridProps {
  notes: Note[];
  onDelete?: () => void;
  isSelectionMode?: boolean;
  onExitSelectionMode?: () => void;
  onPriorityChange?: () => void;
}

export function NoteGrid({ 
  notes, 
  onDelete, 
  isSelectionMode = false,
  onExitSelectionMode,
  onPriorityChange
}: NoteGridProps) {
  // Track which notes are currently selected in this session
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const supabase = createClientComponentClient();

  // Initialize selected notes from priority status when entering selection mode
  useEffect(() => {
    if (isSelectionMode) {
      const priorityNotes = new Set(
        notes.filter(note => note.is_priority).map(note => note.id)
      );
      setSelectedNotes(priorityNotes);
    } else {
      setSelectedNotes(new Set());
    }
  }, [isSelectionMode, notes]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!isSelectionMode) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        onExitSelectionMode?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelectionMode, onExitSelectionMode]);

  const handleNoteClick = async (noteId: string) => {
    if (!isSelectionMode) return;

    const newSelectedNotes = new Set(selectedNotes);
    const newPriorityStatus = !selectedNotes.has(noteId);

    // Update selection state
    if (newPriorityStatus) {
      newSelectedNotes.add(noteId);
    } else {
      newSelectedNotes.delete(noteId);
    }

    // Update priority in database
    await supabase
      .from('notes')
      .update({ is_priority: newPriorityStatus })
      .eq('id', noteId);
    
    setSelectedNotes(newSelectedNotes);
    
    // Refresh notes data to update UI
    onPriorityChange?.();
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {notes.map((note) => {
        const isSelected = selectedNotes.has(note.id);
        return (
          <div 
            key={note.id} 
            className={`${isSelectionMode && !isSelected ? "opacity-50 hover:opacity-100" : ""} transition-opacity cursor-pointer`}
            onClick={() => handleNoteClick(note.id)}
          >
            <NoteCard
              id={note.id}
              title={note.title}
              description={note.description}
              label={note.label || undefined}
              dueDate={note.due_date}
              onDelete={onDelete}
              isPriority={isSelectionMode ? isSelected : note.is_priority}
              is_list={note.is_list}
            />
          </div>
        );
      })}
    </div>
  );
} 