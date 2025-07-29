import type { Dispatch, SetStateAction } from "react"
import { fetchEventSource } from "@microsoft/fetch-event-source"
import { jwtDecode } from "jwt-decode"
import { Icons } from "@/components/icons"
import {
  File,
  Database,
  Video,
  FileAudio,
  Image as ImageIcon,
} from "lucide-react"
import type {
  ChatMessage,
  ChatSession,
  ToolCall,
} from "@/components/chat/types"
import type { Resource } from "@/types/datasources"
import type { APIError } from "@/lib/api"

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

export async function getChatSession(
  chatSessionId: string,
  jwt: string,
): Promise<
  | { chatSession: ChatSession; error: undefined }
  | { chatSession: undefined; error: APIError }
> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PLAI_API_URL}/chat_sessions/${chatSessionId}`,
    {
      headers: {
        authorization: `Bearer ${jwt}`,
      },
      next: {
        revalidate: 0,
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

interface invokeChatSessionProps {
  invokeUrl: string
  jwt: string
  value: string
  abortControllerRef: React.RefObject<AbortController> | null
  setIsLoading: (isLoading: boolean) => void
  setTimer: (timer: number) => void
  timerRef: React.RefObject<NodeJS.Timeout>
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>
  onError: (error: Error) => void
  onStreamingClose: () => void
  t: (key: string) => string // Translation function
}

export async function invokeChatSessionStreaming({
  invokeUrl,
  jwt,
  value,
  abortControllerRef,
  setIsLoading,
  setTimer,
  timerRef,
  setMessages,
  onError,
  onStreamingClose,
  t,
}: invokeChatSessionProps) {
  // Track document citations across chunks
  let documentCitationBuffer = ""
  let isCollectingDocumentCitation = false
// Translation function is now passed as a parameter


  await fetchEventSource(invokeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      prompt: value,
    }),
    openWhenHidden: true,
    signal: abortControllerRef?.current?.signal,
    async onclose() {
      setIsLoading(false)
      setTimer(0)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      onStreamingClose()
    },
    async onmessage(event) {
      let messageBody = ""
      let messageId = ""

      if (isMessageIdFormat(event.data)) {
        console.log("Message ID received", event.data)
        messageId = extractMessageId(event.data)
      }

      if (isToolCallFormat(event.data)) {
        console.log("Tool call received", event.data)
        // Substitute the last existing message with tool call content
        const toolCall = extractToolCall(event.data)
        let content = ""
        if (toolCall) {
          if (toolCall.type === "datasource") {
            content = t("tool_type_datasource")
          }

          if (toolCall.type === "perplexity") {
            content = t("tool_type_perplexity")
          }
        }

        if (content) {
          setMessages((previousMessages) => {
            const updatedMessages = [...previousMessages]

            // Find the last assistant message and substitute it
            for (let i = updatedMessages.length - 1; i >= 0; i--) {
              if (updatedMessages[i].role === "assistant") {
                // Substitute the last assistant message with tool call content
                updatedMessages[i] = {
                  role: "assistant",
                  content: content,
                  thread_id: "",
                  tool_calls: [],
                  tool_result: null,
                }

                // Add a new empty assistant message after it
                updatedMessages.splice(i + 1, 0, {
                  role: "assistant",
                  content: "",
                  thread_id: "",
                  tool_calls: [],
                  tool_result: null,
                })

                break
              }
            }

            return updatedMessages
          })
        }
      }

      if (isToolResultFormat(event.data)) {
        console.log("Tool result received", event.data)
      }

      if (isMessageBodyFormat(event.data)) {
        const extractedBody = extractMessageBody(event.data)

        // Check if this chunk might be part of a document citation
        if (
          isCollectingDocumentCitation ||
          mightBeDocumentCitation(extractedBody)
        ) {
          documentCitationBuffer += extractedBody
          isCollectingDocumentCitation = true

          // Check if we have a complete document citation
          if (isCompleteDocumentCitation(documentCitationBuffer)) {
            const documentIds = extractDocumentIds(documentCitationBuffer)
            if (documentIds.length > 0) {
              // Add the document citation to the message
              messageBody += `\n\n<document-citation ids="${documentIds.join(",")}" />\n\n`
            }
            // Reset the buffer
            documentCitationBuffer = ""
            isCollectingDocumentCitation = false
          }
        } else {
          messageBody += extractedBody
        }
      } else if (event.data === "") {
        messageBody += "\n"
      }

      setMessages((previousMessages) => {
        let updatedMessages = [...previousMessages]

        for (let i = updatedMessages.length - 1; i >= 0; i--) {
          if (updatedMessages[i].role === "assistant") {
            const latestMessage = updatedMessages[i]
            // Only append if the message is not already the last part of the body
            if (!latestMessage.content?.endsWith(messageBody)) {
              latestMessage.content = latestMessage.content
                ? latestMessage.content + messageBody
                : messageBody
            }

            latestMessage.id = messageId

            break
          }
        }

        return updatedMessages
      })
    },
    onerror(error) {
      onError(error) // callback function from props
    },
  })
}

const isMessageIdFormat = (input: string): boolean => {
  const regex =
    /<message_id>[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}<\/message_id>/

  return regex.test(input)
}

const extractMessageId = (input: string): string => {
  const regex =
    /<message_id>([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})<\/message_id>/
  const match = input.match(regex)

  return match ? match[1] : ""
}

const isToolCallFormat = (input: string): boolean => {
  const regex = /<tool_call>([\s\S]*?)<\/tool_call>/
  return regex.test(input)
}

const isToolResultFormat = (input: string): boolean => {
  const regex = /<tool_result>([\s\S]*?)<\/tool_result>/
  return regex.test(input)
}

const isMessageBodyFormat = (input: string): boolean => {
  const regex = /<message_body>([\s\S]*?)<\/message_body>/
  return regex.test(input)
}

const extractMessageBody = (input: string): string => {
  const regex = /<message_body>([\s\S]*?)<\/message_body>/
  const match = input.match(regex)
  return match ? match[1] : input
}

export const refreshChatSession = async (
  jwt: string,
  refreshToken: string,
): Promise<string> => {
  const decoded = jwtDecode(jwt) as { id: string }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PLAI_API_URL}/chat_sessions/${decoded.id}/refresh`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${refreshToken}`,
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    },
  )

  const data = await response.json()
  return data.chat_token as string
}

const extractToolCall = (input: string): ToolCall | null => {
  console.warn(
    "DEPRECATED: extractToolCall. Please use Chat Session components.",
  )

  const regex = /<tool_call>([\s\S]*?)<\/tool_call>/
  const match = input.match(regex)

  if (!match) {
    console.warn("Could not extract tool call from", input)
    return null
  }

  try {
    let jsonStr = match[1]
    console.log("Raw tool call JSON:", jsonStr)

    // First we try to parse the JSON as is
    try {
      const parsedToolCall = JSON.parse(jsonStr)
      console.log("Parsed tool call (direct):", parsedToolCall)
      return parsedToolCall
    } catch (directError) {
      console.log("Direct JSON parse failed:", directError)

      // Alternative approach: extract the main parts of the JSON and rebuild it
      try {
        // Extract id, name and type
        const idMatch = jsonStr.match(/"id"\s*:\s*"([^"]*)"/)
        const nameMatch = jsonStr.match(/"name"\s*:\s*"([^"]*)"/)
        const typeMatch = jsonStr.match(/"type"\s*:\s*"([^"]*)"/)

        // Extract the complete arguments section
        const fullArgsMatch = jsonStr.match(
          /"arguments"\s*:\s*(\{.*\})(?=\s*\}$)/,
        )

        if (idMatch && nameMatch && typeMatch && fullArgsMatch) {
          const id = idMatch[1]
          const name = nameMatch[1]
          const type = typeMatch[1]

          // Extract the complete arguments text
          let argsText = fullArgsMatch[1]

          // Check if the JSON ends correctly
          if (!argsText.endsWith("}")) {
            argsText = argsText + "}"
          }

          // Remove loose single quotes at the end
          argsText = argsText.replace(/'(?=\s*\})/, "")

          // Manually build a new object that complies with the ToolCall type
          const manualToolCall: ToolCall = {
            id: id,
            name: name,
            type: type as any, // Force the type to match the allowed types
            arguments: JSON.parse(argsText),
          }

          console.log("Created manual tool call:", manualToolCall)
          return manualToolCall
        }

        // If we can't extract all parts, we try a simpler approach
        // Treat all arguments content as a raw string
        const simpleArgsMatch = jsonStr.match(/"arguments"\s*:\s*(\{[^}]*\})/)

        if (idMatch && nameMatch && typeMatch && simpleArgsMatch) {
          try {
            // Try to parse arguments as JSON
            let argumentsObj
            try {
              argumentsObj = JSON.parse(simpleArgsMatch[1])
            } catch (argParseError) {
              // If it can't be parsed, create an object with the string as value
              argumentsObj = { raw: simpleArgsMatch[1] }
            }

            // Create an object that complies with the ToolCall definition
            const simpleToolCall: ToolCall = {
              id: idMatch[1],
              name: nameMatch[1],
              type: typeMatch[1] as any, // Force the type to match the allowed types
              arguments: argumentsObj,
            }

            console.log("Created simple tool call:", simpleToolCall)
            return simpleToolCall
          } catch (error) {
            console.warn("Error creating simple tool call:", error)
          }
        }
      } catch (manualError) {
        console.warn("Failed to create manual tool call:", manualError)
      }

      // Last attempt: replace problematic quotes throughout the JSON
      try {
        // Replace single quotes with double quotes
        let fixedJsonStr = jsonStr.replace(/'/g, '"')

        // Try to find and fix common problematic patterns
        // Pattern: ="value" inside a JSON string
        fixedJsonStr = fixedJsonStr.replace(/=("([^"]*)")/g, '=\\"$2\\"')

        console.log("Fixed JSON string:", fixedJsonStr)

        const parsedJson = JSON.parse(fixedJsonStr)
        console.log("Parsed JSON (after global fix):", parsedJson)

        // Make sure the object complies with the ToolCall type
        const parsedToolCall: ToolCall = {
          id: parsedJson.id || "",
          name: parsedJson.name || "",
          type: parsedJson.type as any,
          arguments: parsedJson.arguments || {},
        }

        console.log("Parsed tool call (after global fix):", parsedToolCall)
        return parsedToolCall
      } catch (globalFixError) {
        console.warn(
          "Failed to parse tool call JSON even after global fixes:",
          globalFixError,
        )

        // Last attempt: manually create an object with the data we can extract
        try {
          const idMatch = jsonStr.match(/"id"\s*:\s*"([^"]+)"/)
          const nameMatch = jsonStr.match(/"name"\s*:\s*"([^"]+)"/)
          const typeMatch = jsonStr.match(/"type"\s*:\s*"([^"]+)"/)

          if (idMatch && nameMatch && typeMatch) {
            const manualToolCall = {
              id: idMatch[1],
              name: nameMatch[1],
              type: typeMatch[1],
              arguments: {},
            }

            console.log("Created manual tool call:", manualToolCall)
            return manualToolCall as ToolCall
          }
        } catch (manualError) {
          console.warn("Failed to create manual tool call:", manualError)
        }

        return null
      }
    }
  } catch (e) {
    console.warn("Failed to process tool call:", e, "from input:", match[1])
    return null
  }
}

export async function getResourceFromChatSession(
  resourceId: string,
  chatSession: ChatSession,
): Promise<Resource | null> {
  const jwt = getCookie("chat_session_token")

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PLAI_API_URL}/chat_sessions/${chatSession.id}/resources/${resourceId}`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  )

  if (!response.ok) {
    return null
  }

  const resource = (await response.json()) as Resource
  return resource
}

