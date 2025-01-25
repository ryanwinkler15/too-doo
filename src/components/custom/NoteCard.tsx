import { BellIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NoteCardProps {
  title: string;
  description: string;
  className?: string;
}

export function NoteCard({ title, description, className }: NoteCardProps) {
  return (
    <div
      className={cn(
        "group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-xl",
        "bg-slate-900 border border-slate-800",
        "transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]",
        className
      )}
    >
      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
        <BellIcon className="h-12 w-12 origin-left transform-gpu text-slate-400 transition-all duration-300 ease-in-out group-hover:scale-75" />
        <h3 className="text-xl font-semibold text-white">
          {title}
        </h3>
        <p className="max-w-lg text-slate-400">{description}</p>
      </div>

      <div
        className={cn(
          "pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100",
        )}
      >
        <Button variant="ghost" size="sm" className="pointer-events-auto text-white hover:bg-slate-800">
          Complete
        </Button>
      </div>
      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-slate-800/10" />
    </div>
  );
} 