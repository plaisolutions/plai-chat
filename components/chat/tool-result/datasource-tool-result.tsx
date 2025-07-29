"use client"

import { useEffect, useState } from "react"
import { useChatSession } from "@/components/chat/hooks"
import { FileWarning } from "lucide-react"
import { TruncatedText } from "@/components/truncated-text"
import { ToolResultSheet } from "@/components/chat/tool-result/tool-result-sheet"
import {
  getResourceFromChatSession,
  getDownloadUrlFromChatSession,
  getDocumentIcon,
} from "@/components/chat/utils"
import { useTranslation } from "@/components/chat/translations/useTranslation"
import type { ChatMessage } from "@/components/chat/types"
import type { Resource } from "@/types/datasources"

export function DatasourceToolResult({
  toolResult,
}: {
  toolResult: ChatMessage["tool_result"]
}) {
  const { chatSession } = useChatSession()
  const [resources, setResources] = useState<Record<string, Resource | null>>(
    {},
  )
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()

  // Group documents by resource_id
  const groupedDocuments = toolResult?.documents_metadata?.reduce(
    (acc, document) => {
      const resourceId = String(document.resource_id).trim().toLowerCase()
      if (!acc[resourceId]) {
        acc[resourceId] = {
          title: document.title,
          source: document.source,
          pages: [],
          output: toolResult?.output,
        }
      }
      if ("page" in document && document.page != null) {
        acc[resourceId].pages.push(document.page as number)
      }
      return acc
    },
    {} as Record<
      string,
      { title: string; source: string; pages: number[]; output: string }
    >,
  )

  // Fetch resources for each resource_id
  useEffect(() => {
    const fetchResources = async () => {
      if (!groupedDocuments || !chatSession) return

      const resourceIds = Object.keys(groupedDocuments)
      const resourcesData: Record<string, any> = {}

      try {
        await Promise.all(
          resourceIds.map(async (resourceId) => {
            try {
              const resource = await getResourceFromChatSession(
                resourceId,
                chatSession,
              )

              if (!resource) return

              if (!resource.external_url) {
                const downloadUrl = await getDownloadUrlFromChatSession(
                  resourceId,
                  chatSession.id,
                )
                resource.external_url = downloadUrl
              }

              resourcesData[resourceId] = resource
            } catch (error) {
              console.error(`Failed to fetch resource ${resourceId}:`, error)
              // Keep the original title if resource fetch fails
              resourcesData[resourceId] = {
                name: groupedDocuments[resourceId].title,
              }
            }
          }),
        )
        setResources(resourcesData)
      } catch (error) {
        console.error("Failed to fetch resources:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchResources()
  }, [chatSession])

  if (loading) {
    return <div className="text-sm text-gray-500">{t("loading_resources")}</div>
  }

  // Each resource card
  const resourcesCards = Object.entries(groupedDocuments || {}).map(
    ([resourceId, doc]) => {
      const resource = resources[resourceId]
      // Render with fullHeight true for main grid
      return (
        <ResourceCard
          key={resourceId}
          resourceId={resourceId}
          doc={doc}
          resource={resource}
          fullHeight={true}
          t={t}
        />
      )
    },
  )

  // The final grid of resources
  return (
    <div className="grid grid-cols-1 items-stretch gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {resourcesCards.map((card, index) => {
        // Apply responsive visibility classes based on index
        if (index === 0) {
          // First card is always visible
          return card;
        } else if (index === 1) {
          // Second card visible only on md and up
          return <div key={`wrapper-${index}`} className="hidden md:block">{card}</div>;
        } else if (index === 2) {
          // Third card visible only on lg and up
          return <div key={`wrapper-${index}`} className="hidden lg:block">{card}</div>;
        } else {
          // All other cards are hidden in the main grid
          return null;
        }
      })}
      {resourcesCards.length > 1 && (
        <ToolResultSheet
          title={`+${Math.max(0, resourcesCards.length - 3)} ${
            Math.max(0, resourcesCards.length - 3) === 1
              ? t("source").toLowerCase()
              : t("sources").toLowerCase()
          }`}
          contentTitle={`${resourcesCards.length.toString()} ${
            resourcesCards.length === 1
              ? t("source").toLowerCase()
              : t("sources").toLowerCase()
          }`}
      >
          {/* Render with fullHeight false inside ToolResultSheet */}
          {Object.entries(groupedDocuments || {}).map(([resourceId, doc]) => (
            <ResourceCard
              key={resourceId + "-sheet"}
              resourceId={resourceId}
              doc={doc}
              resource={resources[resourceId]}
              fullHeight={false}
              t={t}
            />
          ))}
        </ToolResultSheet>
      )}
    </div>
  )
}

// ResourceCard component for conditional md:h-full
function ResourceCard({
  resourceId,
  doc,
  resource,
  fullHeight,
  t,
  className,
}: {
  resourceId: string
  doc: { title: string; source: string; pages: number[]; output: string }
  resource: Resource | null
  fullHeight: boolean
  t: (key: string) => string
  className?: string
}) {
  const cardClass = [
    "flex",
    fullHeight ? "md:h-full" : "",
    "flex-col gap-2 rounded-md bg-stone-50 p-4 hover:cursor-pointer hover:bg-slate-100 mb-3",
    className
  ]
    .filter(Boolean)
    .join(" ")

  if (!resource) {
    return (
      <div key={resourceId} className={cardClass}>
        <div className="flex items-center gap-2 overflow-hidden">
          <FileWarning className="mr-1 size-5 shrink-0 text-red-500" />
          <p className="line-clamp-1 break-words text-sm font-medium">{t("not_available")}</p>
        </div>
        <TruncatedText
          text={t("resource_deleted")}
          showReadMoreButton={false}
          maxLength={55}
          className="text-xs"
        />
      </div>
    )
  }

  return (
    <a
      key={resourceId}
      href={resource.external_url}
      target="_blank"
      rel="noopener noreferrer"
      className="h-full"
    >
      <div className={cardClass}>
        <div className="flex max-w-full items-center gap-2 overflow-hidden">
          {getDocumentIcon({ source: doc.source })}
          <p className="line-clamp-3 break-words text-sm font-medium">{resource.name}</p>
        </div>
        <TruncatedText
          text={resource.summary || doc.output}
          showReadMoreButton={false}
          maxLength={55}
          className="text-xs"
        />
        {doc.pages && doc.pages.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
              {t("pages")}:{" "}
              {Array.from(new Set(doc.pages)).sort((a: number, b: number) => a - b).map(page => page + 1).join(", ")}
            </span>
          </div>
        )}
      </div>
    </a>
  )
}
