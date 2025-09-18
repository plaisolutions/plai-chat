"use server"

import { cookies } from "next/headers"
import type { Thread, NewChatSession } from "@/components/chat/types"

export async function getThreads(): Promise<Thread[]> {
  const cookieStore = cookies()
  const chatSessionId = cookieStore.get("chat_session_id")?.value

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PLAI_API_URL}/chat_sessions/${chatSessionId}/threads`,
    {
      headers: {
        Authorization: `Bearer ${cookieStore.get("chat_session_token")?.value}`,
      },
    },
  )
  const threads = await response.json()
  return threads
}

export async function deleteThread(
  chatSessionId: string,
  threadId: string,
): Promise<boolean> {
  const cookieStore = cookies()
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PLAI_API_URL}/chat_sessions/${chatSessionId}/threads/${threadId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${cookieStore.get("chat_session_token")?.value}`,
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

export async function createChatSession(
  agentId: string,
  externalRef: string,
  projectJWT: string,
): Promise<NewChatSession> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PLAI_API_URL}/chat_sessions`,
    {
      headers: {
        Authorization: `Bearer ${projectJWT}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        agent_id: agentId,
        external_ref: externalRef,
      }),
    },
  )

  if (!response.ok) {
    console.error(
      "Failed to create chat session",
      response.status,
      response.statusText,
    )
    throw new Error("Failed to create chat session")
  }

  const chatSession = (await response.json()) as NewChatSession
  return chatSession
}
