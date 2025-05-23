"use client"
import { Loader2 } from "lucide-react"

export default function LoadingSpinner({ text = "로딩 중..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
      <span className="text-muted-foreground">{text}</span>
    </div>
  )
} 