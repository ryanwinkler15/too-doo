"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Check, ChevronsUpDown, AlignJustify } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface OrganizeMenuProps {
  onLabelSelect: (labelId: string) => void;
  onPriorityFilter: () => void;
  onDueDateSort: () => void;
  showPriorityOnly: boolean;
  sortByDueDate: boolean;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

export function OrganizeMenu({ 
  onLabelSelect, 
  onPriorityFilter, 
  onDueDateSort,
  showPriorityOnly,
  sortByDueDate 
}: OrganizeMenuProps) {
  const [labels, setLabels] = React.useState<Label[]>([]);
  const [open, setOpen] = React.useState(false)
  const [labelValue, setLabelValue] = React.useState("")
  const [showLabels, setShowLabels] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient();

  // Fetch labels from Supabase
  React.useEffect(() => {
    const fetchLabels = async () => {
      const { data, error } = await supabase
        .from('labels')
        .select('id, name, color')
        .order('name');
      
      if (error) {
        console.error('Error fetching labels:', error);
        return;
      }
      
      if (data) {
        setLabels(data);
      }
    };

    fetchLabels();
  }, []);

  // Focus input when popover opens
  React.useEffect(() => {
    if (showLabels && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
      }
  }, [showLabels]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchValue) {
      // Find the first label that matches the search value
      const matchingLabel = labels.find(label => 
        label.name.toLowerCase().includes(searchValue.toLowerCase())
      );

      if (matchingLabel) {
        e.preventDefault();
        setLabelValue(matchingLabel.name);
        onLabelSelect(matchingLabel.id);
        setShowLabels(false);
        setSearchValue("");
      }
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-[#0A0A0A] border border-[#1A1A1A] text-white hover:text-white rounded-full px-6 py-2 font-bold text-sm shadow-lg ring-1 ring-white/20"
        >
          <AlignJustify className="w-4 h-4 mr-2" />
          Organize
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-slate-900 text-white border-slate-800">
        <DropdownMenuItem 
          className="text-white hover:bg-slate-200 hover:text-black focus:bg-slate-200 focus:text-black"
          onSelect={(event) => {
            event.preventDefault();
            onPriorityFilter();
            setOpen(false);
          }}
        >
          <div className="flex items-center justify-between w-full">
            Priority
            {showPriorityOnly && <Check className="h-4 w-4" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-white hover:bg-slate-200 hover:text-black focus:bg-slate-200 focus:text-black"
          onSelect={(event) => {
            event.preventDefault();
            onDueDateSort();
            setOpen(false);
          }}
        >
          <div className="flex items-center justify-between w-full">
            Due Date
            {sortByDueDate && <Check className="h-4 w-4" />}
          </div>
        </DropdownMenuItem>
        <Popover open={showLabels} onOpenChange={setShowLabels}>
          <PopoverTrigger asChild>
            <DropdownMenuItem 
              className="text-white hover:bg-slate-200 hover:text-black focus:bg-slate-200 focus:text-black"
              onSelect={(event) => {
                event.preventDefault()
                setShowLabels(true)
                setOpen(true)
              }}
            >
              Label
            </DropdownMenuItem>
          </PopoverTrigger>
          <PopoverContent 
            className="p-0 bg-slate-900 border-slate-800 w-56" 
            align="start"
            alignOffset={-5}
            sideOffset={0}
            onOpenAutoFocus={(event) => {
              event.preventDefault()
              setTimeout(() => {
                inputRef.current?.focus()
              }, 0)
            }}
            onInteractOutside={(e) => {
              e.preventDefault();
            }}
          >
            <Command className="bg-slate-900">
              <CommandInput 
                ref={inputRef}
                placeholder="Search labels..." 
                value={searchValue}
                onValueChange={setSearchValue}
                onKeyDown={handleKeyDown}
                className="text-white placeholder:text-slate-400 border-slate-800"
              />
              <CommandEmpty className="text-white">No label found.</CommandEmpty>
              <CommandGroup>
                {labels.map((label) => (
                  <CommandItem
                    key={label.id}
                    value={label.name}
                    onSelect={(currentValue) => {
                      setLabelValue(currentValue === labelValue ? "" : currentValue)
                      onLabelSelect(label.id)
                      setShowLabels(false)
                      setOpen(false)
                    }}
                    className="text-white aria-selected:bg-slate-200 aria-selected:text-black hover:bg-slate-200 hover:text-black focus:bg-slate-200 focus:text-black"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        labelValue === label.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div 
                      className="h-3 w-3 rounded-full mr-2"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 
