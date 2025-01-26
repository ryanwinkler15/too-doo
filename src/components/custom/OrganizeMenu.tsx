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
import { Check, ChevronsUpDown } from "lucide-react"
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
}

interface Label {
  id: string;
  name: string;
  color: string;
}

export function OrganizeMenu({ onLabelSelect }: OrganizeMenuProps) {
  const [labels, setLabels] = React.useState<Label[]>([]);
  const [open, setOpen] = React.useState(false)
  const [labelValue, setLabelValue] = React.useState("")
  const [showLabels, setShowLabels] = React.useState(false)
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

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="bg-slate-800 text-white hover:bg-slate-700">
          Organize
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-slate-900 text-white border-slate-800">
        <DropdownMenuItem className="text-white hover:bg-slate-200 hover:text-black focus:bg-slate-200 focus:text-black">
          Priority
        </DropdownMenuItem>
        <DropdownMenuItem className="text-white hover:bg-slate-200 hover:text-black focus:bg-slate-200 focus:text-black">
          Due Date
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
            onInteractOutside={(e) => {
              e.preventDefault();
            }}
          >
            <Command className="bg-slate-900">
              <CommandInput 
                ref={inputRef}
                placeholder="Search labels..." 
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
