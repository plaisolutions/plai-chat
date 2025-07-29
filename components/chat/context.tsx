import { createContext, useContext, useEffect, useState } from "react"

import { getCookie, setCookie } from "@/components/chat/context-utils"
import { getChatSession } from "@/components/chat/context-utils"
import type { ChatSession } from "@/components/chat/types"

interface ChatSessionContextType {
  isLoading: boolean
  chatSession: ChatSession | null
  activeThreadId: string | null
  setActiveThreadId: (threadId: string) => void
  lastUpdate: number
  setLastUpdate: (lastUpdate: number) => void
}

const ChatSessionContext = createContext<ChatSessionContextType>({
  isLoading: true,
  chatSession: null,
  activeThreadId: null,
  setActiveThreadId: () => {},
  lastUpdate: 0,
  setLastUpdate: () => {},
})

export function ChatSessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [chatSession, setChatSession] = useState<ChatSession | null>(null)
  const [_currentThreadId, _setCurrentThreadId] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(0)

  const setActiveThreadId = (threadId: string) => {
    setCookie("active_thread_id", threadId)
    _setCurrentThreadId(threadId)
  }

  useEffect(() => {
    const fetchChatSession = async () => {
      const data = await getChatSession()

      if (data.error) {
        console.error(data.error)
        setIsLoading(false)
        return
      }

      setChatSession(data.chatSession)
      setIsLoading(false)
    }

    const activeThreadId = getCookie("active_thread_id")
    if (activeThreadId) {
      _setCurrentThreadId(activeThreadId)
    }

    fetchChatSession()
  }, [])

  return (
    <ChatSessionContext.Provider
      value={{
        isLoading,
        chatSession,
        activeThreadId: _currentThreadId,
        setActiveThreadId,
        lastUpdate,
        setLastUpdate,
      }}
    >
      {children}
    </ChatSessionContext.Provider>
  )
}

export function useChatSession() {
  const context = useContext(ChatSessionContext)
  if (!context) {
    throw new Error("useChatSession must be used within a ChatSessionProvider")
  }
  return context
}
