"use client"

import { ChatSessionProvider } from "@/components/chat/context"
import ChatLayout from "@/components/chat/chat-layout"

export const dynamic = "force-dynamic"

export default function ChatPage() {
  return (
    <ChatSessionProvider>
      <ChatLayout />
    </ChatSessionProvider>
  )
}
