'use client';

import { useState } from 'react';
import { NavBar } from "@/components/ui/tubelight-navbar";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { LayoutDashboard, UserCog, Settings, LogOut, Palette, CreditCard } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Settings");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      label: "Aesthetics",
      href: "/settings/aesthetics",
      icon: (
        <Palette className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Profile",
      href: "/settings/profile",
      icon: (
        <UserCog className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Top Navigation Bar */}
      <div className="px-4 pb-4">
        <NavBar 
          items={navItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          className="relative"
        />
      </div>

      {/* Settings Content */}
      <div className={cn(
        "flex flex-col md:flex-row bg-[#111111] w-full border-t border-[#1A1A1A] overflow-hidden",
        "h-[calc(100vh-80px)]" // Adjusted to account for the nav bar and its padding
      )}>
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
                    <div className="w-7 h-7 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                      <UserCog className="h-4 w-4 text-white" />
                    </div>
                  ),
                }}
              />
            </div>
          </SidebarBody>
        </Sidebar>
        <SettingsContent />
      </div>
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

const SettingsContent = () => {
  return (
    <div className="flex flex-1">
      <div className="p-6 md:p-10 border-l border-[#1A1A1A] bg-[#0A0A0A] flex flex-col gap-2 flex-1 w-full h-full">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <SettingsCard
            title="Profile Settings"
            description="Manage your account details and preferences"
            href="/settings/profile"
          />
          <SettingsCard
            title="Appearance"
            description="Customize the look and feel of your dashboard"
            href="/settings/appearance"
          />
          <SettingsCard
            title="Notifications"
            description="Configure your notification preferences"
            href="/settings/notifications"
          />
          <SettingsCard
            title="Privacy"
            description="Manage your privacy and security settings"
            href="/settings/privacy"
          />
        </div>
      </div>
    </div>
  );
};

const SettingsCard = ({ title, description, href }: { title: string; description: string; href: string }) => {
  return (
    <Link href={href}>
      <div className="p-6 rounded-xl border border-[#1A1A1A] bg-[#111111] hover:bg-[#1A1A1A] transition-colors cursor-pointer">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </Link>
  );
}; 