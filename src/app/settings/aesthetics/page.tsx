"use client";

import { useState, useEffect } from "react";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { UserCog, LogOut, Palette, CreditCard, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const colors = [
  { value: '#CB9DF0', label: 'Purple' },
  { value: '#C6E7FF', label: 'Blue' },
  { value: '#FFE6A9', label: 'Yellow' },
  { value: '#ACE1AF', label: 'Green' },
  { value: '#FFB26F', label: 'Orange' },
  { value: '#FFCCEA', label: 'Pink' },
  { value: '#FF8A8A', label: 'Red' },
];

interface Label {
  id: string;
  name: string;
  color: string;
  user_id: string;
}

export default function AestheticsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("Settings");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [labels, setLabels] = useState<Label[]>([]);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState(colors[0].value);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [editingColorLabelId, setEditingColorLabelId] = useState<string | null>(null);
  const [isCustomColorDialogOpen, setIsCustomColorDialogOpen] = useState(false);
  const [customColorInput, setCustomColorInput] = useState("");
  const [availableColors, setAvailableColors] = useState<Array<{ value: string; label: string; }>>([]);
  const [isCreateLabelCustomColorDialogOpen, setIsCreateLabelCustomColorDialogOpen] = useState(false);
  const [createLabelCustomColorInput, setCreateLabelCustomColorInput] = useState("");
  const router = useRouter();
  const supabase = createClientComponentClient();

  const navItems = [
    { name: 'Active', url: '/' },
    { name: 'Schedule', url: '/schedule' },
    { name: 'Completed', url: '/completed' },
    { name: 'Analytics', url: '/analytics' },
    { name: 'Settings', url: '/settings' }
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const sidebarLinks = [
    {
      label: "Profile",
      href: "/settings/profile",
      icon: (
        <UserCog className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Aesthetics",
      href: "/settings/aesthetics",
      icon: (
        <Palette className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Subscription",
      href: "/settings/subscription",
      icon: (
        <CreditCard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <LogOut className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
      onClick: handleSignOut,
    },
  ];

  // Fetch labels from Supabase
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('No user found');

        const { data, error } = await supabase
          .from('labels')
          .select('*')
          .eq('user_id', user.id)
          .order('name');

        if (error) throw error;
        setLabels(data || []);
      } catch (error) {
        console.error('Error fetching labels:', error);
        toast({
          variant: "destructive",
          description: "Failed to load labels",
        });
      }
    };

    fetchLabels();
  }, [supabase]);

  // Update the available colors whenever labels change
  useEffect(() => {
    // Start with preset colors
    const allColors = new Set(colors.map(c => c.value));
    
    // Add unique colors from existing labels
    labels.forEach(label => {
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
  }, [labels]);

  const handleLabelNameEdit = async (labelId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('labels')
        .update({ name: newName })
        .eq('id', labelId);

      if (error) throw error;

      setLabels(labels.map(label => 
        label.id === labelId ? { ...label, name: newName } : label
      ));
      setEditingLabelId(null);
      toast({
        description: "Label updated successfully",
      });
    } catch (error) {
      console.error('Error updating label:', error);
      toast({
        variant: "destructive",
        description: "Failed to update label",
      });
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    toast({
      title: "Delete Label",
      description: (
        <div className="space-y-2">
          <p>You have notes associated with this label. Deleting this label will remove the label from those existing notes. Are you sure you want to delete the label?</p>
          <div className="flex gap-2 justify-end mt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                try {
                  // First update all notes with this label to have no label
                  const { error: updateError } = await supabase
                    .from('notes')
                    .update({ label_id: null })
                    .eq('label_id', labelId);

                  if (updateError) throw updateError;

                  // Then delete the label
                  const { error: deleteError } = await supabase
                    .from('labels')
                    .delete()
                    .eq('id', labelId);

                  if (deleteError) throw deleteError;

                  // Update local state
                  setLabels(labels.filter(label => label.id !== labelId));
                  toast({
                    description: "Label deleted successfully",
                  });
                } catch (error) {
                  console.error('Error deleting label:', error);
                  toast({
                    variant: "destructive",
                    description: "Failed to delete label",
                  });
                }
              }}
            >
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Close all toasts
                const toastInstance = document.querySelector('[role="status"]');
                if (toastInstance) {
                  toastInstance.remove();
                }
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ),
      duration: Infinity
    });
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) {
      toast({
        variant: "destructive",
        description: "Please enter a label name",
      });
      return;
    }

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('labels')
        .insert([
          {
            name: newLabelName.trim(),
            color: selectedColor,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setLabels([...labels, data]);
      setIsCreatingLabel(false);
      setNewLabelName("");
      setSelectedColor(colors[0].value);
      toast({
        description: "Label created successfully",
      });
    } catch (error) {
      console.error('Error creating label:', error);
      toast({
        variant: "destructive",
        description: "Failed to create label",
      });
    }
  };

  const handleColorEdit = async (labelId: string, newColor: string) => {
    try {
      const { error } = await supabase
        .from('labels')
        .update({ color: newColor })
        .eq('id', labelId);

      if (error) throw error;

      setLabels(labels.map(label => 
        label.id === labelId ? { ...label, color: newColor } : label
      ));
      setEditingColorLabelId(null);
      toast({
        description: "Label color updated",
      });
    } catch (error) {
      console.error('Error updating label color:', error);
      toast({
        variant: "destructive",
        description: "Failed to update label color",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Navigation Bar - Now positioned absolutely */}
      <div className="absolute top-0 left-0 right-0 p-4 pb-0 z-10">
        <NavBar 
          items={navItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          className="relative"
        />
      </div>

      <div className="flex h-screen pt-[72px]"> {/* Add padding-top to account for the nav bar */}
        {/* Sidebar */}
        <div className="w-[300px] flex-shrink-0">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
            <SidebarBody className="justify-between gap-10">
              <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                <Logo />
                <div className="mt-8 flex flex-col gap-2">
                  {sidebarLinks.map((link, idx) => (
                    <SidebarLink key={idx} link={link} />
                  ))}
                </div>
              </div>
              <div>
                <SidebarLink
                  link={{
                    label: "User Profile",
                    href: "/settings/profile",
                    icon: (
                      <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center">
                        <UserCog className="h-4 w-4 text-white" />
                      </div>
                    ),
                  }}
                />
              </div>
            </SidebarBody>
          </Sidebar>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Aesthetics Content */}
          <div className="flex-1 p-6 md:p-10 border-l border-slate-900">
            <div className="max-w-xl mx-auto" style={{ marginLeft: "calc((100% - 300px - 32rem) / 2)" }}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold">Labels</h1>
                  <p className="text-sm text-white mt-1">Click the name and color to edit.</p>
                </div>
                <Button
                  onClick={() => setIsCreatingLabel(true)}
                  className="bg-[#0A0A0A] border border-[#1A1A1A] text-white hover:text-white rounded-full px-6 py-2 font-bold text-sm shadow-lg ring-1 ring-white/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New
                </Button>
              </div>
              
              <div className="rounded-lg border border-slate-800">
                <Table>
                  <TableBody>
                    {labels.map((label) => (
                      <TableRow key={label.id} className="hover:bg-slate-900/50 border-slate-800">
                        <TableCell className="font-medium">
                          {editingLabelId === label.id ? (
                            <input
                              type="text"
                              defaultValue={label.name}
                              className="bg-transparent border-b border-slate-700 focus:border-slate-500 outline-none px-1"
                              onBlur={(e) => handleLabelNameEdit(label.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleLabelNameEdit(label.id, e.currentTarget.value);
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <span 
                              onClick={() => setEditingLabelId(label.id)}
                              className="cursor-pointer hover:text-slate-300"
                            >
                              {label.name}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="w-[60px] pl-2 py-3">
                          <div 
                            onClick={() => setEditingColorLabelId(label.id)}
                            className="w-6 h-6 rounded-full border border-white/20 cursor-pointer hover:ring-2 hover:ring-white/40 transition-all"
                            style={{ backgroundColor: label.color }}
                          />
                        </TableCell>
                        <TableCell className="w-[50px] pl-0 py-3">
                          <button
                            onClick={() => handleDeleteLabel(label.id)}
                            className="text-red-400/70 hover:text-red-400 p-2 rounded-lg transition-colors hover:bg-white/5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Label Dialog */}
      <Dialog open={isCreatingLabel} onOpenChange={setIsCreatingLabel}>
        <DialogContent className="bg-slate-900 text-white border-slate-800">
          <DialogHeader>
            <DialogTitle>Create New Label</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                className="bg-slate-800 border-slate-700"
                placeholder="Enter label name"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {availableColors.map((color) => (
                  <div
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={cn(
                      "w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110",
                      selectedColor === color.value ? "ring-2 ring-white" : ""
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
              <Button
                onClick={() => setIsCreateLabelCustomColorDialogOpen(true)}
                className="mt-4 w-full bg-[#0A0A0A] border border-[#1A1A1A] text-white hover:text-white rounded-full px-6 py-2 font-bold text-sm shadow-lg ring-1 ring-white/20"
              >
                Find a different color
              </Button>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreatingLabel(false)}
                className="bg-transparent border-slate-700 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateLabel}
                className="bg-slate-800 hover:bg-slate-700 text-white"
              >
                Create Label
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Color Edit Dialog */}
      <Dialog open={editingColorLabelId !== null} onOpenChange={(open) => !open && setEditingColorLabelId(null)}>
        <DialogContent className="bg-slate-900 text-white border-slate-800">
          <DialogHeader>
            <DialogTitle>Edit Label Color</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {availableColors.map((color) => {
                  const label = labels.find(l => l.id === editingColorLabelId);
                  return (
                    <div
                      key={color.value}
                      onClick={() => {
                        if (editingColorLabelId) {
                          handleColorEdit(editingColorLabelId, color.value);
                        }
                      }}
                      className={cn(
                        "w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110",
                        label?.color === color.value ? "ring-2 ring-white" : ""
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  );
                })}
              </div>
              <Button
                onClick={() => setIsCustomColorDialogOpen(true)}
                className="mt-4 w-full bg-[#0A0A0A] border border-[#1A1A1A] text-white hover:text-white rounded-full px-6 py-2 font-bold text-sm shadow-lg ring-1 ring-white/20"
              >
                Find a different color
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Color Dialog */}
      <Dialog open={isCustomColorDialogOpen} onOpenChange={setIsCustomColorDialogOpen}>
        <DialogContent className="bg-slate-900 text-white border-slate-800">
          <DialogHeader>
            <DialogTitle>Pick Your Own Color</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <p className="text-sm text-white/80">
                Visit <a href="https://colorhunt.co/palettes/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">colorhunt.co/palettes</a>. Find a color you like and think will match the aesthetics of the page. Click the hexcode to copy it (ex: FFB4A2).
              </p>
              <p className="text-sm text-white/80">
                Paste it in this box:
              </p>
              <div className="flex gap-2">
                <Input
                  value={customColorInput}
                  onChange={(e) => {
                    let value = e.target.value.replace('#', '');
                    setCustomColorInput(value);
                  }}
                  className="bg-slate-800 border-slate-700"
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
                  className="bg-transparent border-slate-700 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (customColorInput && editingColorLabelId) {
                      handleColorEdit(editingColorLabelId, `#${customColorInput}`);
                      setIsCustomColorDialogOpen(false);
                      setCustomColorInput("");
                    }
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-white"
                  disabled={!customColorInput.match(/^[0-9A-Fa-f]{6}$/)}
                >
                  Apply Color
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Color Dialog for Create Label */}
      <Dialog open={isCreateLabelCustomColorDialogOpen} onOpenChange={setIsCreateLabelCustomColorDialogOpen}>
        <DialogContent className="bg-slate-900 text-white border-slate-800">
          <DialogHeader>
            <DialogTitle>Pick Your Own Color</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <p className="text-sm text-white/80">
                Visit <a href="https://colorhunt.co/palettes/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">colorhunt.co/palettes</a>. Find a color you like and think will match the aesthetics of the page. Click the hexcode to copy it (ex: FFB4A2).
              </p>
              <p className="text-sm text-white/80">
                Paste it in this box:
              </p>
              <div className="flex gap-2">
                <Input
                  value={createLabelCustomColorInput}
                  onChange={(e) => {
                    let value = e.target.value.replace('#', '');
                    setCreateLabelCustomColorInput(value);
                  }}
                  className="bg-slate-800 border-slate-700"
                  placeholder="Enter hex color (ex: FFB4A2)"
                />
                <div 
                  className="w-10 h-10 rounded-lg border border-white/20"
                  style={{ backgroundColor: `#${createLabelCustomColorInput}` }}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateLabelCustomColorDialogOpen(false)}
                  className="bg-transparent border-slate-700 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (createLabelCustomColorInput) {
                      setSelectedColor(`#${createLabelCustomColorInput}`);
                      setIsCreateLabelCustomColorDialogOpen(false);
                      setCreateLabelCustomColorInput("");
                    }
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-white"
                  disabled={!createLabelCustomColorInput.match(/^[0-9A-Fa-f]{6}$/)}
                >
                  Apply Color
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Toaster component at the end */}
      <Toaster />
    </div>
  );
}

const Logo = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium text-white whitespace-pre"
      >
        Too-Doo
      </motion.span>
    </Link>
  );
}; 