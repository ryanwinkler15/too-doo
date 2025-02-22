'use client';

import { Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Square, CheckSquare, GripVertical, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from "@/hooks/use-toast";
import { CollapsibleListNote } from "./CollapsibleListNote";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CreateNoteDialog } from "./CreateNoteDialog";

interface LabelCardProps {
  label: {
    id?: string;
    name: string;
    color: string;
  } | null;
  notes: Note[];
  onDelete?: () => void;
  onLineItemDragStart?: () => void;
  onLineItemDragEnd?: () => void;
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
  const [isEditing, setIsEditing] = useState(false);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Format the due date if it exists
  const formattedDueDate = note.due_date ? format(new Date(note.due_date), "MM/dd") : null;

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', note.id);
        
      if (error) throw error;
      
      onDelete?.();
      toast({
        description: "Note deleted successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div 
        ref={setNodeRef}
        style={style}
        className="flex items-start gap-3 pt-2 pb-1 px-4 hover:bg-black/5 dark:hover:bg-white/5 group transition-colors duration-200"
      >
        <div {...attributes} {...listeners} className="flex-shrink-0 cursor-grab active:cursor-grabbing mt-3.5">
          <GripVertical className="w-4 h-4 text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80" />
        </div>
        <button
          onClick={() => onComplete(note.id)}
          className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 rounded hover:opacity-80 mt-3.5"
        >
          <Square className="w-4 h-4 text-black dark:text-white" />
        </button>
        <div className="flex-1 min-w-0 flex justify-between items-start gap-4 relative min-h-[52px]">
          <div className="flex-1 min-w-0">
            {note.is_list ? (
              <CollapsibleListNote
                id={note.id}
                title={note.title}
                items={JSON.parse(note.description)}
                onUpdate={onDelete}
              />
            ) : (
              <div className="flex flex-col justify-start h-full pt-2">
                <span className="text-base text-black dark:text-white break-words leading-normal">
                  {note.title}
                </span>
                {note.description && (
                  <p className="text-sm text-black/70 dark:text-white/70 break-words whitespace-pre-wrap mt-1.5">
                    {note.description}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end h-full">
            {formattedDueDate && (
              <div className="flex-shrink-0">
                <div className="px-2 py-1 rounded-full bg-black/10 dark:bg-white/10 text-xs font-medium text-black dark:text-white">
                  {formattedDueDate}
                </div>
              </div>
            )}
            <div 
              className="flex items-center gap-1 absolute bottom-0 right-0 opacity-0 translate-x-4 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-x-0"
            >
              <button
                onClick={() => setIsEditing(true)}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <Pencil className="w-4 h-4 text-black dark:text-white" />
              </button>
              <button
                onClick={handleDelete}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-black dark:text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <CreateNoteDialog
        mode="edit"
        noteToEdit={{
          id: note.id,
          title: note.title,
          description: note.description,
          label_id: note.label?.id,
          due_date: note.due_date,
          is_list: note.is_list,
          label: note.label ? {
            name: note.label.name,
            color: note.label.color
          } : undefined
        }}
        onNoteCreated={() => {
          onDelete?.(); // This will trigger a refresh of the notes list
          setIsEditing(false);
        }}
        isOpen={isEditing}
        onOpenChange={(open: boolean) => {
          setIsEditing(open);
          if (!open) {
            onDelete?.(); // Refresh when dialog is closed
          }
        }}
      />
    </>
  );
}

export function LabelCard({ 
  label, 
  notes: initialNotes, 
  onDelete,
  onLineItemDragStart,
  onLineItemDragEnd 
}: LabelCardProps) {
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  // Keep a local copy of notes for optimistic updates
  const [notes, setNotes] = useState(initialNotes);

  // Update local notes when prop changes
  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = () => {
    onLineItemDragStart?.();
  };

  const handleDragEnd = async (event: any) => {
    onLineItemDragEnd?.();
    
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = notes.findIndex(note => note.id === active.id);
      const newIndex = notes.findIndex(note => note.id === over.id);
      
      // Optimistically update the UI
      const newNotes = [...notes];
      const [movedItem] = newNotes.splice(oldIndex, 1);
      newNotes.splice(newIndex, 0, movedItem);
      setNotes(newNotes);
      
      try {
        // Get all notes that need position updates
        const start = Math.min(oldIndex, newIndex);
        const end = Math.max(oldIndex, newIndex);
        const affectedNotes = newNotes.slice(start, end + 1);
        
        // Update all affected notes with their new positions
        const updates = affectedNotes.map((note, i) => 
          supabase
            .from('notes')
            .update({ position: start + i + 1 })
            .eq('id', note.id)
        );
        
        // Wait for all updates to complete
        await Promise.all(updates);
        
        // Only refresh the full list after all updates are done
        onDelete?.();
      } catch (error) {
        // If there's an error, revert the optimistic update
        setNotes(initialNotes);
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
      className="w-[465px] shrink-0 rounded-xl overflow-hidden"
      style={{
        backgroundColor: label?.color || 'rgb(30 41 59)',
      }}
    >
      {/* Label Header */}
      <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10 cursor-grab active:cursor-grabbing">
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
      <div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
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
      </div>
      {/* Bottom Padding */}
      <div className="h-4" />
    </div>
  );
} 