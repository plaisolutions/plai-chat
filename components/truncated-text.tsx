"use client"

import React, { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Component to display truncated text with a "Read more" button
 * @param text Text to display
 * @param maxLength Maximum length before truncating (default 256)
 * @param className Additional CSS classes
 * @param readMoreText Text for the "Read more" button
 * @param readLessText Text for the "Read less" button
 * @param showReadMoreButton Whether to show the "Read more" button (default true)
 * @returns React Component
 */
interface TruncatedTextProps {
  text: string
  maxLength?: number
  className?: string
  readMoreText?: string
  readLessText?: string
  showReadMoreButton?: boolean
}

export function TruncatedText({
  text,
  maxLength = 256,
  className = "",
  readMoreText = "Read more",
  readLessText = "Read less",
  showReadMoreButton = true,
}: TruncatedTextProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const shouldTruncate = text.length > maxLength

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className={className}>
      <p className="text-muted-foreground">
        {isExpanded || !shouldTruncate
          ? text
          : `${text.substring(0, maxLength)}...`}
      </p>
      {shouldTruncate && showReadMoreButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleExpand}
          className="mt-1 h-6 bg-slate-100 px-2 text-xs text-primary dark:bg-muted-foreground/40"
        >
          {isExpanded ? (
            <>
              <span>{readLessText}</span>
              <ChevronUp className="ml-1 size-3" />
            </>
          ) : (
            <>
              <span>{readMoreText}</span>
              <ChevronDown className="ml-1 size-3" />
            </>
          )}
        </Button>
      )}
    </div>
  )
}
