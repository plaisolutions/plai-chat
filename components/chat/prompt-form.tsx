"use client"

import * as React from "react"
import { RxArrowUp, RxPlus, RxStop, RxGear } from "react-icons/rx"
import Textarea from "react-textarea-autosize"

import { useEnterSubmit } from "@/lib/hooks/use-enter-submit"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Microphone } from "@/components/microphone"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Tool } from "@/types/tools"
import { useTranslation } from "@/components/chat/translations/useTranslation"

const maxRows = 8

export interface PromptProps {
  onSubmit: (value: string, enabledTools?: string[]) => Promise<void>
  isLoading: boolean
  onStop: () => void
  onCreateSession?: () => Promise<void>
  tools?: Tool[]
  agentId?: string
}

export default function PromptFrom({
  onSubmit,
  isLoading,
  onCreateSession,
  onStop,
  tools = [],
  agentId,
}: PromptProps) {
  const [input, setInput] = React.useState<string>()
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const { t } = useTranslation()

  // State to store selected tools
  const [selectedTools, setSelectedTools] = React.useState<string[]>([])

  // State to track if the user has modified the selection
  const [hasModifiedSelection, setHasModifiedSelection] =
    React.useState<boolean>(false)

  // State to track the last update from settings
  const [lastSettingsUpdate, setLastSettingsUpdate] = React.useState<
    string | null
  >(null)

  // State to store filtered tools that will be displayed in the popover
  const [filteredTools, setFilteredTools] = React.useState<Tool[]>(tools)

  // Load saved selections on initialization
  React.useEffect(() => {
    // By default, all tools are selected
    const allToolIds = tools.map((tool) => tool.id)

    if (agentId) {
      const savedTools = localStorage.getItem(`agent_${agentId}_tools`)

      if (savedTools) {
        try {
          const parsedTools = JSON.parse(savedTools)
          setSelectedTools(parsedTools)
        } catch (e) {
          console.error("Error parsing saved tools:", e)
          setSelectedTools(allToolIds) // In case of error, select all
        }
      } else {
        // If there's no saved configuration, select all tools
        setSelectedTools(allToolIds)
      }
    } else {
      // If there's no agentId, select all tools
      setSelectedTools(allToolIds)
    }
  }, [agentId, tools])

  // Save selections only when the user modifies them
  React.useEffect(() => {
    if (agentId && hasModifiedSelection) {
      localStorage.setItem(
        `agent_${agentId}_tools`,
        JSON.stringify(selectedTools),
      )
    }
  }, [selectedTools, agentId, hasModifiedSelection])

  // Listen for changes in localStorage to detect updates from settings
  React.useEffect(() => {
    if (!agentId) return

    // Function to handle changes in localStorage
    const handleStorageChange = () => {
      const updateTimestamp = localStorage.getItem(
        `agent_${agentId}_tools_updated`,
      )

      // If there's a new update from settings
      if (updateTimestamp && updateTimestamp !== lastSettingsUpdate) {
        setLastSettingsUpdate(updateTimestamp)

        // Load the updated tools
        const savedTools = localStorage.getItem(`agent_${agentId}_tools`)
        if (savedTools) {
          try {
            const parsedTools = JSON.parse(savedTools)
            setSelectedTools(parsedTools)
            // Don't mark as modified by the user since it comes from settings
            setHasModifiedSelection(false)
          } catch (e) {
            console.error("Error parsing updated tools:", e)
          }
        }
      }
    }

    // Check when mounting the component
    handleStorageChange()

    // Initialize filtered tools
    if (tools && selectedTools.length > 0) {
      const initialFilteredTools = tools.filter((tool) =>
        selectedTools.includes(tool.id),
      )
      setFilteredTools(initialFilteredTools)
    }

    // Listen for the storage event to detect changes immediately
    const handleWindowStorage = (event: StorageEvent) => {
      if (event.key === `agent_${agentId}_tools_updated`) {
        handleStorageChange()
      }
    }

    // Listen for the custom event for immediate update
    const handleCustomEvent = (event: CustomEvent) => {
      const detail = event.detail
      if (detail && detail.agentId === agentId) {
        // Update directly from the event without needing to read localStorage
        const updatedToolIds = detail.tools
        setSelectedTools(updatedToolIds)
        setLastSettingsUpdate(detail.timestamp)
        setHasModifiedSelection(false)

        // Filter tools to show only those in the updated list
        // This makes deleted tools disappear from the popover
        const updatedFilteredTools = tools.filter((tool) =>
          updatedToolIds.includes(tool.id),
        )
        setFilteredTools(updatedFilteredTools)
      }
    }

    window.addEventListener("storage", handleWindowStorage)
    window.addEventListener(
      "agent-tools-updated",
      handleCustomEvent as EventListener,
    )

    // Set up an interval to check periodically (more frequently)
    const intervalId = setInterval(handleStorageChange, 200)

    // Clean up the interval and listeners when unmounting
    return () => {
      clearInterval(intervalId)
      window.removeEventListener("storage", handleWindowStorage)
      window.removeEventListener(
        "agent-tools-updated",
        handleCustomEvent as EventListener,
      )
    }
  }, [agentId, lastSettingsUpdate, selectedTools, tools])

  const handleToolSelection = (toolId: string) => {
    setHasModifiedSelection(true) // Mark that the user has modified the selection
    setSelectedTools((prev) => {
      if (prev.includes(toolId)) {
        return prev.filter((id) => id !== toolId)
      } else {
        return [...prev, toolId]
      }
    })
  }

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const getEnabledTools = () => {
    return selectedTools
  }

  return (
    <form
      className="flex flex-col overflow-hidden rounded-xl border bg-background"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!input?.trim()) {
          return
        }
        setInput("")
        await onSubmit(input, getEnabledTools())
      }}
      ref={formRef}
    >
      <div className="flex w-full flex-row items-start gap-2 p-4">
        {onCreateSession && (
          <div className="relative size-8">
            <button
              onClick={() => {
                onCreateSession()
              }}
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "absolute size-8 rounded-full bg-background px-2",
              )}
            >
              <RxPlus />
              <span className="sr-only">{t("new_chat")}</span>
            </button>
          </div>
        )}

        <div className="flex w-full items-start p-0">
          <div className="w-full min-w-0 max-w-full flex-1">
            <div className="text-token-text-primary default-browser flex overflow-visible">
              <Textarea
                ref={inputRef}
                tabIndex={0}
                onKeyDown={onKeyDown}
                rows={1}
                maxRows={maxRows}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("message_placeholder")}
                spellCheck={false}
                className={`w-full resize-none bg-transparent px-2 py-1.5 text-sm focus-within:outline-none`}
              />
            </div>
          </div>
        </div>

        {tools && tools.length > 0 && (
          <div className="size-8 px-0">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className={cn(
                    buttonVariants({ size: "sm", variant: "secondary" }),
                    "size-8 rounded-md p-0",
                  )}
                >
                  <RxGear size="18px" />
                  <span className="sr-only">{t("configure_tools")}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <p className="text-sm">{t("configure_tools")}</p>
                  <Separator />

                  <ScrollArea className="h-[300px] max-h-40 pr-4">
                    {filteredTools.length > 0 && (
                      <div className="space-y-2">
                        <div className="space-y-2">
                          <div className="space-y-2">
                            {filteredTools.map((tool) => (
                              <div
                                key={tool.id}
                                className="flex items-center justify-between py-1"
                              >
                                <Label
                                  htmlFor={`tool-${tool.id}`}
                                  className="text-sm"
                                >
                                  {tool.name}
                                </Label>
                                <Switch
                                  id={`tool-${tool.id}`}
                                  checked={selectedTools.includes(tool.id)}
                                  onCheckedChange={() =>
                                    handleToolSelection(tool.id)
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        <div className="size-8 px-0">
          <Microphone setInputText={setInput} />
        </div>

        <div className="size-8 px-0">
          {isLoading ? (
            <Button
              type="button"
              onClick={onStop}
              className={cn(
                buttonVariants({ size: "sm", variant: "secondary" }),
                "size-8 rounded-md p-0",
              )}
            >
              <RxStop size="18px" />
              <span className="sr-only">{t("stop_generation")}</span>
            </Button>
          ) : (
            <Button
              type="submit"
              className={cn(
                buttonVariants({ size: "sm", variant: "secondary" }),
                "size-8 rounded-md p-0",
              )}
            >
              <RxArrowUp size="18px" />
              <span className="sr-only">{t("send_message")}</span>
            </Button>
          )}
        </div>
      </div>
      <div className="hidden h-2 w-full bg-background"></div>
    </form>
  )
}
