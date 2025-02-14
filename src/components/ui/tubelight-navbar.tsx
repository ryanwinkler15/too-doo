"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  url: string
  icon?: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
  activeTab: string
  setActiveTab: (name: string) => void
}

export function NavBar({ items, className, activeTab, setActiveTab }: NavBarProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className={cn("relative z-50", className)}>
      <div className="fixed left-1/2 -translate-x-1/2 top-4">
        <div className="relative">
          {/* Background bubble */}
          <div className="absolute inset-0 bg-background border border-border rounded-full blur-sm" />
          <div className="relative rounded-full border border-border bg-background px-1.5 py-1.5 shadow-lg dark:shadow-[0_20px_35px_-20px_rgba(255,255,255,0.1)]">
            <div className="flex items-center gap-2">
              {items.map((item) => {
                const isActive = activeTab === item.name
                return (
                  <Link
                    key={item.name}
                    href={item.url}
                    onClick={() => setActiveTab(item.name)}
                    className={cn(
                      "relative rounded-full px-3 py-1.5 text-sm font-bold outline-2 outline-sky-400 transition focus-visible:outline",
                      "text-black dark:text-foreground hover:text-black dark:hover:text-foreground"
                    )}
                    style={{
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="navbar-bubble"
                        className="absolute inset-0 bg-primary/10 dark:bg-primary/20 border-border"
                        style={{ borderRadius: 9999 }}
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 