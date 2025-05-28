"use client"

import Link from 'next/link'
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { PlusCircle } from "lucide-react"

export default function Navbar() {
  const { theme, systemTheme } = useTheme()
  const resolved = theme === "system" ? systemTheme : theme
  const textClass = resolved === "dark" ? "text-gray-300" : "text-muted-foreground"

  return (
    <div className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold cursor-pointer" onClick={() => window.location.href = '/landing'}>TaskPilot</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button onClick={() => window.location.href = '/login'} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />로그인
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
