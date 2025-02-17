'use client';

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, CheckSquare, Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const colors = [
  { value: '#CB9DF0', label: 'Purple' },
  { value: '#C6E7FF', label: 'Blue' },
  { value: '#FFE6A9', label: 'Yellow' },
  { value: '#ACE1AF', label: 'Green' },
  { value: '#FFB26F', label: 'Orange' },
  { value: '#FFCCEA', label: 'Pink' },
  { value: '#FF8A8A', label: 'Red' },
];

interface SavedLabel {
  id: string;
  name: string;
  color: string;
}

type CommandItemProps = React.ComponentPropsWithoutRef<typeof CommandItem>;
type CommandProps = React.ComponentPropsWithoutRef<typeof Command>;

interface ListItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

interface CreateNoteDialogProps {
  onNoteCreated?: () => void;
  mode?: 'create' | 'edit';
  noteToEdit?: {
    id: string;
    title: string;
    description: string;
    label_id?: string;
    due_date?: string;
    is_list?: boolean;
    label?: {
      name: string;
      color: string;
    };
  };
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface SortableItemProps {
  id: string;
  item: ListItem;
  index: number;
  onChange: (id: string, text: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, id: string) => void;
}

function SortableItem({ id, item, index, onChange, onKeyDown }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 group">
      <div 
        {...attributes} 
        {...listeners}
        className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white/90 transition-colors cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="w-6 h-6 flex items-center justify-center">
        <Plus className="w-4 h-4 text-muted-foreground" />
      </div>
      <Input
        id={`list-item-${item.id}`}
        value={item.text}
        onChange={(e) => onChange(item.id, e.target.value)}
        onKeyDown={(e) => onKeyDown(e, item.id)}
        placeholder={index === 0 ? "List item" : ""}
        className="bg-transparent border-none focus:ring-0 placeholder-muted-foreground"
      />
    </div>
  );
}

