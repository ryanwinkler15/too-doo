'use client';

import { Note, Label } from "@/lib/types";
import { LabelCard } from "./LabelCard";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";

interface LabelViewProps {
  notes: Note[];
  onDelete?: () => void;
  className?: string;
}

interface LabelGroup {
  name: string;
  label: Label | null;
  notes: Note[];
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

  // Convert to array and sort initially
  const initialGroups = Object.entries(groupedNotes)
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

  // State for maintaining order
  const [labelGroups, setLabelGroups] = useState<LabelGroup[]>(initialGroups);

  return (
    <div 
      className={cn(
        "w-full overflow-x-auto scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent pb-4",
        className
      )}
    >
      <Reorder.Group 
        axis="x" 
        values={labelGroups} 
        onReorder={setLabelGroups}
        className="flex items-start gap-6 min-w-max px-4"
      >
        <AnimatePresence>
          {labelGroups.map((group) => (
            <Reorder.Item
              key={group.name}
              value={group}
              dragListener={true}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.1}
              className="cursor-grab active:cursor-grabbing"
              whileDrag={{
                scale: 1.05,
                boxShadow: "0 5px 15px rgba(0,0,0,0.25)",
                zIndex: 1
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
            >
              <LabelCard
                label={group.label}
                notes={group.notes}
                onDelete={onDelete}
              />
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  );
} 