"use client"

import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "@/components/chat/translations/useTranslation"
import ChatsList from "@/components/chat/chats-list"
import { Button } from "@/components/ui/button"
import { useChatSession } from "@/components/chat/context"
import { createThread } from "@/components/chat/context-utils"

interface ChatSidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

export default function ChatSidebar({
  collapsed,
  setCollapsed,
}: ChatSidebarProps) {
  const { t } = useTranslation()
  const { chatSession, setActiveThreadId } = useChatSession()

  if (!chatSession) {
    return null
  }

  const handleNewChatClick = async () => {
    const response = await createThread()
    if (response.thread) {
      setActiveThreadId(response.thread.id)
    }
  }

  return (
    <>
      <div
        className={`
          absolute z-[60] flex w-full flex-col items-start justify-start md:relative md:flex md:h-full md:overflow-hidden md:border-r${collapsed ? " md:w-16" : " md:w-80 lg:w-96"}`}
      >
        <div className="flex h-20 w-full items-center gap-2 border-b bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={chatSession.agent.avatar || "/logo.png"}
            width={48}
            height={48}
            className="rounded-full"
            alt={chatSession.agent.name + " Avatar"}
          />
          <h1
            className={`text-xl font-medium${collapsed ? " hidden md:hidden lg:hidden" : ""}`}
          >
            {chatSession.agent.name}
          </h1>
          {/* "New Chat button */}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto md:hidden"
            onClick={handleNewChatClick}
            aria-label={t("new_chat")}
          >
            <Plus />
          </Button>
          {/* Toggle button */}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? t("new_chat") : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>
        <div
          className={`absolute top-20 z-[999] h-[calc(100vh-10rem)] w-full md:relative md:top-0 md:translate-x-0 lg:h-full${!collapsed ? " left-0" : " left-0 -translate-x-full md:translate-x-0"}`}
        >
          <ChatsList collapsed={collapsed} />
        </div>
        <div
          className={`mt-auto hidden w-full border-t bg-white p-4 md:flex${!collapsed ? " md:flex" : " md:hidden lg:hidden"}`}
        >
          <p className="text-xs text-muted-foreground">
            PLai Solutions &copy; 2025
          </p>
        </div>
      </div>
    </>
  )
}
