'use client';

import { Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Square, CheckSquare, GripVertical } from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from "@/hooks/use-toast";
import { CollapsibleListNote } from "./CollapsibleListNote";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

interface LabelCardProps {
  label: {
    id?: string;
    name: string;
    color: string;
  } | null;
  notes: Note[];
  onDelete?: () => void;
}

// SortableNote component for individual notes
function SortableNote({ note, onComplete, onDelete }: { note: Note, onComplete: (id: string) => void, onDelete?: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 py-2 px-4 hover:bg-black/5 dark:hover:bg-white/5 group"
    >
      <div {...attributes} {...listeners} className="flex-shrink-0 cursor-grab active:cursor-grabbing mt-[14px]">
        <GripVertical className="w-4 h-4 text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80" />
      </div>
      <button
        onClick={() => onComplete(note.id)}
        className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 rounded hover:opacity-80 mt-[14px]"
      >
        <Square className="w-4 h-4 text-black dark:text-white" />
      </button>
      <div className="flex-1 min-w-0">
        {note.is_list ? (
          <CollapsibleListNote
            id={note.id}
            title={note.title}
            items={JSON.parse(note.description)}
            onUpdate={onDelete}
          />
        ) : (
          <div className="flex flex-col justify-center min-h-[44px]">
            <span className="text-base text-black dark:text-white break-words">
              {note.title}
            </span>
            {note.description && (
              <p className="text-sm text-black/70 dark:text-white/70 break-words whitespace-pre-wrap mt-1">
                {note.description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function LabelCard({ label, notes: initialNotes, onDelete }: LabelCardProps) {
  const [notes, setNotes] = useState(initialNotes);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = notes.findIndex(note => note.id === active.id);
      const newIndex = notes.findIndex(note => note.id === over.id);
      
      const newNotes = [...notes];
      const [movedNote] = newNotes.splice(oldIndex, 1);
      newNotes.splice(newIndex, 0, movedNote);
      
      setNotes(newNotes);

      // Update the order in the database
      try {
        // Here you would typically update the order in your database
        // For now, we'll just show a success toast
        toast({
          description: "Note order updated",
          variant: "default"
        });
      } catch (error) {
        console.error('Error updating note order:', error);
        toast({
          title: "Error",
          description: "Failed to update note order",
          variant: "destructive"
        });
      }
    }
  };

  const handleComplete = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ 
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', noteId);
        
      if (error) throw error;
      
      onDelete?.();
      toast({
        description: "Note marked as completed",
        variant: "default"
      });
    } catch (error) {
      console.error('Error completing note:', error);
      toast({
        title: "Error",
        description: "Failed to complete note",
        variant: "destructive"
      });
    }
  };

  return (
    <div 
      className="w-[450px] shrink-0 rounded-xl overflow-hidden"
      style={{
        backgroundColor: label?.color || 'rgb(30 41 59)',
      }}
    >
      {/* Label Header */}
      <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-black dark:text-white break-words">
            {label?.name || 'Uncategorized'}
          </h3>
        </div>
        <div className="text-sm text-black/60 dark:text-white/60 flex-shrink-0 ml-4">
          {notes.length} {notes.length === 1 ? 'task' : 'tasks'}
        </div>
      </div>

      {/* Notes List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={notes.map(note => note.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="divide-y divide-black/10 dark:divide-white/10">
            {notes.map((note) => (
              <SortableNote
                key={note.id}
                note={note}
                onComplete={handleComplete}
                onDelete={onDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {/* Bottom Padding */}
      <div className="h-4" />
    </div>
  );
} 