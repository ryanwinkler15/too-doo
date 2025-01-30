import { useState, useEffect } from "react";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { Note } from "@/lib/types";
import { NoteCard } from "./NoteCard";
import { cn } from "@/lib/utils";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface FannedNoteGridProps {
  notes: Note[];
  onDelete?: () => void;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

interface GroupedNotes {
  label: {
    name: string;
    color?: string;
  };
  notes: Note[];
}

export function FannedNoteGrid({ notes, onDelete }: FannedNoteGridProps) {
  const [expandedStack, setExpandedStack] = useState<string | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const supabase = createClientComponentClient();

  // Add escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedStack(null);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Fetch labels from Supabase
  useEffect(() => {
    const fetchLabels = async () => {
      const { data, error } = await supabase
        .from('labels')
        .select('*')
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

  // Group notes by label
  const groupedNotes: GroupedNotes[] = notes.reduce((groups: GroupedNotes[], note) => {
    const labelName = note.label?.name || "Unmarked";
    const existingGroup = groups.find(g => g.label.name === labelName);
    
    if (existingGroup) {
      existingGroup.notes.push(note);
    } else {
      groups.push({
        label: {
          name: labelName,
          color: note.label?.color
        },
        notes: [note]
      });
    }
    
    return groups;
  }, []);

  // Make sure we have a group for each label from Supabase
  labels.forEach(label => {
    if (!groupedNotes.find(g => g.label.name === label.name)) {
      groupedNotes.push({
        label: {
          name: label.name,
          color: label.color
        },
        notes: []
      });
    }
  });

  // Add unmarked group if it doesn't exist
  if (!groupedNotes.find(g => g.label.name === "Unmarked")) {
    groupedNotes.push({
      label: { name: "Unmarked" },
      notes: []
    });
  }

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setExpandedStack(null);
    }
  };

  return (
    <div className="w-full p-8">
      <AnimatePresence>
        {expandedStack ? (
          // Expanded grid view
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 p-8 pt-32 overflow-auto"
            onClick={handleBackdropClick}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-[1800px] mx-auto"
            >
              {/* Title of expanded stack */}
              <h2 className="text-3xl font-bold text-white mb-12 text-center">
                {expandedStack} Notes
              </h2>
              
              {/* Grid of expanded notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {groupedNotes
                  .find(g => g.label.name === expandedStack)
                  ?.notes.map((note) => (
                    <NoteCard
                      key={note.id}
                      id={note.id}
                      title={note.title}
                      description={note.description}
                      label={note.label}
                      dueDate={note.due_date}
                      onDelete={onDelete}
                    />
                  ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          // Stacked view
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-24 pt-16">
            {groupedNotes.map((group) => (
              <div key={group.label.name} className="flex items-center justify-center">
                {/* Stack container */}
                <div 
                  className="relative h-[200px] w-[400px] cursor-pointer transform-gpu"
                  onClick={() => setExpandedStack(group.label.name)}
                >
                  {/* Stacked notes - render these FIRST so they appear behind the label card */}
                  {group.notes.slice(0, 5).map((note, index) => {
                    const xOffset = `${2 * (index + 1)}%`;  // Use percentage for more consistent scaling
                    const yOffset = `${-4 * (index + 1)}%`; // Use percentage for more consistent scaling

                    return (
                      <motion.div
                        key={note.id}
                        className="absolute inset-0 w-[400px] h-[200px] origin-center"
                        style={{
                          transform: `translate(${xOffset}, ${yOffset})`,
                          zIndex: 19 - index,
                        }}
                      >
                        <div className="h-full w-full border border-slate-600/50 rounded-xl shadow-md">
                          <NoteCard
                            id={note.id}
                            title={note.title}
                            description={note.description}
                            label={note.label}
                            dueDate={note.due_date}
                            onDelete={onDelete}
                          />
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Label card at the front */}
                  <motion.div
                    className={cn(
                      "absolute inset-0 rounded-xl p-6 flex items-center justify-center",
                      "border border-slate-700",
                      group.label.color ? "" : "bg-slate-800"
                    )}
                    style={{
                      backgroundColor: group.label.color || undefined,
                      borderColor: group.label.color || undefined,
                      zIndex: 20
                    }}
                  >
                    <h2 className="text-2xl font-bold text-white">
                      {group.label.name}
                      {group.notes.length > 0 && (
                        <span className="ml-2 text-sm opacity-70">
                          ({group.notes.length})
                        </span>
                      )}
                    </h2>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
} 