'use client';

import { Note, Label } from "@/lib/types";
import { LabelCard } from "./LabelCard";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/hooks/use-toast";

interface LabelViewProps {
  notes: Note[];
  onDelete?: () => void;
  className?: string;
}

interface LabelGroup {
  name: string;
  label: Label | null;
  notes: Note[];
  position?: number;
}

export function LabelView({ notes, onDelete, className }: LabelViewProps) {
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [labelGroups, setLabelGroups] = useState<LabelGroup[]>([]);
  const [isDraggingLineItem, setIsDraggingLineItem] = useState(false);
  const [orderedLabelIds, setOrderedLabelIds] = useState<string[]>([]);

  // Update groups when notes change
  useEffect(() => {
    // Group notes by label
    const groupedNotes = notes.reduce((acc, note) => {
      const labelName = note.label?.name || 'Uncategorized';
      if (!acc[labelName]) {
        acc[labelName] = {
          label: note.label || null,
          notes: [],
          position: note.label?.position || 0
        };
      }
      acc[labelName].notes.push(note);
      return acc;
    }, {} as Record<string, { label: Label | null, notes: Note[], position: number }>);

    // Convert to array and sort
    let newGroups = Object.entries(groupedNotes)
      .map(([name, group]) => ({
        name,
        label: group.label,
        position: group.position,
        notes: group.notes.sort((a, b) => {
          if (typeof a.position === 'number' && typeof b.position === 'number') {
            return a.position - b.position;
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
      }))
      .sort((a, b) => {
        // Always put Uncategorized at the end
        if (!a.label) return 1;
        if (!b.label) return -1;

        // Sort by position
        return (a.position || 0) - (b.position || 0);
      });

    setLabelGroups(newGroups);
  }, [notes]);

  // Event handlers for line item drag state
  const handleLineItemDragStart = () => setIsDraggingLineItem(true);
  const handleLineItemDragEnd = () => setIsDraggingLineItem(false);

  // Add handler for label reordering
  const handleLabelReorder = async (newGroups: LabelGroup[]) => {
    // Store current groups for reverting on error
    const currentGroups = [...labelGroups];
    
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Failed to get user');

      // Find the moved label by comparing old and new arrays
      const movedLabelIndex = newGroups.findIndex((group, i) => 
        group.label?.id !== currentGroups[i]?.label?.id
      );
      
      if (movedLabelIndex === -1) return; // No change detected
      
      const movedLabel = newGroups[movedLabelIndex];
      if (!movedLabel.label?.id) return; // Don't process if Uncategorized
      
      // Optimistically update the UI
      setLabelGroups(newGroups);
      
      // Update positions for ALL labels to ensure they stay sequential
      const labelsToUpdate = newGroups
        .filter(group => group.label?.id) // Filter out Uncategorized
        .map((group, index) => ({
          id: group.label!.id,
          name: group.label!.name,
          color: group.label!.color,
          position: index + 1, // Ensure sequential positions starting from 1
          user_id: user.id
        }));
      
      // Update all labels with their new positions
      const updates = labelsToUpdate.map(label => 
        supabase
          .from('labels')
          .update({
            position: label.position,
            name: label.name,
            color: label.color,
            user_id: user.id
          })
          .eq('id', label.id)
      );
      
      // Wait for all updates to complete
      const results = await Promise.all(updates);
      
      // Check if any updates failed
      const updateError = results.find(result => result.error);
      if (updateError) throw updateError.error;

      // Only refresh the full list after all updates are done
      onDelete?.();

    } catch (error) {
      // If there's an error, revert the optimistic update
      setLabelGroups(currentGroups);
      console.error('Error updating label positions:', error);
      toast({
        title: "Error",
        description: "Failed to save label positions",
        variant: "destructive"
      });
    }
  };

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
        onReorder={handleLabelReorder}
        className="flex items-start gap-3 min-w-max px-4"
      >
        <AnimatePresence>
          {labelGroups.map((group) => (
            <Reorder.Item
              key={group.label?.id || 'uncategorized'}
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