import { cn } from "@/lib/utils";
import { NoteCard } from "./NoteCard";

interface Note {
  title: string;
  description: string;
}

interface NoteGridProps {
  notes: Note[];
  className?: string;
}

export function NoteGrid({ notes, className }: NoteGridProps) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}
    >
      {notes.map((note, index) => (
        <NoteCard
          key={index}
          title={note.title}
          description={note.description}
        />
      ))}
    </div>
  );
} 