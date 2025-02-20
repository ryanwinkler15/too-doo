'use client';

import { Note, Label } from "@/lib/types";
import { LabelCard } from "./LabelCard";
import { cn } from "@/lib/utils";

interface LabelViewProps {
  notes: Note[];
  onDelete?: () => void;
  className?: string;
}

export function LabelView({ notes, onDelete, className }: LabelViewProps) {
  // Group notes by label
  const groupedNotes = notes.reduce((acc, note) => {
    const labelName = note.label?.name || 'Uncategorized';
    if (!acc[labelName]) {
      acc[labelName] = {
        label: note.label || null,
        notes: []
      };
    }
    acc[labelName].notes.push(note);
    return acc;
  }, {} as Record<string, { label: Label | null, notes: Note[] }>);

  // Convert to array and sort
  const labelGroups = Object.entries(groupedNotes)
    .map(([name, group]) => ({
      name,
      ...group
    }))
    .sort((a, b) => {
      // Put Uncategorized at the end
      if (a.name === 'Uncategorized') return 1;
      if (b.name === 'Uncategorized') return -1;
      return a.name.localeCompare(b.name);
    });

  return (
    <div 
      className={cn(
        "w-full overflow-x-auto scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent pb-4",
        className
      )}
    >
      <div className="flex gap-6 min-w-max px-4">
        {labelGroups.map((group) => (
          <LabelCard
            key={group.name}
            label={group.label}
            notes={group.notes}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
} 