'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 shadow-lg hover:shadow-violet-500/25": variant === "default",
            "bg-red-600 text-white hover:bg-red-700": variant === "destructive",
            "border border-zinc-700 bg-transparent hover:bg-zinc-800 hover:text-white": variant === "outline",
            "bg-zinc-800 text-zinc-200 hover:bg-zinc-700": variant === "secondary",
            "hover:bg-zinc-800 hover:text-white": variant === "ghost",
            "text-violet-400 underline-offset-4 hover:underline": variant === "link",
            "bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-700 hover:to-blue-700 shadow-lg hover:shadow-violet-500/25 animate-glow": variant === "gradient",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }