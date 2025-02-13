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
import { navItems } from "@/lib/navigation";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Settings");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

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
          {/* Settings Content */}
          <div className="flex-1 p-6 md:p-10 border-l border-slate-900">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <SettingsCard
                title="Profile Settings"
                description="Manage your account details and preferences"
                href="/settings/profile"
              />
              <SettingsCard
                title="Aesthetics"
                description="Customize labels and colors"
                href="/settings/aesthetics"
              />
              <SettingsCard
                title="Subscription"
                description="Manage your subscriptions"
                href="/settings/subscription"
              />
              <SettingsCard
                title="Logout"
                description="Leave your session"
                href="#"
              />
            </div>
          </div>
        </div>
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

const SettingsCard = ({ title, description, href }: { title: string; description: string; href: string }) => {
  return (
    <Link href={href}>
      <div className="p-6 rounded-xl border border-slate-900 bg-slate-950 hover:bg-slate-900 transition-colors cursor-pointer">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </Link>
  );
}; 