'use client';

import { useState } from 'react';
import { ChevronDown, Square, CheckSquare } from 'lucide-react';
import { cn } from "@/lib/utils";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from "@/hooks/use-toast";

interface CollapsibleListNoteProps {
  id: string;
  title: string;
  items: Array<{ text: string; isCompleted: boolean }>;
  onUpdate?: () => void;
}

export function CollapsibleListNote({ id, title, items, onUpdate }: CollapsibleListNoteProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const handleToggleItem = async (index: number) => {
    try {
      const updatedItems = [...items];
      updatedItems[index].isCompleted = !updatedItems[index].isCompleted;

      const { error } = await supabase
        .from('notes')
        .update({ 
          description: JSON.stringify(updatedItems)
        })
        .eq('id', id);

      if (error) throw error;
      
      onUpdate?.();

      // Check if all items are completed
      const allCompleted = updatedItems.every(item => item.isCompleted);
      if (allCompleted) {
        const { error: completeError } = await supabase
          .from('notes')
          .update({ 
            is_completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', id);
          
        if (completeError) throw completeError;
        
        onUpdate?.();
        toast({
          description: "All items completed!",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error updating list item:', error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="border-b border-border/10 last:border-b-0">
      {/* Header */}
      <div 
        className="flex items-center justify-between py-2 px-4 cursor-pointer hover:bg-foreground/5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-medium">{title}</span>
        <ChevronDown 
          className={cn(
            "w-5 h-5 transition-transform duration-200",
            isExpanded && "transform rotate-180"
          )} 
        />
      </div>

      {/* Expandable Content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-8 py-2 space-y-2">
          {items.map((item, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 group hover:bg-foreground/5 rounded-lg p-1"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleItem(index);
                }}
                className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-foreground/20 rounded hover:opacity-80"
              >
                {item.isCompleted ? (
                  <CheckSquare className="w-4 h-4 text-foreground" />
                ) : (
                  <Square className="w-4 h-4 text-foreground" />
                )}
              </button>
              <span className={cn(
                "text-sm break-words flex-1",
                item.isCompleted && "line-through text-foreground/50"
              )}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 