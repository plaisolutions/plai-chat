"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { FileWarning, FolderIcon } from "lucide-react"
import { TruncatedText } from "@/components/truncated-text"
import { ToolResultSheet } from "@/components/chat/tool-result/tool-result-sheet"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  getResourceFromChatSession,
  getDownloadUrlFromChatSession,
  getResourceTitle,
  getResourceDescription,
  getResourceUrl,
  getDocumentIcon,
  getFolderFromChatSession,
} from "@/components/chat/utils"
import { useTranslation } from "@/components/chat/translations/useTranslation"
import { useChatSession } from "@/components/chat/hooks"
import type { ChatMessage, Folder } from "@/components/chat/types"
import type { Resource } from "@/types/datasources"

export function DatasourceToolResult({
  toolResult,
  forceSheetView = false,
}: {
  toolResult: ChatMessage["tool_result"]
  forceSheetView?: boolean
}) {
  const { chatSession } = useChatSession()
  const [resources, setResources] = useState<Record<string, Resource | null>>(
    {},
  )
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()
  const resourcesRef = useRef<Record<string, Resource | null>>({})

  // Group documents by resource_id - memoized to prevent unnecessary re-renders
  const groupedDocuments = useMemo(() => {
    return toolResult?.documents_metadata?.reduce(
      (acc, document) => {
        const resourceId = String(document.resource_id).trim().toLowerCase()
        if (!acc[resourceId]) {
          acc[resourceId] = {
            title: document.title,
            source: document.source,
            pages: [],
            output: toolResult?.output || "",
            chunks: [],
          }
        }

        // Add page if it exists
        if ("page" in document && document.page != null) {
          acc[resourceId].pages.push(document.page as number)
        }

        // Add chunk text if it exists (for video analysis and other chunked content)
        if ("text" in document && document.text) {
          acc[resourceId].chunks.push(document.text)
        }

        return acc
      },
      {} as Record<
        string,
        {
          title: string
          source: string
          pages: number[]
          output: string
          chunks: string[]
        }
      >,
    )
  }, [toolResult?.documents_metadata, toolResult?.output])

  // Get resource IDs from grouped documents - memoized to prevent unnecessary re-renders
  const resourceIds = useMemo(() => {
    return groupedDocuments ? Object.keys(groupedDocuments) : []
  }, [groupedDocuments])

  // Helper function to get the primary URL from a resource following priority order
  const getResourcePrimaryUrl = (resource: Resource): string | null => {
    if (resource.extra_info?.opengraph?.url) {
      return resource.extra_info.opengraph.url
    }
    if (resource.external_url) {
      return resource.external_url
    }
    return resource.url
  }

  // Deduplicate resources based on their primary URL
  const deduplicatedResources = useMemo(() => {
    const urlToResource = new Map<string, Resource>()
    const deduplicated: Record<string, Resource | null> = {}

    Object.entries(resources).forEach(([resourceId, resource]) => {
      if (!resource) {
        deduplicated[resourceId] = null
        return
      }

      const primaryUrl = getResourcePrimaryUrl(resource)

      if (primaryUrl) {
        // If we already have a resource with this URL, keep the first one
        if (!urlToResource.has(primaryUrl)) {
          urlToResource.set(primaryUrl, resource)
          deduplicated[resourceId] = resource
        } else {
          // Skip this duplicate resource
          deduplicated[resourceId] = null
        }
      } else {
        // Resource has no URL, keep it as is
        deduplicated[resourceId] = resource
      }
    })

    return deduplicated
  }, [resources])

  // Group resources by folder_id to avoid duplicate FolderCards
  const folderGroups = useMemo(() => {
    const folderMap = new Map<
      string,
      { folderId: string; resources: Resource[] }
    >()

    Object.values(deduplicatedResources).forEach((resource) => {
      if (resource && resource.folder_id) {
        if (!folderMap.has(resource.folder_id)) {
          folderMap.set(resource.folder_id, {
            folderId: resource.folder_id,
            resources: [],
          })
        }
        folderMap.get(resource.folder_id)!.resources.push(resource)
      }
    })

    return Array.from(folderMap.values())
  }, [deduplicatedResources])

  // Update ref when resources change
  useEffect(() => {
    resourcesRef.current = resources
  }, [resources])

  // Fetch resources for each resource_id
  useEffect(() => {
    const fetchResources = async () => {
      if (resourceIds.length === 0 || !chatSession) return

      // Check if we already have all the resources loaded
      const existingResourceIds = Object.keys(resourcesRef.current)
      const hasAllResources = resourceIds.every((id) =>
        existingResourceIds.includes(id),
      )

      if (hasAllResources && resourceIds.length > 0) {
        setLoading(false)
        return
      }

      const resourcesData: Record<string, any> = {}

      try {
        await Promise.all(
          resourceIds.map(async (resourceId) => {
            // Skip if we already have this resource
            if (resourcesRef.current[resourceId]) {
              resourcesData[resourceId] = resourcesRef.current[resourceId]
              return
            }

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
                name: groupedDocuments?.[resourceId]?.title || "Unknown",
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
  }, [chatSession, resourceIds, groupedDocuments])

  if (loading) {
    return <div className="text-sm text-gray-500">{t("loading_resources")}</div>
  }

  // Separate regular resources from folder resources
  const regularResources = Object.entries(groupedDocuments || {}).filter(
    ([resourceId, doc]) => {
      const resource = deduplicatedResources[resourceId]
      return resource && !resource.folder_id
    },
  )

  // Each resource card
  const resourcesCards = [
    // Render folder cards first
    ...folderGroups.map((folderGroup) => (
      <FolderCard
        key={`folder-${folderGroup.folderId}`}
        folderId={folderGroup.folderId}
        resources={folderGroup.resources}
      />
    )),
    // Then render regular resource cards
    ...regularResources.map(([resourceId, doc]) => {
      const resource = deduplicatedResources[resourceId]
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
    }),
  ]

  const shouldShowTrigger = resourcesCards.length > 3

  // If forceSheetView is true, render the sheet content directly
  if (forceSheetView) {
    return (
      <div className="space-y-3">
        {/* Render with fullHeight false for sheet view */}
        {[
          // Render folder cards first
          ...folderGroups.map((folderGroup) => (
            <FolderCard
              key={`folder-${folderGroup.folderId}-sheet`}
              folderId={folderGroup.folderId}
              resources={folderGroup.resources}
            />
          )),
          // Then render regular resource cards
          ...regularResources.map(([resourceId, doc]) => {
            const resource = deduplicatedResources[resourceId]
            return (
              <ResourceCard
                key={resourceId + "-sheet"}
                resourceId={resourceId}
                doc={doc}
                resource={resource}
                fullHeight={false}
                t={t}
              />
            )
          }),
        ]}
      </div>
    )
  }

  // The final grid of resources
  return (
    <div className="grid grid-cols-1 items-stretch gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {resourcesCards.map((card, index) => {
        // Apply responsive visibility classes based on index
        if (index === 0) {
          // First card is always visible
          return card
        } else if (index === 1) {
          // Second card visible only on md and up
          return (
            <div key={`wrapper-${index}`} className="hidden md:block">
              {card}
            </div>
          )
        } else if (index === 2) {
          // Third card visible only on lg and up
          return (
            <div key={`wrapper-${index}`} className="hidden lg:block">
              {card}
            </div>
          )
        } else {
          // All other cards are hidden in the main grid
          return null
        }
      })}
      {shouldShowTrigger && (
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
          {[
            // Render folder cards first
            ...folderGroups.map((folderGroup) => (
              <FolderCard
                key={`folder-${folderGroup.folderId}-sheet`}
                folderId={folderGroup.folderId}
                resources={folderGroup.resources}
              />
            )),
            // Then render regular resource cards
            ...regularResources.map(([resourceId, doc]) => {
              const resource = deduplicatedResources[resourceId]
              return (
                <ResourceCard
                  key={resourceId + "-sheet"}
                  resourceId={resourceId}
                  doc={doc}
                  resource={resource}
                  fullHeight={false}
                  t={t}
                />
              )
            }),
          ]}
        </ToolResultSheet>
      )}
    </div>
  )
}

function ResourceCard({
  resourceId,
  doc,
  resource,
  fullHeight,
  t,
  className,
}: {
  resourceId: string
  doc: {
    title: string
    source: string
    pages: number[]
    output: string
    chunks: string[]
  }
  resource: Resource | null
  fullHeight: boolean
  t: (key: string) => string
  className?: string
}) {
  const cardClass = [
    "flex",
    fullHeight ? "md:h-full" : "",
    "flex-col gap-2 rounded-md bg-stone-50 p-4 hover:cursor-pointer hover:bg-slate-100 mb-3",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  if (!resource) {
    return (
      <div key={resourceId} className={cardClass}>
        <div className="flex items-center gap-2 overflow-hidden">
          <FileWarning className="mr-1 size-5 shrink-0 text-red-500" />
          <p className="line-clamp-1 break-words text-sm font-medium">
            {t("not_available")}
          </p>
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
      href={getResourceUrl(resource)}
      target="_blank"
      rel="noopener noreferrer"
      className="h-full"
      data-resource-id={resourceId}
    >
      <div className={cardClass}>
        <div className="flex max-w-full items-center gap-2 overflow-hidden">
          {getDocumentIcon(resource)}
          <p className="line-clamp-3 break-words text-sm font-medium">
            {getResourceTitle(resource)}
          </p>
        </div>
        <TruncatedText
          text={
            getResourceDescription(resource) ||
            doc.output ||
            (doc.chunks.length > 0 ? doc.chunks[0] : "")
          }
          showReadMoreButton={true}
          maxLength={55}
          className="text-xs"
        />
        <div className="flex flex-wrap gap-1">
          {doc.pages && doc.pages.length > 0 && (
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
              {t("pages")}:{" "}
              {Array.from(new Set(doc.pages))
                .sort((a: number, b: number) => a - b)
                .map((page) => page + 1)
                .join(", ")}
            </span>
          )}
          {doc.chunks && doc.chunks.length > 1 && (
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
              {doc.chunks.length} {t("segments")}
            </span>
          )}
        </div>
      </div>
    </a>
  )
}

function FolderCard({
  folderId,
  resources,
}: {
  folderId: string
  resources: Resource[]
}) {
  const { chatSession } = useChatSession()
  const [folder, setFolder] = useState<Folder | null>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    const fetchFolderData = async () => {
      if (!chatSession) return

      try {
        const folderData = await getFolderFromChatSession(folderId, chatSession)
        setFolder(folderData)
      } catch (error) {
        console.error("Failed to fetch folder data:", error)
        // Set folder to null to show error state
        setFolder(null)
      } finally {
        setLoading(false)
      }
    }

    fetchFolderData()
  }, [folderId, chatSession])

  if (loading) {
    return (
      <div className="mb-3 flex flex-col gap-2 rounded-md bg-stone-50 p-4 hover:cursor-pointer hover:bg-slate-100">
        <div className="flex items-center gap-2">
          <FolderIcon className="size-5 text-blue-500" />
          <p className="text-sm font-medium">Loading folder...</p>
        </div>
      </div>
    )
  }

  if (!folder) {
    return (
      <div className="mb-3 flex flex-col gap-2 rounded-md bg-stone-50 p-4 hover:cursor-pointer hover:bg-slate-100">
        <div className="flex items-center gap-2">
          <FolderIcon className="size-5 text-red-500" />
          <p className="text-sm font-medium">Folder not accessible</p>
        </div>
        <p className="text-xs text-gray-500">Folder ID: {folderId}</p>
      </div>
    )
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div
          data-folder-id={folderId}
          className="mb-3 flex flex-col gap-2 rounded-md bg-stone-50 p-4 hover:cursor-pointer hover:bg-slate-100"
        >
          <div className="flex items-center gap-2">
            <FolderIcon className="size-5 text-blue-500" />
            <p className="text-sm font-medium">{folder.name}</p>
          </div>
          <p className="text-xs text-gray-600">
            {resources.length}{" "}
            {resources.length === 1 ? t("resource") : t("resources")}
          </p>
        </div>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FolderIcon className="size-5 text-blue-500" />
            {folder.name}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {resources.length === 0 ? (
            <p className="text-sm text-gray-500">No resources in this folder</p>
          ) : (
            resources.map((resource) => (
              <div
                key={resource.id}
                data-resource-id={resource.id}
                className="flex items-center gap-3 rounded-md border p-3 hover:bg-gray-50"
              >
                {getDocumentIcon(resource)}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {getResourceTitle(resource)}
                  </p>
                  {getResourceDescription(resource) && (
                    <p className="truncate text-xs text-gray-500">
                      {getResourceDescription(resource)}
                    </p>
                  )}
                </div>
                {getResourceUrl(resource) && (
                  <a
                    href={getResourceUrl(resource)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
