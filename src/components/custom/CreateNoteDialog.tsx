'use client';

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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

interface CreateNoteDialogProps {
  onNoteCreated?: () => void;
  mode?: 'create' | 'edit';
  noteToEdit?: {
    id: string;
    title: string;
    description: string;
    label_id?: string;
    due_date?: string;
    label?: {
      name: string;
      color: string;
    };
  };
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateNoteDialog({ 
  onNoteCreated, 
  mode = 'create', 
  noteToEdit,
  isOpen,
  onOpenChange
}: CreateNoteDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [title, setTitle] = useState(noteToEdit?.title ?? "");
  const [description, setDescription] = useState(noteToEdit?.description ?? "");
  const [date, setDate] = useState<Date | undefined>(
    noteToEdit?.due_date ? new Date(noteToEdit.due_date) : undefined
  );
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [newLabelTitle, setNewLabelTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(colors[0].value);
  const [savedLabels, setSavedLabels] = useState<SavedLabel[]>([]);
  const [labelPopoverOpen, setLabelPopoverOpen] = useState(false);
  const [selectedLabelId, setSelectedLabelId] = useState(noteToEdit?.label_id || "");
  const [error, setError] = useState("");
  
  const supabase = createClientComponentClient();

  // Single effect to handle both label loading and form initialization
  useEffect(() => {
    async function initialize() {
      // Load labels
      const { data: labels, error } = await supabase
        .from('labels')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error loading labels:', error);
        return;
      }

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

      // Initialize form data in edit mode
      if (mode === 'edit' && noteToEdit && isOpen) {
        setTitle(noteToEdit.title);
        setDescription(noteToEdit.description);
        setDate(noteToEdit.due_date ? new Date(noteToEdit.due_date) : undefined);
      }
    }

    initialize();
  }, [mode, noteToEdit, isOpen, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(mode === 'create' ? 'Creating note:' : 'Updating note:', { title, description, label: selectedLabelId, date });

    try {
      if (mode === 'create') {
        const { data: newNote, error } = await supabase
          .from('notes')
          .insert([
            {
              title,
              description,
              label_id: selectedLabelId || null,
              due_date: date?.toISOString() || null,
            }
          ])
          .select()
          .single();

        if (error) throw error;

        console.log('Note created:', newNote);
      } else {
        const { error } = await supabase
          .from('notes')
          .update({
            title,
            description,
            label_id: selectedLabelId || null,
            due_date: date?.toISOString() || null,
          })
          .eq('id', noteToEdit?.id);

        if (error) throw error;

        console.log('Note updated');
      }

      setInternalOpen(false);
      onNoteCreated?.();
    } catch (error) {
      console.error(mode === 'create' ? 'Error creating note:' : 'Error updating note:', error);
      setError(`Failed to ${mode === 'create' ? 'create' : 'update'} note. Please try again.`);
    }
  };

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const { data: newLabel, error } = await supabase
        .from('labels')
        .insert([
          {
            name: newLabelTitle,
            color: selectedColor,
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

  // Reset form state when dialog opens
  const handleDialogOpenChange = (open: boolean) => {
    if (mode === 'create') {
      setInternalOpen(open);
    } else {
      onOpenChange?.(open);
    }
    
    if (open && mode === 'create') {
      // Only reset fields when creating a new note
      setTitle("");
      setDescription("");
      setDate(undefined);
      setSelectedLabelId("");
    }
  };

  const actualOpen = mode === 'create' ? internalOpen : isOpen;

  return (
    <>
      <Dialog open={actualOpen} onOpenChange={handleDialogOpenChange}>
        <DialogTrigger asChild>
          {mode === 'create' ? (
            <Button variant="outline" className="bg-slate-800 text-white hover:bg-slate-700">
              New
            </Button>
          ) : null}
        </DialogTrigger>
        <DialogContent className="bg-slate-900 text-white border-slate-800">
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
                className="bg-slate-800 border-slate-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Enter description (optional)"
                className="bg-slate-800 border-slate-700"
              />
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
                      className="w-[200px] justify-between bg-slate-800 border-slate-700 text-left font-normal"
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
                  <PopoverContent className="w-[200px] p-0 bg-slate-900 border-slate-800">
                    <Command 
                      className="bg-slate-900"
                    >
                      <CommandInput 
                        placeholder="Search labels..." 
                        className="bg-slate-800 text-white border-none focus:ring-0"
                      />
                      <CommandList className="bg-slate-800 text-white">
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
                                // Find and focus the calendar button after a short delay
                                setTimeout(() => {
                                  const calendarButton = document.querySelector('[data-calendar-button="true"]');
                                  if (calendarButton instanceof HTMLElement) {
                                    calendarButton.focus();
                                  }
                                }, 0);
                              }}
                              className="text-white cursor-pointer hover:bg-slate-700"
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
                    className={`w-full justify-start text-left font-normal bg-slate-800 border-slate-700 ${!date && "text-slate-400"}`}
                    tabIndex={0}
                    onClick={() => {
                      // Add a small delay to ensure the calendar is mounted before focusing
                      setTimeout(() => {
                        const calendar = document.querySelector('.rdp-day_today, .rdp-day_selected');
                        if (calendar instanceof HTMLElement) {
                          calendar.focus();
                        }
                      }, 100);
                    }}
                    onFocus={(e) => {
                      // Only open on focus if it was reached via keyboard navigation
                      if (e.relatedTarget) {
                        e.currentTarget.click();
                      }
                    }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => {
                      setDate(date);
                      const calendarButton = document.querySelector('[data-calendar-button="true"]');
                      if (calendarButton instanceof HTMLElement) {
                        calendarButton.click(); // Close the popover
                        // Focus the create/update button after a short delay to ensure the popover is closed
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
                    className="bg-slate-900"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInternalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                data-submit-button="true"
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {mode === 'create' ? 'Create Note' : 'Update Note'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={labelDialogOpen} onOpenChange={setLabelDialogOpen}>
        <DialogContent className="bg-slate-900 text-white border-slate-800">
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
                className="bg-slate-800 border-slate-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-3">
                {colors.map((color) => (
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
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLabelDialogOpen(false)}
                className="bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Label
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 