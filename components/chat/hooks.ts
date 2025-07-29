"use client"

import { useEffect, useState } from "react"
import { jwtDecode } from "jwt-decode"
import type { ChatSession } from "@/components/chat/types"
import { getCookie } from "@/components/chat/utils"
import { getChatSession } from "@/components/chat/utils"
import type { APIError } from "@/lib/api"

export const useChatSession = (): {
  chatSession: ChatSession | null
  isLoading: boolean
  error: APIError | null
} => {
  const [chatSession, setChatSession] = useState<ChatSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<APIError | null>(null)

  useEffect(() => {
    const accessToken = getCookie("chat_session_token")
    if (accessToken) {
      const decoded = jwtDecode(accessToken) as { id: string }
      getChatSession(decoded.id, accessToken).then((result) => {
        if (result.error) {
          setError(result.error)
          setIsLoading(false)
        } else {
          setChatSession(result.chatSession)
          setIsLoading(false)
        }
      })
    }
  }, [])

  return { chatSession, isLoading, error }
}
