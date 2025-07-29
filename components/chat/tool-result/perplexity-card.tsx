"use client"

import React, { useMemo, memo } from "react"
import { ExternalLink, Globe } from "lucide-react"
import { useTranslation } from "@/components/chat/translations/useTranslation"
import { usePageTitles } from "@/lib/hooks/use-page-titles"
import { CustomMarkdown } from "@/components/custom-markdown"

interface PerplexityCardProps {
  toolResult: any
}

// Memoized component to display an individual citation
const CitationItem = memo(({ url, title }: { url: string; title: string }) => {
  return (
    <div className="flex items-start">
      <Globe className="mr-2 size-5 shrink-0 text-green-500" />
      <div className="grow">
        <h6 className="text-xs font-medium text-foreground">{title}</h6>
        <div className="mt-1">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-start text-xs text-primary hover:underline"
          >
            <span className="block max-w-[300px] truncate">{url}</span>{" "}
            <ExternalLink className="ml-1 size-3 shrink-0" />
          </a>
        </div>
      </div>
    </div>
  )
})

CitationItem.displayName = "CitationItem"

export function PerplexityCard({ toolResult }: PerplexityCardProps) {
  const { t } = useTranslation()

  // Extract the summary text
  let summaryText = ""
  if (typeof toolResult.output === "string") {
    summaryText = toolResult.output
  } else if (toolResult.output && typeof toolResult.output === "object") {
    summaryText = JSON.stringify(toolResult.output)
  }

  const citations = useMemo(() => {
    let citationsArray: string[] = []

    try {
      if (
        toolResult.extra_info &&
        toolResult.extra_info.citations &&
        Array.isArray(toolResult.extra_info.citations)
      ) {
        citationsArray = toolResult.extra_info.citations
      } else if (typeof toolResult.output === "string") {
        // Look for the "Sources:" section in the output
        const sourcesMatch = toolResult.output.match(
          /Sources:\s*\n([\s\S]*?)(\n\n|$)/i,
        )
        if (sourcesMatch && sourcesMatch[1]) {
          const urlRegex = /(https?:\/\/[^\s]+)/g
          const matches = sourcesMatch[1].match(urlRegex)
          if (matches) {
            citationsArray = matches
          }
        }
      }

      // Force conversion to array if for some reason it's not
      if (citationsArray && !Array.isArray(citationsArray)) {
        if (typeof citationsArray === "string") {
          citationsArray = [citationsArray]
        } else {
          citationsArray = []
        }
      }
    } catch (error) {
      console.error("Error processing citations:", error)
      citationsArray = []
    }

    return citationsArray
  }, [toolResult])

  const { titles: pageTitles } = usePageTitles(citations)

  if (!toolResult) {
    return (
      <div className="p-2 text-sm text-muted-foreground">
        {t("no_perplexity_result")}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Sources/citations section */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">{t("sources")}</h3>

        {citations && citations.length > 0 ? (
          // Map citations if they exist using the memoized component
          citations.map((url: string, index: number) => (
            <div
              key={`url-${index}`}
              className="space-y-1.5 rounded-md border p-3 text-xs"
            >
              <CitationItem url={url} title={pageTitles[url] || url} />
            </div>
          ))
        ) : (
          <div className="rounded-md border p-3 text-muted-foreground">
            {t("no_citations_found")}
          </div>
        )}
      </div>

      {summaryText && (
        <div className="rounded-md border p-3">
          <CustomMarkdown
            messageBody={summaryText}
            processCitations={true}
            className="text-xs"
          />
        </div>
      )}
    </div>
  )
}
