'use client';

import { Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NoteCard } from "./NoteCard";

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
  return (
    <div className="w-[calc(33.333% - 16px)] min-w-[400px] bg-card/30 rounded-xl p-4">
      {/* Label Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full" 
            style={{ backgroundColor: label?.color || '#94a3b8' }}
          />
          <h3 className="text-lg font-semibold">
            {label?.name || 'Uncategorized'}
          </h3>
        </div>
        <div className="text-sm text-foreground/60">
          {notes.length} {notes.length === 1 ? 'task' : 'tasks'}
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-4">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            {...note}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
} 