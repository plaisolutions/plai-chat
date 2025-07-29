"use client"

import { ChatSessionProvider } from "@/components/chat/context"
import ChatLayout from "@/components/chat/chat-layout"

export const dynamic = "force-dynamic"

export default function Page() {
  return (
    <ChatSessionProvider>
      <ChatLayout />
    </ChatSessionProvider>
  )
}
