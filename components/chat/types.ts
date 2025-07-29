import type { User } from "@/types/users"
import type { Agent } from "@/types/agents"

export type ChatMessage = {
  id?: string
  thread_id: string
  role: "user" | "assistant" | "tool"
  content: string
  tool_calls: ToolCall[] | null // Only availavle for "assistant" role
  tool_result: ToolResult | null // Only availavle for "tool" role
  avatar?: string
  onResubmit?: () => void
  user?: User
}

export type ToolCall = {
  id: string
  name: string
  type: ToolCallType
  arguments?: Record<string, any>
}

export type ToolResult = {
  id: string
  name: string
  type: ToolCallType
  output: Record<string, any> | string
  documents_metadata?: Record<string, any>[]
  extra_info?: Record<string, any>
  json_table?: any
  sql_query?: string
}

type ToolCallType =
  | "http_request"
  | "datasource"
  | "browser"
  | "perplexity"
  | "external_datasource"

export interface ChatSession {
  id: string
  agent: Agent
  thread: Thread
  external_ref: string
  allowed_vectors: Record<string, AllowedVector>
  created_at: string
  updated_at: string
}

export interface NewChatSession extends ChatSession {
  chat_token: string
  refresh_token: string
  thread_id: string
}

export type Thread = {
  id: string
  agent_id: string
  user_id: string | null
  external_ref: string
  title: string | null
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}

type AllowedVector = Record<string, string[]>
