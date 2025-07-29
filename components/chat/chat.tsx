"use client"

import { useEffect, useState, useRef } from "react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { jwtDecode } from "jwt-decode"
import { MessageSquare } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/components/chat/translations/useTranslation"
import Message from "@/components/chat/message"
import { ToolResultCard } from "@/components/chat/tool-result/tool-resource-card"
import PromptForm from "@/components/chat/prompt-form"
import ChatSkeleton from "@/components/chat/chat-skeleton"
import { invokeChatSessionStreaming } from "@/components/chat/utils"
import {
  getCookie,
  getThread,
  refreshChatSession,
} from "@/components/chat/context-utils"
import { useChatSession } from "@/components/chat/context"

import type { ChatMessage } from "@/components/chat/types"
import type { Tool } from "@/types/tools"

dayjs.extend(relativeTime)

interface ChatProps {
  tools?: Tool[]
  debug?: boolean
  collapsed?: boolean
}

export default function Chat({
  tools = [],
  debug = false,
  collapsed = false,
}: ChatProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [timer, setTimer] = useState<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const { t } = useTranslation()
  const abortControllerRef = useRef<AbortController | null>(null)
  const { chatSession, isLoading, activeThreadId, setLastUpdate } =
    useChatSession()

  useEffect(() => {
    if (!activeThreadId) return

    const fetchThread = async () => {
      const data = await getThread(activeThreadId)
      if (data.error) {
        console.error(data.error)
        return
      }

      setMessages(data.thread.messages)
      console.log("Messages updated", data.thread.messages)
    }
    fetchThread()
  }, [activeThreadId])

  useEffect(() => {
    scrollToMessagesBottom()
  }, [messages])

  const abortStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsStreaming(false)
      setTimer(0)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const handleError = async (error: Error) => {
    console.error(error)
    const refreshToken = getCookie("chat_session_refresh_token")
    const jwt = getCookie("chat_session_token")

    if (!jwt) {
      toast({
        title: "Error",
        description: "No authentication token found",
      })
      return
    }

    if (
      error instanceof Error &&
      error.message.includes("401") &&
      refreshToken
    ) {
      console.log("Refreshing token")
      const newToken = await refreshChatSession()
      const newUrl = new URL(
        `/chats/${chatSession?.id}`,
        process.env.NEXT_PUBLIC_PLAI_UI_URL,
      )
      newUrl.searchParams.set("access", newToken)
      newUrl.searchParams.set("refresh", refreshToken)
      window.location.href = newUrl.toString()
    }
  }

  const handleStreamingClose = async () => {
    const jwt = getCookie("chat_session_token")
    if (!jwt) {
      toast({
        title: "Error",
        description: "No authentication token found",
      })
      return
    }

    const decoded = jwtDecode(jwt) as { id: string }
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PLAI_API_URL}/chat_sessions/${decoded.id}/threads/${activeThreadId}`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    )
    const thread = await response.json()
    setMessages(thread.messages)
    setLastUpdate(Date.now())
    console.log("Messages updated", thread.messages)
  }

  async function onSubmit(value: string, enabledTools?: string[]) {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create a new AbortController for the new request
    abortControllerRef.current = new AbortController()

    setIsStreaming(true)

    setTimer(0)
    timerRef.current = setInterval(() => {
      setTimer((prevTimer) => prevTimer + 0.1)
    }, 100)

    setMessages((previousMessages: any) => [
      ...previousMessages,
      { role: "user", content: value, thread_id: activeThreadId },
      { role: "assistant", content: "", thread_id: activeThreadId },
    ])

    const jwt = getCookie("chat_session_token")!
    const invokeUrl = `${process.env.NEXT_PUBLIC_PLAI_API_URL}/chat_sessions/${chatSession?.id}/threads/${activeThreadId}/invoke`

    try {
      await invokeChatSessionStreaming({
        invokeUrl,
        jwt,
        value,
        abortControllerRef,
        setIsLoading: setIsStreaming,
        setTimer,
        timerRef,
        setMessages,
        onError: handleError,
        onStreamingClose: handleStreamingClose,
        t,
      })
    } catch (error) {
      console.error(error)
      setIsStreaming(false)
      setTimer(0)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToMessagesBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  if (isLoading) return <ChatSkeleton />

  if (!chatSession) {
    return (
      <div className="flex h-full flex-1 flex-col overflow-y-auto">
        <div className="container mx-auto flex max-w-4xl flex-col">
          <p>No chat session found</p>
        </div>
      </div>
    )
  }

  if (activeThreadId == null) {
    return (
      <div className="flex h-full flex-1 flex-col overflow-y-auto">
        <div className="container mx-auto flex max-w-4xl flex-col items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-4 rounded-lg border border-border bg-card p-8 text-center shadow-sm">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="size-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                No Thread Selected
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Select a conversation thread from the sidebar to start chatting
                with your AI assistant.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-y-auto">
      {debug && (
        <div className="absolute inset-x-0 top-0 z-40 flex w-max items-center justify-between p-4">
          <p
            className={`${
              timer === 0 ? "text-muted-foreground" : "text-primary"
            } font-mono text-sm`}
          >
            {timer.toFixed(1)}s
          </p>
        </div>
      )}
      <div className="relative flex grow flex-col px-4">
        <div className="mb-20 mt-10 flex flex-col space-y-5 py-5">
          <div className="container mx-auto flex max-w-4xl flex-col">
            {messages &&
              messages.map((message, index) => {
                const lastMessageRole = messages[index - 1]?.role
                let displayAvatar = true

                if (message.role == "assistant" && lastMessageRole == "tool") {
                  displayAvatar = false
                }

                // Crear la función onResubmit solo para mensajes de tipo "ai"
                let onResubmit

                if (message.role === "assistant" && index > 0) {
                  onResubmit = () => {
                    // Buscar el último mensaje humano antes de este mensaje AI
                    let humanMessageIndex = index - 1
                    while (
                      humanMessageIndex >= 0 &&
                      messages[humanMessageIndex].role !== "user"
                    ) {
                      humanMessageIndex--
                    }

                    // Si encontramos un mensaje humano, reenviar ese mensaje
                    if (
                      humanMessageIndex >= 0 &&
                      messages[humanMessageIndex].role === "user"
                    ) {
                      const humanMessage = messages[humanMessageIndex]
                      onSubmit(humanMessage.content)
                    }
                  }
                }

                const isToolResult = false

                if (isToolResult && message.tool_result) {
                  return (
                    <div key={index} className="mb-3">
                      <ToolResultCard toolResult={message.tool_result} />
                      {/* <ToolResult toolResult={message.tool_result} /> */}
                    </div>
                  )
                }

                return (
                  <Message
                    key={index}
                    avatar={chatSession.agent.avatar}
                    onResubmit={onResubmit}
                    agentId={chatSession.agent.id}
                    showAvatar={displayAvatar}
                    {...message}
                  />
                )
              })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
      <div
        className={`fixed inset-x-0 bottom-0 z-50 w-full bg-gradient-to-t from-muted40 from-50% to-transparent to-100% lg:w-[calc(100%-24rem)] lg:translate-x-96${collapsed ? " md:w-[calc(100%-8rem)] md:translate-x-32" : " md:w-[calc(100%-24rem)] md:translate-x-96"}
        `}
      >
        <div className="container mx-auto mb-8 max-w-4xl px-8">
          <PromptForm
            onStop={() => abortStream()}
            onSubmit={async (value, enabledTools) => {
              onSubmit(value, enabledTools)
            }}
            isLoading={isStreaming}
            tools={tools}
            agentId={chatSession.agent.id}
          />
        </div>
      </div>
    </div>
  )
}
