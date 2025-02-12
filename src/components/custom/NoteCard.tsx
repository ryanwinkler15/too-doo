import { Check, Pencil, Trash2, Square, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from "@/hooks/use-toast";
import { CreateNoteDialog } from "@/components/custom/CreateNoteDialog";
import { Note } from "@/lib/types";
import Image from "next/image";

// Utility function to darken a hex color
function darkenColor(hex: string, percent: number) {
  // Remove the # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Darken each component
  const darkenAmount = 1 - (percent / 100);
  const dr = Math.floor(r * darkenAmount);
  const dg = Math.floor(g * darkenAmount);
  const db = Math.floor(b * darkenAmount);
  
  // Convert back to hex
  const darkenHex = '#' + 
    (dr | 1 << 8).toString(16).slice(1) +
    (dg | 1 << 8).toString(16).slice(1) +
    (db | 1 << 8).toString(16).slice(1);
    
  return darkenHex;
}

interface NoteCardProps {
  id: string;
  title: string;
  description: string;
  className?: string;
  label?: Note['label'];
  dueDate?: string;
  onDelete?: () => void;
  isPriority?: boolean;
  is_list?: boolean;
}

export function NoteCard({ id, title, description, className, label, dueDate, onDelete, isPriority = false, is_list = false }: NoteCardProps) {
  const supabase = createClientComponentClient();
  const [isDeleted, setIsDeleted] = useState(false);
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [listItems, setListItems] = useState<Array<{ text: string; isCompleted: boolean }>>([]);

  useEffect(() => {
    if (is_list && description) {
      try {
        const parsedItems = JSON.parse(description);
        setListItems(parsedItems);
      } catch (error) {
        console.error('Error parsing list items:', error);
        setListItems([]);
      }
    }
  }, [is_list, description]);

  // Log props when component receives them
  useEffect(() => {
    console.log('NoteCard received props:', {
      id,
      title,
      description,
      label: label ? {
        id: label.id,
        name: label.name,
        color: label.color
      } : 'no label',
      dueDate
    });
  }, [id, title, description, label, dueDate]);

  // Default colors if no label is present
  const defaultBg = "bg-slate-900";
  const defaultBorder = "border-slate-800";

  // Generate theme colors if label exists
  const cardStyle = label ? {
    background: `${label.color}F2`, // 95% opacity
    border: `1px solid ${label.color}`,
    hoverBg: `${label.color}F5` // Slightly more opaque on hover
  } : null;

  const handleDelete = async () => {
    const { dismiss } = toast({
      title: "Delete Note",
      description: "Are you sure you want to delete this note?",
      action: (
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            autoFocus
            onClick={async () => {
              try {
                const { error } = await supabase
                  .from('notes')
                  .delete()
                  .eq('id', id);
                  
                if (error) throw error;
                
                setIsDeleted(true);
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
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.click();
              }
            }}
          >
            Delete
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => dismiss()}
          >
            Cancel
          </Button>
        </div>
      ),
      duration: 5000,
    });
  };

  const handleComplete = async () => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ 
          is_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) throw error;
      
      onDelete?.(); // Refresh the notes list
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

  const handleToggleListItem = async (index: number) => {
    try {
      const updatedItems = [...listItems];
      updatedItems[index].isCompleted = !updatedItems[index].isCompleted;
      setListItems(updatedItems);

      const { error } = await supabase
        .from('notes')
        .update({ 
          description: JSON.stringify(updatedItems)
        })
        .eq('id', id);

      if (error) throw error;
      
      // Refresh the notes list after successful update
      onDelete?.();
    } catch (error) {
      console.error('Error updating list item:', error);
      toast({
        title: "Error",
        description: "Failed to update list item",
        variant: "destructive"
      });
    }
  };

  if (isDeleted) return null;

  return (
    <>
      <div
        className={cn(
          "group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-xl h-[200px]",
          cardStyle ? "" : defaultBg,
          cardStyle ? "" : defaultBorder,
          "transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]",
          className
        )}
        style={cardStyle ? {
          backgroundColor: cardStyle.background,
          borderColor: cardStyle.border
        } : undefined}
      >
        <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-4 h-full transition-all duration-300 group-hover:-translate-y-10">
          {/* Priority Icon */}
          {isPriority && (
            <div className="absolute top-4 right-5">
              <Image
                src="/clock-icon.png"
                alt="Priority"
                width={36}
                height={36}
                className="opacity-90"
              />
            </div>
          )}
          
          {/* Label and Due Date Row */}
          <div className="flex items-start gap-2 mb-1">
            {label && (
              <div
                className="inline-flex h-6 items-center px-2 rounded-full text-sm font-medium text-white border border-white/30"
                style={{ backgroundColor: darkenColor(label.color, 15) }}
              >
                {label.name}
              </div>
            )}
            {dueDate && (
              <div className="inline-flex h-6 items-center px-2 rounded-full text-sm font-medium bg-black/30 text-white border border-white/20">
                {format(new Date(dueDate), "MM/dd/yy")}
              </div>
            )}
          </div>

          <h3 className="text-xl font-semibold text-white mb-1">
            {title}
          </h3>
          <div className="relative flex-grow overflow-hidden pointer-events-auto">
            {is_list ? (
              <div className="text-white text-opacity-90 overflow-y-hidden group-hover:overflow-y-auto overflow-x-hidden absolute inset-0 pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/90 [&::-webkit-scrollbar-track]:bg-transparent">
                {(() => {
                  try {
                    const items = JSON.parse(description);
                    return items.map((item: { text: string; isCompleted: boolean }, index: number) => (
                      <div key={index} className="flex items-center gap-2 mb-2 group/item">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleListItem(index);
                          }}
                          className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white/20 rounded hover:opacity-80"
                        >
                          {item.isCompleted ? (
                            <CheckSquare className="w-5 h-5 text-white" />
                          ) : (
                            <Square className="w-5 h-5 text-white" />
                          )}
                        </button>
                        <span className={cn(
                          "text-sm break-words flex-1",
                          item.isCompleted && "line-through text-white/50"
                        )}>
                          {item.text}
                        </span>
                      </div>
                    ));
                  } catch (error) {
                    console.error('Error parsing list items:', error);
                    return <p className="text-red-400">Error displaying list items</p>;
                  }
                })()}
                {/* Show completed items count if any */}
                {(() => {
                  try {
                    const items = JSON.parse(description);
                    const completedCount = items.filter((item: { isCompleted: boolean }) => item.isCompleted).length;
                    if (completedCount > 0) {
                      return (
                        <div className="text-sm text-white/50 mt-2 border-t border-white/10 pt-2">
                          {completedCount} completed {completedCount === 1 ? 'item' : 'items'}
                        </div>
                      );
                    }
                  } catch (error) {
                    // Silently handle parsing error
                  }
                  return null;
                })()}
              </div>
            ) : (
              <p className="text-white text-opacity-90 whitespace-pre-line overflow-y-hidden group-hover:overflow-y-auto overflow-x-hidden absolute inset-0 pr-2 break-words [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/90 [&::-webkit-scrollbar-track]:bg-transparent">
                {description}
              </p>
            )}
          </div>
        </div>

        <div
          className={cn(
            "pointer-events-none absolute bottom-0 flex w-full justify-between items-center px-3 py-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100",
            "transform-gpu translate-y-10"
          )}
        >
          {/* Left side - Complete button */}
          <div 
              onClick={handleComplete}
            className="pointer-events-auto cursor-pointer rounded-lg p-2 transition-colors hover:bg-white/10"
            >
            <Check className="w-5 h-5" strokeWidth={2} />
          </div>

          {/* Right side - Edit and Delete buttons */}
          <div className="flex gap-2">
            <button 
              onClick={() => {
                console.log('Raw label data:', label);
                console.log('Editing note:', {
                  title,
                  description,
                  label_id: label?.id,
                  label_name: label?.name,
                  label_color: label?.color,
                  dueDate
                });
                setIsEditing(true);
              }}
              className="pointer-events-auto cursor-pointer rounded-lg p-2 transition-colors hover:bg-white/10"
            >
              <Pencil className="w-5 h-5" strokeWidth={2} />
            </button>
            <button 
              onClick={handleDelete}
              className="pointer-events-auto cursor-pointer rounded-lg p-2 transition-colors hover:bg-white/10"
            >
              <Trash2 className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>

        </div>
        <div 
          className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300"
          style={cardStyle ? {
            backgroundColor: "transparent",
            ["--hover-bg" as any]: cardStyle.hoverBg
          } : undefined}
        />
      </div>

      {/* Edit Dialog */}
      <CreateNoteDialog
        mode="edit"
        noteToEdit={{
          id,
          title,
          description,
          label_id: label?.id,
          due_date: dueDate,
          label: label ? {
            name: label.name,
            color: label.color
          } : undefined
        }}
        onNoteCreated={() => {
          console.log('Note updated, refreshing...');
          onDelete?.(); // This will trigger a refresh of the notes list
          setIsEditing(false);
        }}
        isOpen={isEditing}
        onOpenChange={(open) => {
          setIsEditing(open);
          if (!open) {
            onDelete?.(); // Refresh when dialog is closed
          }
        }}
      />
    </>
  );
} 