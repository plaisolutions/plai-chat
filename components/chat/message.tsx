"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { AiOutlineExclamationCircle } from "react-icons/ai"
import { RxCheck, RxCopy, RxReload } from "react-icons/rx"
import { User as UserIcon, ThumbsUp, ThumbsDown } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CustomMarkdown } from "@/components/custom-markdown"
import { ToolResultCard } from "@/components/chat/tool-result/tool-resource-card"
import { ShowSourcesButton } from "@/components/chat/show-sources-button"
import { getCookie } from "@/components/chat/context-utils"
import type { ChatMessage } from "@/components/chat/types"
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard"

export default function Message(
  message: ChatMessage & {
    agentId: string
    showAvatar: boolean
    correspondingToolResult?: ChatMessage["tool_result"]
    isStreaming?: boolean
  },
) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })
  const markdownRef = useRef<HTMLDivElement>(null)
  const handleCopy = (options: { html?: boolean } = { html: false }) => {
    if (options.html) {
      if (markdownRef.current) {
        copyToClipboard(markdownRef.current, { html: true, clean: true })
      }
    } else {
      copyToClipboard(message.content, { html: false })
    }
  }

  // Function to determine text size class based on message content length
  const getPromptClass = () => {
    // Only apply text sizing to user messages
    if (message.role !== "user") return ""

    const length = message.content.length

    if (length <= 96) return "text-lg leading-6 font-bold"
    if (length <= 256) return "text-lg leading-6 font-bold"
    if (length > 256) return "text-lg leading-6 font-bold"

    return "" // No special class for messages longer than 256 characters
  }

  const isToolCall =
    message.role === "assistant" &&
    message.tool_calls &&
    message.tool_calls.length > 0

  const isToolResult = message.role === "tool"

  const isAIMessage = message.role === "assistant" || message.role === "tool"

  if (isToolCall) {
    return null
  }

  return (
    <div className="flex flex-col space-y-1 pb-4">
      <div className="min-w-4xl flex max-w-4xl space-x-4  pb-2">
        {(message.role === "assistant" || message.role === "tool") &&
          message.showAvatar && (
            <Avatar className="size-10 rounded-full">
              <AvatarImage
                className={isAIMessage && message.avatar ? "" : "p-1"}
                src={
                  isAIMessage
                    ? message.avatar === null
                      ? "/logo.png"
                      : message.avatar
                    : undefined
                }
              />
              <AvatarFallback className="rounded-full">
                <div>
                  <UserIcon />
                </div>
              </AvatarFallback>
            </Avatar>
          )}
        <div className="ml-4 flex-1 flex-col overflow-hidden px-1">
          {isToolResult && (
            <div className="mb-3">
              <ToolResultCard toolResult={message.tool_result} />
            </div>
          )}

          {message.content?.length === 0 && message.role === "assistant" && (
            <PulsatingCursor />
          )}
          <>
            {!isToolCall && !isToolResult && (
              <div ref={markdownRef}>
                <CustomMarkdown
                  className={getPromptClass()}
                  messageBody={message.content}
                />
              </div>
            )}
            {/* Show ShowSourcesButton after assistant message content only when not streaming */}
            {message.role === "assistant" &&
              message.correspondingToolResult &&
              !message.isStreaming && (
                <div className="mt-4">
                  <ShowSourcesButton
                    toolResult={message.correspondingToolResult}
                  />
                </div>
              )}
            {message.role === "assistant" && message.content.length > 0 && (
              <div className="mt-8 flex space-x-2">
                {message.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy({ html: true })}
                    className="rounded-lg"
                  >
                    {isCopied ? (
                      <RxCheck size="18px" />
                    ) : (
                      <RxCopy size="18px" />
                    )}
                    <span className="sr-only">Copy code</span>
                  </Button>
                )}
                <MessageRateControls
                  messageId={message.id}
                  agentId={message.agentId}
                />
                {message.onResubmit && message.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={message.onResubmit}
                    className="rounded-lg"
                  >
                    <RxReload size="15px" />
                  </Button>
                )}
              </div>
            )}
          </>
        </div>
      </div>
    </div>
  )
}

function PulsatingCursor() {
  return (
    <div className="mt-2 flex h-6 items-center space-x-1">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="size-1.5 rounded-full bg-gray-500"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatType: "reverse",
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  )
}

interface MessageAlertProps {
  error: string
}

function MessageAlert({ error }: MessageAlertProps) {
  return (
    <Alert className="bg-destructive/10" variant="destructive">
      <AiOutlineExclamationCircle className="size-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        <b>{error}.</b>
      </AlertDescription>
    </Alert>
  )
}

function MessageRateControls({
  messageId,
  agentId,
}: {
  messageId?: string
  agentId: string
}) {
  const [rating, setRating] = useState("")

  if (!messageId) {
    return null
  }

  async function rateMessage(
    messageId: string,
    agentId: string,
    rating: string,
  ) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PLAI_API_URL}/agents/${agentId}/rate`,
      {
        method: "POST",
        body: JSON.stringify({
          agent_id: agentId,
          message_id: messageId,
          rating,
        }),
        headers: {
          authorization: `Bearer ${getCookie("chat_session_token")}`,
        },
      },
    )
    return response.json()
  }

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const messageId = event.currentTarget.getAttribute("data-message-id")
    const agentId = event.currentTarget.getAttribute("data-agent-id")
    const rateValue = event.currentTarget.getAttribute("data-rate-value")

    if (!messageId || !agentId || !rateValue) {
      return
    }

    setRating(rateValue)
    rateMessage(messageId, agentId, rateValue)
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        size="sm"
        variant={rating === "POSITIVE" ? "default" : "outline"}
        className={rating === "POSITIVE" ? "bg-green-300 text-black" : ""}
        data-message-id={messageId}
        data-agent-id={agentId}
        data-rate-value="POSITIVE"
        onClick={handleClick}
      >
        <ThumbsUp size={16} strokeWidth={1.5} />
      </Button>
      <Button
        size="sm"
        variant={rating === "NEGATIVE" ? "default" : "outline"}
        className={rating === "NEGATIVE" ? "bg-green-300 text-black" : ""}
        data-message-id={messageId}
        data-agent-id={agentId}
        data-rate-value="NEGATIVE"
        onClick={handleClick}
      >
        <ThumbsDown size={16} strokeWidth={1.5} />
      </Button>
    </div>
  )
}
