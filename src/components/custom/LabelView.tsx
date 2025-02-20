'use client';

import { Note, Label } from "@/lib/types";
import { LabelCard } from "./LabelCard";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
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
  // Move the grouping logic into a useEffect to update when notes change
  const [labelGroups, setLabelGroups] = useState<LabelGroup[]>([]);
  const [isDraggingLineItem, setIsDraggingLineItem] = useState(false);

  // Update groups when notes change
  useEffect(() => {
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
    const newGroups = Object.entries(groupedNotes)
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

    setLabelGroups(newGroups);
  }, [notes]);

  // Event handlers for line item drag state
  const handleLineItemDragStart = () => setIsDraggingLineItem(true);
  const handleLineItemDragEnd = () => setIsDraggingLineItem(false);

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
              className="touch-none"
              dragListener={!isDraggingLineItem}
              whileDrag={{
                scale: 1.02,
                boxShadow: "0 5px 15px rgba(0,0,0,0.25)",
                cursor: "grabbing"
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{
                type: "spring",
                bounce: 0.2,
                duration: 0.6
              }}
            >
              <LabelCard
                label={group.label}
                notes={group.notes}
                onDelete={onDelete}
                onLineItemDragStart={handleLineItemDragStart}
                onLineItemDragEnd={handleLineItemDragEnd}
              />
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  );
} 