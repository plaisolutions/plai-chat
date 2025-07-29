"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { MessageSquare, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import ThreadSearch from "./thread-filter"
import { useTranslation } from "@/components/chat/translations/useTranslation"
import { deleteThread, getThreads } from "@/components/chat/context-utils"
import { useChatSession } from "@/components/chat/context"
import { createThread } from "@/components/chat/context-utils"
import { Thread } from "@/components/chat/types"

interface ChatsListProps {
  collapsed: boolean
}

export default function ChatsList({ collapsed }: ChatsListProps) {
  const params = useParams<{ threadId: string }>()
  const { toast } = useToast()
  const { chatSession, activeThreadId, setActiveThreadId, lastUpdate } =
    useChatSession()
  const [threads, setThreads] = useState<Thread[]>([])
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>([])
  const { t } = useTranslation()

  useEffect(() => {
    const fetchThreads = async () => {
      const data = await getThreads()
      if (data.error) {
        throw new Error(data.error.detail)
      }
      setThreads(data.threads)
      setFilteredThreads(data.threads)
    }
    fetchThreads()
  }, [lastUpdate])

  const handleNewChat = async () => {
    const response = await createThread()

    if (response.error) {
      toast({
        title: "Error",
        description: "Failed to create chat",
      })
    }

    if (response.thread) {
      setActiveThreadId(response.thread.id)
    }
  }

  async function handleDeleteThread(threadId: string) {
    const success = await deleteThread(threadId)
    if (!success) {
      toast({
        title: "Error",
        description: "Failed to delete chat",
      })

      return
    }

    setFilteredThreads(filteredThreads.filter((t) => t.id !== threadId))
    toast({
      title: "Chat deleted",
      description: "The chat has been deleted",
    })

    if (params.threadId === threadId) {
      await handleNewChat()
    }
  }

  if (!chatSession || !threads) return null

  return (
    <div
      className={`flex h-full ${collapsed ? "w-32" : "w-96"} flex-col border-r bg-white`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h2 className={`text-lg font-semibold ${collapsed ? "hidden" : ""}`}>
          {t("chat_history")}
        </h2>
        <Button
          size="sm"
          variant="outline"
          className={`size-8 p-0 ${collapsed ? "mx-auto" : ""}`}
          onClick={handleNewChat}
          aria-label={t("new_chat")}
        >
          <Plus className="size-4" />
          <span className="sr-only">{t("new_chat")}</span>
        </Button>
      </div>

      {!collapsed && (
        <div className="border-b p-4">
          <ThreadSearch
            threads={threads}
            onFilteredThreadsChange={setFilteredThreads}
          />
        </div>
      )}

      {/* Chat List */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <MessageSquare className="mb-2 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {threads.length === 0
                    ? t("no_threads_yet")
                    : t("no_threads_found")
                  }
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {threads.length === 0
                    ? t("start_new_chat")
                    : t("try_adjusting_search")
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredThreads.map((thread, i) => (
                  <ChatItem
                    key={thread.id}
                    index={i}
                    thread={thread}
                    activeThreadId={activeThreadId}
                    setActiveThreadId={setActiveThreadId}
                    handleDeleteThread={handleDeleteThread}
                    collapsed={collapsed}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ChatItem({
  index,
  thread,
  activeThreadId,
  setActiveThreadId,
  handleDeleteThread,
  collapsed,
}: {
  index: number
  thread: Thread
  activeThreadId: string | null
  setActiveThreadId: (threadId: string) => void
  handleDeleteThread: (threadId: string) => Promise<void>
  collapsed: boolean
}) {
  // Format the date
  const formatDate = (dateString: string) => {
    const date = parseUTCDateString(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  const { t } = useTranslation()
  const isActive = activeThreadId === thread.id
  const title = thread.title || `${t("new_chat")}`

  return (
    <div className="group relative cursor-pointer">
      <a onClick={() => setActiveThreadId(thread.id)}>
        <div
          // eslint-disable-next-line tailwindcss/classnames-order
          className={cn(
            "relative group flex items-center gap-3 rounded-lg py-2 px-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
            isActive && "bg-accent text-accent-foreground",
            index > 0 && "group-hover:pr-8",
          )}
        >
          <MessageSquare className="size-4" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-4">
                <p className="truncate text-sm font-medium">{title}</p>
                <span className="whitespace-nowrap text-xs text-muted-foreground group-hover:text-muted-foreground dark:group-hover:text-white">
                  {formatDate(thread.updated_at)}
                </span>
                {/* Delete button - appears on hover and not on the first item */}
                {index > 0 && !collapsed && (
                  <Button
                    size="sm"
                    variant="ghost_destructive"
                    className="absolute right-0 top-0 size-6 h-full rounded-l-none bg-muted-foreground/50 p-0 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeleteThread(thread.id)}
                  >
                    <Trash2 className="size-3" />
                    <span className="sr-only">{t("delete_chat")}</span>
                  </Button>
                )}
              </div>
              {thread.messages && thread.messages.length > 0 && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {thread.messages[thread.messages.length - 1]?.content?.slice(
                    0,
                    40,
                  )}
                  ...
                </p>
              )}
            </div>
          )}
        </div>
      </a>
    </div>
  )
}

const parseUTCDateString = (dateString: string) => {
  // Convert "2025-07-22 11:03:55.1417" → "2025-07-22T11:03:55.1417Z"
  const isoString = dateString.replace(" ", "T") + "Z"
  return new Date(isoString)
}
