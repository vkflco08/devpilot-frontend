"use client"
import { Loader2 } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function Loading() {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  const resolved = theme === "system" ? systemTheme : theme
  const bgClass = resolved === "dark"
    ? "bg-gradient-to-br from-[#18181b] to-[#23272f]"
    : "bg-gradient-to-br from-gray-50 to-gray-200"
  const textClass = resolved === "dark" ? "text-gray-300" : "text-muted-foreground"
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${bgClass}`}>
      <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
      <span className={`text-base ${textClass}`}>잠시만 기다려주세요...</span>
    </div>
  )
} 