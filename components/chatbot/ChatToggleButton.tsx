"use client"

import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"

interface ChatToggleButtonProps {
  onClick: () => void
}

export default function ChatToggleButton({ onClick }: ChatToggleButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40"
      size="icon"
    >
      <MessageSquare className="h-6 w-6" />
    </Button>
  )
}