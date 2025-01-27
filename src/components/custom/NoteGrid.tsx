import { NoteCard } from "@/components/custom/NoteCard";
import { Note } from "@/lib/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState } from "react";

interface NoteGridProps {
  notes: Note[];
  onDelete?: () => void;
  isSelectionMode?: boolean;
}

export function NoteGrid({ notes, onDelete, isSelectionMode = false }: NoteGridProps) {
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const supabase = createClientComponentClient();

  const handleNoteClick = async (noteId: string) => {
    if (!isSelectionMode) return;

    const newSelectedNotes = new Set(selectedNotes);
    if (selectedNotes.has(noteId)) {
      newSelectedNotes.delete(noteId);
      await supabase.from('notes').update({ is_priority: false }).eq('id', noteId);
    } else {
      newSelectedNotes.add(noteId);
      await supabase.from('notes').update({ is_priority: true }).eq('id', noteId);
    }
    setSelectedNotes(newSelectedNotes);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {notes.map((note) => (
        <div 
          key={note.id} 
          className={`${isSelectionMode && !selectedNotes.has(note.id) ? "opacity-50 hover:opacity-100" : ""} transition-opacity cursor-pointer`}
          onClick={() => handleNoteClick(note.id)}
        >
          <NoteCard
            id={note.id}
            title={note.title}
            description={note.description}
            label={note.label || undefined}
            dueDate={note.due_date}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
} 