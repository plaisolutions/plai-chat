"use client"

import { useState, useEffect } from "react"
import { getCookie } from "@/components/chat/context-utils"
import ChatSidebar from "@/components/chat/chat-sidebar"
import Chat from "@/components/chat/chat"
import Greeting from "@/components/chat/greeting"
import { useIsMobile } from "@/hooks/use-mobile"

export default function ChatLayout() {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(isMobile)

  useEffect(() => {
    setCollapsed(isMobile)
  }, [isMobile])

  const userName = getCookie("chat_session_user_name")
  const greetingMessage = getCookie("chat_session_greeting_message")

  return (
    <div className="flex h-screen flex-col items-start overflow-hidden md:flex-row">
      <ChatSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="size-full overflow-x-hidden pt-20 md:w-auto md:flex-1 md:pt-0">
        {userName && greetingMessage && (
          <Greeting userName={userName} greetingMessage={greetingMessage} />
        )}
        <Chat collapsed={collapsed} />
      </div>
    </div>
  )
}
