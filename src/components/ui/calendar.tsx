"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      {...props}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      modifiersClassNames={{
        selected: "bg-slate-800",
        today: "bg-slate-600",
      }}
      initialFocus={true}
      defaultMonth={new Date()}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-black dark:text-white",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 text-white hover:bg-slate-800 border-slate-700"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-slate-400 rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-slate-800 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal text-white hover:bg-slate-200 hover:text-white aria-selected:opacity-100 focus:bg-slate-200 focus:text-white focus-visible:bg-slate-200 focus-visible:text-white"
        ),
        day_selected:
          "bg-slate-800 text-white hover:bg-slate-500 hover:text-white focus:bg-slate-800 focus:text-white",
        day_today: "bg-slate-600 text-white",
        day_outside: "text-slate-400 opacity-50",
        day_disabled: "text-slate-400 opacity-50",
        day_range_middle:
          "aria-selected:bg-slate-800 aria-selected:text-white",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4 text-white" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4 text-white" />,
      }}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
