import { Button } from "@/components/ui/button";
import { CreateNoteDialog } from "@/components/custom/CreateNoteDialog";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      {/* Title */}
      <h1 className="text-4xl font-bold text-center mb-8">Do it all</h1>
      
      {/* Header Bar */}
      <div className="flex justify-between items-center mb-8">
        {/* Left side - View Toggle */}
        <div className="space-x-2">
          <Button variant="outline" className="bg-slate-800 text-white hover:bg-slate-700">
            Active
          </Button>
          <Button variant="outline" className="bg-slate-800 text-white hover:bg-slate-700">
            Completed
          </Button>
        </div>
        
        {/* Right side - Action Buttons */}
        <div className="space-x-2">
          <CreateNoteDialog />
          <Button variant="outline" className="bg-slate-800 text-white hover:bg-slate-700">
            Organize
          </Button>
          <Button variant="outline" className="bg-slate-800 text-white hover:bg-slate-700">
            Prioritize
          </Button>
        </div>
      </div>
      
      {/* Main Content Area - To be filled later */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Todo items will go here */}
      </div>
    </div>
  );
}