export function CreateNoteDialog({ 
  onNoteCreated, 
  mode = 'create', 
  noteToEdit,
  isOpen,
  onOpenChange
}: CreateNoteDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [newLabelTitle, setNewLabelTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(colors[0].value);
  const [savedLabels, setSavedLabels] = useState<SavedLabel[]>([]);
  const [labelPopoverOpen, setLabelPopoverOpen] = useState(false);
  const [selectedLabelId, setSelectedLabelId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableColors, setAvailableColors] = useState<Array<{ value: string; label: string; }>>([]);
  const [isCustomColorDialogOpen, setIsCustomColorDialogOpen] = useState(false);
  const [customColorInput, setCustomColorInput] = useState("");
  const [isListMode, setIsListMode] = useState(false);
  const [listItems, setListItems] = useState<ListItem[]>([{ id: '1', text: '', isCompleted: false }]);
  
  const supabase = createClientComponentClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Effect to handle form state based on mode and dialog open state
  useEffect(() => {
    if (mode === 'edit' && noteToEdit && isOpen) {
      // In edit mode, load the note data
      setTitle(noteToEdit.title);
      setIsListMode(noteToEdit.is_list || false);
      
      if (noteToEdit.is_list) {
        try {
          // Parse the JSON description into list items
          const parsedItems = JSON.parse(noteToEdit.description);
          // Ensure each item has an id
          const itemsWithIds = parsedItems.map((item: any) => ({
            id: String(Math.random()),
            text: item.text,
            isCompleted: item.isCompleted
          }));
          // Add an empty item at the end if all items are filled
          if (itemsWithIds.every((item: any) => item.text.trim() !== '')) {
            itemsWithIds.push({ id: String(Math.random()), text: '', isCompleted: false });
          }
          setListItems(itemsWithIds);
        } catch (error) {
          console.error('Error parsing list items:', error);
          setListItems([{ id: '1', text: '', isCompleted: false }]);
        }
      } else {
        setDescription(noteToEdit.description);
      }
      
      setDate(noteToEdit.due_date ? new Date(noteToEdit.due_date) : undefined);
      setSelectedLabelId(noteToEdit.label_id || "");
    } else if (mode === 'create' && isOpen) {
      // In create mode, reset all fields
      setTitle("");
      setDescription("");
      setDate(undefined);
      setSelectedLabelId("");
      setIsListMode(false);
      setListItems([{ id: '1', text: '', isCompleted: false }]);
    }
  }, [mode, noteToEdit, isOpen]);

  // Single effect to handle both label loading and form initialization
  useEffect(() => {
    async function initialize() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('No user found');

        // Load labels
        const { data: labels, error } = await supabase
          .from('labels')
          .select('*')
          .eq('user_id', user.id) // Only fetch user's labels
          .order('name');
        
        if (error) throw error;

        if (labels) {
          setSavedLabels(labels);
          // If we're in edit mode and have a label_id, find and select that label
          if (mode === 'edit' && noteToEdit?.label_id) {
            const matchingLabel = labels.find(label => label.id === noteToEdit.label_id);
            if (matchingLabel) {
              setSelectedLabelId(matchingLabel.id);
            }
          }
        }
      } catch (error) {
        console.error('Error loading labels:', error);
      }
    }

    initialize();
  }, [mode, noteToEdit, isOpen, supabase]);

  // Add this effect after the initialize effect
  useEffect(() => {
    // Start with preset colors
    const allColors = new Set(colors.map(c => c.value));
    
    // Add unique colors from existing labels
    savedLabels.forEach(label => {
      if (!allColors.has(label.color)) {
        allColors.add(label.color);
      }
    });

    // Convert to array of objects matching the color format
    const colorArray = Array.from(allColors).map(color => ({
      value: color,
      label: colors.find(c => c.value === color)?.label || 'Custom'
    }));

    setAvailableColors(colorArray);
  }, [savedLabels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log('Submit button clicked');

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        toast.error('Authentication error. Please try signing in again.');
        return;
      }

      if (!session) {
        console.error('No active session found');
        toast.error('Please sign in to create notes');
        return;
      }

      if (mode === 'create') {
        // Filter out empty list items before saving
        const filteredListItems = listItems.filter(item => item.text.trim() !== '');
        
        const noteData = {
          title,
          description: isListMode 
            ? JSON.stringify(filteredListItems.map(item => ({
                text: item.text.trim(),
                isCompleted: item.isCompleted
              })))
            : description,
          label_id: selectedLabelId || null,
          due_date: date?.toISOString() || null,
          user_id: session.user.id,
          is_list: isListMode
        };

        console.log('Creating note with data:', noteData);
        
        const { data: newNote, error: insertError } = await supabase
          .from('notes')
          .insert([noteData])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating note:', insertError);
          toast.error(insertError.message);
          return;
        }

        console.log('Note created successfully:', newNote);
        toast.success('Note created!');
        
        // Reset all state
        setTitle("");
        setDescription("");
        setDate(undefined);
        setSelectedLabelId("");
        setIsListMode(false);
        setListItems([{ id: '1', text: '', isCompleted: false }]);
        
        // Close dialog and notify parent
        onNoteCreated?.();
        onOpenChange?.(false);
      } else {
        // Update note
        const filteredListItems = isListMode 
          ? listItems.filter(item => item.text.trim() !== '')
          : [];

        const { error } = await supabase
          .from('notes')
          .update({
            title,
            description: isListMode 
              ? JSON.stringify(filteredListItems.map(item => ({
                  text: item.text.trim(),
                  isCompleted: item.isCompleted
                })))
              : description,
            label_id: selectedLabelId || null,
            due_date: date?.toISOString() || null,
            is_list: isListMode
          })
          .eq('id', noteToEdit?.id)
          .eq('user_id', session.user.id);

        if (error) throw error;

        console.log('Note updated');
        toast.success('Note updated!');
        
        // Clear form and close dialog
        setTitle("");
        setDescription("");
        setDate(undefined);
        setSelectedLabelId("");
        setIsListMode(false);
        setListItems([{ id: '1', text: '', isCompleted: false }]);
        onNoteCreated?.();
        onOpenChange?.(false);
      }

      setError("");
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('An unexpected error occurred. Please try again.');
      setError(`Failed to ${mode === 'create' ? 'create' : 'update'} note. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      const { data: newLabel, error } = await supabase
        .from('labels')
        .insert([
          {
            name: newLabelTitle,
            color: selectedColor,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (newLabel) {
        setSavedLabels([...savedLabels, newLabel]);
        setLabelDialogOpen(false);
        setNewLabelTitle("");
        setSelectedLabelId(newLabel.id);
      }
    } catch (error) {
      console.error('Error creating label:', error);
      setError('Failed to create label. Please try again.');
    }
  };

  const handleCommandSelect = (value: string) => {
    const label = savedLabels.find(l => l.name === value);
    if (label) {
      console.log('Setting selected label:', label);
      setSelectedLabelId(label.id);
      setLabelPopoverOpen(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    onOpenChange?.(open);
    
    // Reset fields when opening in create mode, or when closing in create mode
    if (mode === 'create' && (!open || isOpen === false)) {
      setTitle("");
      setDescription("");
      setDate(undefined);
      setSelectedLabelId("");
      setIsListMode(false);  // Reset list mode
      setListItems([{ id: '1', text: '', isCompleted: false }]);  // Reset to initial list item
    }
  };

  const handleListItemChange = (id: string, text: string) => {
    setListItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item.id === id ? { ...item, text } : item
      );
      
      // If the last item has text, add a new empty item
      if (id === prevItems[prevItems.length - 1].id && text.trim() !== '') {
        return [...updatedItems, { id: String(Date.now()), text: '', isCompleted: false }];
      }
      
      return updatedItems;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newItem = { id: String(Date.now()), text: '', isCompleted: false };
      setListItems(prev => [...prev, newItem]);
      
      // Focus the new input after a brief delay to allow render
      setTimeout(() => {
        const newInput = document.getElementById(`list-item-${newItem.id}`);
        if (newInput) {
          newInput.focus();
        }
      }, 0);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setListItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const newItems = [...items];
        const [movedItem] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, movedItem);
        
        return newItems;
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className={cn(
          "bg-background text-foreground border border-border shadow-lg"
        )}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {mode === 'create' ? 'Create New Note' : 'Edit Note'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                required
                className="bg-background border-border"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="description">Description</Label>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex items-center gap-2 px-2 hover:bg-accent"
                  title="Convert to checklist"
                  onClick={() => setIsListMode(!isListMode)}
                >
                  <span className="text-foreground text-sm">List</span>
                  <CheckSquare className="h-12 w-12 text-foreground" />
                </Button>
              </div>
              
              {isListMode ? (
                <div className="space-y-2 bg-background rounded-md border border-border p-2">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={listItems.map(item => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {listItems.map((item, index) => (
                        <SortableItem
                          key={item.id}
                          id={item.id}
                          item={item}
                          index={index}
                          onChange={handleListItemChange}
                          onKeyDown={handleKeyDown}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              ) : (
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  placeholder="Enter description (optional)"
                  className="bg-background border-border [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/40 [&::-webkit-scrollbar-track]:bg-transparent"
                />
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Label</Label>
              <div className="flex items-start gap-4">
                <Popover open={labelPopoverOpen} onOpenChange={setLabelPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={labelPopoverOpen}
                      className="w-[200px] justify-between bg-background border-border text-left font-normal"
                      tabIndex={0}
                      onClick={() => setLabelPopoverOpen(true)}
                      onFocus={(e) => {
                        // Only open on focus if it was reached via keyboard navigation
                        if (e.relatedTarget) {
                          setLabelPopoverOpen(true);
                        }
                      }}
                    >
                      {selectedLabelId ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: savedLabels.find(
                                label => label.id === selectedLabelId
                              )?.color 
                            }}
                          />
                          <span>
                            {savedLabels.find(label => label.id === selectedLabelId)?.name}
                          </span>
                        </div>
                      ) : (
                        "Select label..."
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0 bg-white dark:bg-background border-border">
                    <Command 
                      className="bg-white dark:bg-background rounded-md border-none [&_div]:bg-white dark:[&_div]:bg-background"
                    >
                      <CommandInput 
                        placeholder="Search labels..." 
                        className="bg-white dark:bg-background text-black dark:text-foreground border-none focus:ring-0 placeholder:text-muted-foreground h-9 [&_div]:bg-white dark:[&_div]:bg-background"
                      />
                      <CommandList className="bg-white dark:bg-background text-black dark:text-foreground max-h-[200px] overflow-y-auto p-1">
                        <CommandEmpty className="py-3 px-3 text-sm text-slate-400">
                          No labels found.
                        </CommandEmpty>
                        <CommandGroup>
                          {savedLabels.map((label) => (
                            <CommandItem
                              key={label.id}
                              value={label.name}
                              onSelect={(value) => {
                                handleCommandSelect(label.name);
                                setLabelPopoverOpen(false);
                                setTimeout(() => {
                                  const calendarButton = document.querySelector('[data-calendar-button="true"]');
                                  if (calendarButton instanceof HTMLElement) {
                                    calendarButton.focus();
                                  }
                                }, 0);
                              }}
                              className="text-foreground cursor-pointer hover:bg-accent rounded-sm px-2 py-1.5 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: label.color }}
                                />
                                <span>{label.name}</span>
                              </div>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedLabelId === label.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="flex flex-col items-center">
                  <div 
                    onClick={() => setLabelDialogOpen(true)}
                    className="w-10 h-10 rounded-full border-2 border-slate-700 flex items-center justify-center cursor-pointer hover:border-slate-500 transition-colors"
                  >
                    <span className="text-xl">+</span>
                  </div>
                  <span className="text-sm mt-1">Create</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    data-calendar-button="true"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      "bg-background border-border",
                      !date && "text-muted-foreground"
                    )}
                    tabIndex={0}
                    onClick={() => {
                      setTimeout(() => {
                        const calendar = document.querySelector('.rdp-day_today, .rdp-day_selected');
                        if (calendar instanceof HTMLElement) {
                          calendar.focus();
                        }
                      }, 100);
                    }}
                    onFocus={(e) => {
                      if (e.relatedTarget) {
                        e.currentTarget.click();
                      }
                    }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border-border">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => {
                      setDate(date);
                      const calendarButton = document.querySelector('[data-calendar-button="true"]');
                      if (calendarButton instanceof HTMLElement) {
                        calendarButton.click();
                        setTimeout(() => {
                          const submitButton = document.querySelector('[data-submit-button="true"]');
                          if (submitButton instanceof HTMLElement) {
                            submitButton.focus();
                          }
                        }, 100);
                      }
                    }}
                    defaultMonth={date || new Date()}
                    initialFocus
                    className={cn(
                      "bg-background rounded-md",
                      "[&_.rdp-day]:text-black dark:[&_.rdp-day]:text-foreground",
                      "[&_.rdp-button]:text-black dark:[&_.rdp-button]:text-foreground",
                      "[&_.rdp-day_button:hover]:bg-accent",
                      "[&_.rdp-day_button:focus]:bg-accent",
                      "[&_.rdp-day_button:focus]:text-accent-foreground",
                      "[&_.rdp-day_button.rdp-day_selected]:bg-primary",
                      "[&_.rdp-day_button.rdp-day_selected]:text-primary-foreground",
                      "[&_.rdp-nav_button]:text-black dark:[&_.rdp-nav_button]:text-foreground",
                      "[&_.rdp-nav_button:hover]:bg-accent",
                      "[&_.rdp-nav_button:focus]:bg-accent",
                      "[&_.rdp-caption_label]:text-black dark:[&_.rdp-caption_label]:text-foreground",
                      "[&_.rdp-head_cell]:text-black dark:[&_.rdp-head_cell]:text-muted-foreground",
                      "[&_.rdp-day_today]:bg-accent/50 dark:[&_.rdp-day_today]:bg-accent/50",
                      "[&_.rdp-day_outside]:text-black/50 dark:[&_.rdp-day_outside]:text-foreground/50",
                      "[&_.rdp-button_reset]:text-black dark:[&_.rdp-button_reset]:text-foreground"
                    )}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex justify-end gap-4 mt-4">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange?.(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white border-slate-800"
                data-cancel-button="true"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-slate-800 hover:bg-slate-700 text-white"
                data-submit-button="true"
                disabled={isSubmitting || !title}
              >
                {isSubmitting ? 'Creating...' : mode === 'create' ? 'Create Note' : 'Update Note'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={labelDialogOpen} onOpenChange={setLabelDialogOpen}>
        <DialogContent className="bg-background text-foreground border border-border shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">New Label</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLabel} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="labelTitle">Title</Label>
              <Input
                id="labelTitle"
                value={newLabelTitle}
                onChange={(e) => setNewLabelTitle(e.target.value)}
                placeholder="Enter label title"
                required
                className="bg-background border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-3 flex-wrap">
                {availableColors.map((color) => (
                  <div
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 ${
                      selectedColor === color.value ? 'ring-2 ring-white' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
              <Button
                onClick={() => setIsCustomColorDialogOpen(true)}
                className="mt-4 w-full bg-background border border-border text-foreground hover:text-foreground rounded-full px-6 py-2 font-bold text-sm shadow-lg"
              >
                Find a different color
              </Button>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLabelDialogOpen(false)}
                className="bg-background hover:bg-accent text-foreground border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Create Label
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCustomColorDialogOpen} onOpenChange={setIsCustomColorDialogOpen}>
        <DialogContent className="bg-background text-foreground border-border">
          <DialogHeader>
            <DialogTitle>Pick Your Own Color</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <p className="text-sm text-foreground/80">
                Visit <a href="https://colorhunt.co/palettes/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">colorhunt.co/palettes</a>. Find a color you like and think will match the aesthetics of the page. Click the hexcode to copy it (ex: FFB4A2).
              </p>
              <p className="text-sm text-foreground/80">
                Paste it in this box:
              </p>
              <div className="flex gap-2">
                <Input
                  value={customColorInput}
                  onChange={(e) => {
                    let value = e.target.value.replace('#', '');
                    setCustomColorInput(value);
                  }}
                  className="bg-background border-border"
                  placeholder="Enter hex color (ex: FFB4A2)"
                />
                <div 
                  className="w-10 h-10 rounded-lg border border-white/20"
                  style={{ backgroundColor: `#${customColorInput}` }}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCustomColorDialogOpen(false)}
                  className="bg-background border-border hover:bg-accent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (customColorInput) {
                      setSelectedColor(`#${customColorInput}`);
                      setIsCustomColorDialogOpen(false);
                      setCustomColorInput("");
                    }
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={!customColorInput.match(/^[0-9A-Fa-f]{6}$/)}
                >
                  Apply Color
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 