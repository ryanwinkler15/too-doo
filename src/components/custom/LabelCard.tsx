'use client';

import { Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Square, CheckSquare } from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from "@/hooks/use-toast";
import { CollapsibleListNote } from "./CollapsibleListNote";

interface LabelCardProps {
  label: {
    id?: string;
    name: string;
    color: string;
  } | null;
  notes: Note[];
  onDelete?: () => void;
}

export function LabelCard({ label, notes, onDelete }: LabelCardProps) {
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  // Function to get background color with opacity
  const getBackgroundColor = (hexColor: string) => {
    return `${hexColor}26`; // 26 is hex for 15% opacity - making it more visible
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
      <div className="divide-y divide-black/10 dark:divide-white/10">
        {notes.map((note) => (
          note.is_list ? (
            // Render list notes with CollapsibleListNote
            <div key={note.id} className="flex items-start gap-3 group">
              <button
                onClick={() => handleComplete(note.id)}
                className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 rounded hover:opacity-80 mt-[14px] ml-4"
              >
                <Square className="w-4 h-4 text-black dark:text-white" />
              </button>
              <div className="flex-1">
                <CollapsibleListNote
                  id={note.id}
                  title={note.title}
                  items={JSON.parse(note.description)}
                  onUpdate={onDelete}
                />
              </div>
            </div>
          ) : (
            // Render regular notes as single line items
            <div 
              key={note.id}
              className="flex items-start gap-3 py-2 px-4 hover:bg-black/5 dark:hover:bg-white/5 group"
            >
              <button
                onClick={() => handleComplete(note.id)}
                className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 rounded hover:opacity-80 mt-0.5"
              >
                <Square className="w-4 h-4 text-black dark:text-white" />
              </button>
              <div className="flex-1 min-w-0">
                <h4 className="text-base text-black dark:text-white break-words">
                  {note.title}
                </h4>
                {note.description && (
                  <p className="text-sm text-black/70 dark:text-white/70 break-words whitespace-pre-wrap">
                    {note.description}
                  </p>
                )}
              </div>
            </div>
          )
        ))}
      </div>
      {/* Bottom Padding */}
      <div className="h-4" />
    </div>
  );
} 