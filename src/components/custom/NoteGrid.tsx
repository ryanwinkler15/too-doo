import { cn } from "@/lib/utils";
import { NoteCard } from "./NoteCard";

interface Note {
  id: string;
  title: string;
  description: string;
  label_id?: string;
  due_date?: string;
  label?: {
    name: string;
    color: string;
  };
}

interface NoteGridProps {
  notes: Note[];
  className?: string;
  onDelete?: () => void;
}

export function NoteGrid({ notes, className, onDelete }: NoteGridProps) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}
    >
      {notes.map((note) => (
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
  );
} 