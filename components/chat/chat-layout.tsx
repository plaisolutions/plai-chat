"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import ChatSidebar from "@/components/chat/chat-sidebar"
import Chat from "@/components/chat/chat"
import { useIsMobile } from "@/hooks/use-mobile"

const Greeting = dynamic(() => import("@/components/chat/greeting"), {
  ssr: false,
})

export default function ChatLayout() {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(isMobile)

  useEffect(() => {
    setCollapsed(isMobile)
  }, [isMobile])

  return (
    <div className="flex h-screen flex-col items-start overflow-hidden md:flex-row">
      <ChatSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="size-full overflow-x-hidden pt-20 md:w-auto md:flex-1 md:pt-0">
        <Greeting />
        <Chat
          collapsed={collapsed}
          showToolsControl={false}
          autoScroll={false}
        />
      </div>
    </div>
  )
}
