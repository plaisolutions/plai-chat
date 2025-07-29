"use client"

import React, { useState, useEffect, useRef } from "react"
import { Database, ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { TruncatedText } from "@/components/truncated-text"
import { getDocumentIcon } from "@/components/chat/utils"
import { useChatSession } from "@/components/chat/context"
import { getThread } from "@/components/chat/context-utils"
import { getResourceFromChatSession } from "@/components/chat/utils"

interface DocumentCitationProps {
  ids: string[]
  className?: string
}

interface ResourceDetail {
  id: string
  name: string
  summary?: string
  type?: string
  external_url?: string
  status?: string
  created_at?: string
  error?: string
}

export function DocumentCitation({ ids, className }: DocumentCitationProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [resourceDetails, setResourceDetails] = useState<ResourceDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const { chatSession, activeThreadId } = useChatSession()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside and handle window resize
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    const handleResize = () => {
      if (isOpen) {
        calculateDropdownPosition()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      window.addEventListener("resize", handleResize)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener("resize", handleResize)
    }
  }, [isOpen])

  // Fetch resource details when dropdown opens
  const fetchResourceDetails = async () => {
    if (!chatSession || !activeThreadId || resourceDetails.length > 0) return

    setLoading(true)
    try {
      // Get current thread to access all messages
      const threadData = await getThread(activeThreadId || "")
      if (threadData.error || !threadData.thread) {
        console.error("Failed to fetch thread:", threadData.error)
        return
      }

      // Search through all messages for tool_results containing documents_metadata
      const foundResources: ResourceDetail[] = []

      for (const message of threadData.thread.messages) {
        if (message.tool_result?.documents_metadata) {
          for (const doc of message.tool_result.documents_metadata) {
            // Check if this document ID matches any of our citation IDs
            if (ids.includes(doc.id) && doc.resource_id) {
              try {
                // Fetch the resource information using the resource_id
                const resource = await getResourceFromChatSession(
                  doc.resource_id,
                  chatSession,
                )
                if (resource) {
                  foundResources.push({
                    id: doc.id,
                    name: resource.name || `Resource ${doc.resource_id}`,
                    summary: resource.summary,
                    type: resource.type,
                    external_url: resource.external_url,
                    status: resource.status,
                    created_at: resource.created_at,
                  })
                }
              } catch (error) {
                console.error(
                  `Failed to fetch resource ${doc.resource_id}:`,
                  error,
                )
                // Fallback if resource fetch fails
                foundResources.push({
                  id: doc.id,
                  name: `Resource ${doc.resource_id}`,
                  summary: "Failed to load resource",
                  error: "Resource fetch failed",
                })
              }
            }
          }
        }
      }

      if (foundResources.length > 0) {
        setResourceDetails(foundResources)
      }
    } catch (error) {
      console.error("Failed to fetch resource details:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!ids || ids.length === 0) {
    return null
  }

  const calculateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top

      // Check if there's enough space below, otherwise position above
      const shouldPositionAbove = spaceBelow < 400 && spaceAbove > 400

      setDropdownPosition({
        top: shouldPositionAbove ? rect.top - 400 : rect.bottom + 8,
        left: rect.left,
      })
    }
  }

  const handleButtonClick = () => {
    if (!isOpen) {
      fetchResourceDetails()
      calculateDropdownPosition()
    }
    setIsOpen(!isOpen)
  }

  const currentResource = resourceDetails[currentIndex]
  const hasMultipleDocuments = ids.length > 1

  const navigateToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ids.length)
  }

  const navigateToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + ids.length) % ids.length)
  }

  const isUuid = (id: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id,
    )
  }

  if (ids.length > 0 && !isUuid(ids[0])) {
    return null
  }

  return (
    <span className="relative ml-2 inline-block">
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 rounded-md border bg-stone-50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-slate-100",
          className,
        )}
      >
        <Database className="size-4 shrink-0 text-blue-500" />
        {ids.length > 1 && (
          <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800">
            +{ids.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed z-[9999] w-80 max-w-[300px] rounded-md border border-gray-200 bg-white p-4 shadow-xl"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {/* Header with title and navigation */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">Cited Documents</h3>
            <div className="flex items-center gap-2">
              {hasMultipleDocuments && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigateToPrevious}
                    disabled={loading}
                    className="size-6 p-0"
                  >
                    <ChevronLeft className="size-3" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {currentIndex + 1}/{ids.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigateToNext}
                    disabled={loading}
                    className="size-6 p-0"
                  >
                    <ChevronRight className="size-3" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="size-6 p-0"
              >
                <X className="size-3" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="text-xs text-muted-foreground">
                Loading resources...
              </div>
            </div>
          ) : currentResource ? (
            <div className="space-y-3">
              <div className="rounded-md border border-gray-200 bg-stone-50 p-3">
                <div className="mb-2 flex items-center gap-2">
                  {getDocumentIcon({
                    source: currentResource.external_url || "",
                    type: currentResource.type,
                  })}
                  <h4 className="text-xs font-medium leading-tight">
                    {currentResource.name}
                  </h4>
                </div>

                {currentResource.error && (
                  <div className="mb-2">
                    <div className="flex items-start text-red-600">
                      <div className="text-xs">
                        <span className="font-medium">Error: </span>
                        <span className="break-words">
                          {currentResource.error}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {currentResource.external_url && (
                  <div className="mb-2">
                    <p className="mb-1 text-xs text-muted-foreground">URL:</p>
                    <a
                      href={currentResource.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-xs text-blue-600 hover:underline"
                    >
                      {currentResource.external_url}
                    </a>
                  </div>
                )}

                {currentResource.type && (
                  <div className="mb-2">
                    <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                      Type: {currentResource.type}
                    </span>
                  </div>
                )}

                {currentResource.status && (
                  <div className="mb-2">
                    <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                      Status: {currentResource.status}
                    </span>
                  </div>
                )}

                {currentResource.summary && (
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">
                      Summary:
                    </p>
                    <TruncatedText
                      text={currentResource.summary}
                      showReadMoreButton={true}
                      maxLength={150}
                      className="text-xs"
                    />
                  </div>
                )}

                <div className="mt-2 border-t border-gray-200 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Resource ID: {currentResource.id.substring(0, 12)}...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-6">
              <div className="text-xs text-muted-foreground">
                No resource details available
              </div>
            </div>
          )}
        </div>
      )}
    </span>
  )
}
