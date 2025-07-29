import type { User } from "@/types/users"

export type ChatMessage = {
  type: string
  body: string
  agentId: string
  isSuccess?: boolean
  messageId?: string
  user?: User
  avatar?: string
  onResubmit?: () => void
  toolCall?: ToolCall
}

export type ToolCall = {
  id: string
  name: string
  type:
    | "http_request"
    | "datasource"
    | "browser"
    | "perplexity"
    | "external_datasource"
  output: Record<string, any> | string
  extra_info?: Record<string, any>
  arguments?: Record<string, any>
}

export type ToolResult = {
  id: string
  output: Record<string, any> | string
  extra_info?: Record<string, any>
}
