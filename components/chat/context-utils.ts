"use client"

import { jwtDecode } from "jwt-decode"
import type { APIError } from "@/lib/api"
import type { ChatSession, Thread } from "@/components/chat/types"

/**
 * Get a cookie by name (Client Side)
 * @param name - The name of the cookie
 * @returns The value of the cookie or null if not found
 */
export function getCookie(name: string): string | null {
  // Check if we're in a browser environment
  if (typeof document === "undefined") {
    return null
  }

  const cookies = document.cookie.split(";")
  for (const cookie of cookies) {
    const [key, value] = cookie.split("=")
    if (key.trim() === name) {
      return value
    }
  }
  return null
}

/**
 * Set a cookie by name (Client Side)
 * @param name - The name of the cookie
 * @param value - The value of the cookie
 */
export function setCookie(name: string, value: string) {
  if (typeof document === "undefined") {
    return
  }

  document.cookie = `${name}=${value}; path=/`
}

export async function getChatSession(): Promise<
  | { chatSession: ChatSession; error: undefined }
  | { chatSession: undefined; error: APIError }
> {
  const jwt = getCookie("chat_session_token")
  const chatSessionId = getCookie("chat_session_id")

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PLAI_API_URL}/chat_sessions/${chatSessionId}`,
    {
      headers: {
        authorization: `Bearer ${jwt}`,
      },
    },
  )

  if (!response.ok) {
    return {
      chatSession: undefined,
      error: {
        body: response.statusText,
        status: response.status,
      },
    }
  }

  return {
    chatSession: (await response.json()) as ChatSession,
    error: undefined,
  }
}

export const refreshChatSession = async (): Promise<string> => {
  const refreshToken = getCookie("chat_session_refresh_token")
  const chatSessionId = getCookie("chat_session_id")

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PLAI_API_URL}/chat_sessions/${chatSessionId}/refresh`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${refreshToken}`,
      },
    },
  )

  const data = await response.json()
  return data.chat_token as string
}

export async function getThreads(): Promise<
  | {
      threads: Thread[]
      error: undefined
    }
  | {
      threads: undefined
      error: APIError
    }
> {
  const jwt = getCookie("chat_session_token")

  if (!jwt) {
    return {
      threads: undefined,
      error: {
        body: "No chat session token found",
        status: 401,
      },
    }
  }

  const decoded = jwtDecode(jwt) as { id: string }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PLAI_API_URL}/chat_sessions/${decoded.id}/threads`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  )
  const threads = await response.json()
  return {
    threads,
    error: undefined,
  }
}

export async function getThread(
  threadId: string,
): Promise<
  { thread: Thread; error: undefined } | { thread: undefined; error: APIError }
> {
  const jwt = getCookie("chat_session_token")

  if (!jwt) {
    return {
      thread: undefined,
      error: {
        body: "No chat session token found",
        status: 401,
      },
    }
  }

  const decoded = jwtDecode(jwt) as { id: string }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PLAI_API_URL}/chat_sessions/${decoded.id}/threads/${threadId}`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  )

  if (!response.ok) {
    return {
      thread: undefined,
      error: {
        body: response.statusText,
        status: response.status,
      },
    }
  }

  return {
    thread: (await response.json()) as Thread,
    error: undefined,
  }
}

export async function createThread(): Promise<
  { thread: Thread; error: undefined } | { thread: undefined; error: APIError }
> {
  const jwt = getCookie("chat_session_token")

  if (!jwt) {
    return {
      thread: undefined,
      error: {
        body: "No chat session token found",
        status: 401,
      },
    }
  }

  const decoded = jwtDecode(jwt) as { id: string }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PLAI_API_URL}/chat_sessions/${decoded.id}/threads`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  )

  if (!response.ok) {
    return {
      thread: undefined,
      error: {
        body: response.statusText,
        status: response.status,
      },
    }
  }

  return {
    thread: (await response.json()) as Thread,
    error: undefined,
  }
}

export async function deleteThread(threadId: string): Promise<boolean> {
  const jwt = getCookie("chat_session_token")

  if (!jwt) return false
  const decoded = jwtDecode(jwt) as { id: string }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PLAI_API_URL}/chat_sessions/${decoded.id}/threads/${threadId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  )

  if (!response.ok) {
    console.error(
      "Failed to delete thread",
      response.status,
      response.statusText,
    )
    return false
  }

  return true
}