export async function getDownloadUrlFromChatSession(
  resourceId: string,
  chatSessionId: string,
): Promise<string> {
  const jwt = getCookie("chat_session_token")

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PLAI_API_URL}/chat_sessions/${chatSessionId}/resources/${resourceId}/download`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error("Failed to get download url")
  }

  const data = (await response.json()) as { download_url: string }
  return data.download_url
}

export function getDocumentIcon(document: Record<string, unknown>) {
  const documentSource = document.source as string | undefined
  // Source it's a url, check if it's a pdf, txt, md, webpage, etc.
  if (documentSource?.includes(".pdf")) {
    return <Icons.pdf className="mr-1 size-5 shrink-0 fill-red-500" />
  }
  if (documentSource?.includes(".txt")) {
    return <File className="mr-2 size-5 shrink-0 text-blue-500" />
  }

  if (
    documentSource?.includes(".mp4") ||
    documentSource?.includes("youtube.com")
  ) {
    return <Video className="mr-2 size-5 shrink-0 text-red-500" />
  }

  if (documentSource?.includes(".mp3") || documentSource?.includes(".wav")) {
    return <FileAudio className="mr-2 size-5 shrink-0 text-green-500" />
  }

  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]

  if (imageExtensions.some((ext) => documentSource?.includes(ext))) {
    return <ImageIcon className="mr-2 size-5 shrink-0 text-blue-500" />
  }

  return <Database className="mr-2 size-5 shrink-0 text-gray-500" />
}

// Document citation helper functions
const mightBeDocumentCitation = (chunk: string): boolean => {
  // Check if this chunk might be the start of a document citation
  // Look for patterns that suggest we're starting a document citation
  return (
    chunk.includes("<") ||
    chunk.includes("documents") ||
    chunk.includes("ids") ||
    chunk.includes("=") ||
    chunk.includes('"')
  )
}

const isCompleteDocumentCitation = (buffer: string): boolean => {
  // Check if we have a complete document citation tag
  // Look for the complete pattern: <documents ids="..." />
  const completeMatch = buffer.match(/<documents\s+ids="[^"]+"\s*\/>/)
  return !!completeMatch
}

const extractDocumentIds = (buffer: string): string[] => {
  // Extract document IDs from the complete citation
  const match = buffer.match(/<documents\s+ids="([^"]+)"\s*\/>/)
  if (match && match[1]) {
    return match[1]
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
  }
  return []
}
