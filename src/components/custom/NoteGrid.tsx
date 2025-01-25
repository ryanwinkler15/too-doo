import { NoteCard } from "@/components/custom/NoteCard";
import { Note } from "@/lib/types";

interface NoteGridProps {
  notes: Note[];
  onDelete?: () => void;
}

export function NoteGrid({ notes, onDelete }: NoteGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          id={note.id}
          title={note.title}
          description={note.description}
          label={note.label || undefined}
          dueDate={note.due_date}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
} 