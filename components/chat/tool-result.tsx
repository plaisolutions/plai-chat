import { useEffect, useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { CustomMarkdown } from "@/components/custom-markdown"
import { TruncatedText } from "@/components/truncated-text"
import { useTranslation } from "@/components/chat/translations/useTranslation"
import { Database, Search, FileWarning } from "lucide-react"
import { useChatSession } from "@/components/chat/hooks"
import {
  getResourceFromChatSession,
  getDocumentIcon,
} from "@/components/chat/utils"
import { ExternalDatasourceCard } from "@/components/chat/external-datasource-card"
import type { ChatMessage } from "@/components/chat/types"
import type { Resource } from "@/types/datasources"

export function ToolResult({
  toolResult,
}: {
  toolResult: ChatMessage["tool_result"]
}) {
  const { t } = useTranslation()

  function getTitleTranslationKey(toolResult: ChatMessage["tool_result"]) {
    if (toolResult?.type === "datasource") {
      return "tool_result_datasource"
    }

    if (toolResult?.type === "external_datasource") {
      return "tool_result_external_datasource"
    }

    return "tool_result_perplexity"
  }

  const translationKey = getTitleTranslationKey(toolResult)

  return (
    <div className="ml-14 flex flex-col items-start space-y-1 pb-4">
      <Sheet>
        <SheetTrigger>
          <ToolSheetTrigger toolResult={toolResult} />
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t(translationKey)}</SheetTitle>
            <div className="max-h-[calc(100vh-120px)] overflow-y-auto pr-4">
              {getToolResultCard(toolResult)}
            </div>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function getToolResultCard(
  toolResult: ChatMessage["tool_result"],
): React.ReactNode {
  if (toolResult?.type === "datasource") {
    return <DatasourceCard toolResult={toolResult} />
  }

  if (toolResult?.type === "external_datasource") {
    return <ExternalDatasourceCard toolResult={toolResult} />
  }

  return <CustomMarkdown messageBody={toolResult?.output as string} />
}

function getToolResultTranslationKey(toolResult: ChatMessage["tool_result"]) {
  if (toolResult?.type === "datasource") {
    return "tool_result_datasource"
  }

  if (toolResult?.type === "external_datasource") {
    return "tool_result_external_datasource"
  }

  return "tool_result_perplexity"
}

function ToolSheetTrigger({
  toolResult,
}: {
  toolResult: ChatMessage["tool_result"]
}) {
  const { t } = useTranslation()
  const translationKey = getToolResultTranslationKey(toolResult)

  return (
    <div className="mb-4 inline-flex flex-col items-start gap-2 rounded-md border-2 border-gray-200 p-3 hover:bg-gray-100">
      <p className="flex items-center gap-1 text-sm font-medium">
        {t(translationKey)}
      </p>
      <p className="flex items-center gap-1 text-sm capitalize text-gray-500">
        {toolResult?.type === "datasource" ? (
          <Database className="mr-1 size-4 text-gray-500" />
        ) : (
          <Search className="mr-1 size-4 text-gray-500" />
        )}
        {toolResult?.type}
      </p>
    </div>
  )
}

function DatasourceCard({
  toolResult,
}: {
  toolResult: ChatMessage["tool_result"]
}) {
  const { chatSession } = useChatSession()
  const { t } = useTranslation()
  const [resources, setResources] = useState<Record<string, Resource | null>>(
    {},
  )
  const [loading, setLoading] = useState(true)

  // Group documents by resource_id
  const groupedDocuments = toolResult?.documents_metadata?.reduce(
    (acc, document) => {
      const resourceId = document.resource_id as string
      if (!acc[resourceId]) {
        acc[resourceId] = {
          title: document.title,
          source: document.source,
          pages: [],
          output: toolResult?.output,
        }
      }
      if (document.page) {
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
    return <div className="text-sm text-gray-500">Loading resources...</div>
  }

  const documents = Object.entries(groupedDocuments || {}).map(
    ([resourceId, doc]) => {
      const resource = resources[resourceId]
      const displayName = resource?.name || doc.title

      if (!resource) {
        return (
          <div className="mb-4 flex flex-row items-center gap-2 rounded-md border border-gray-200 p-4">
            <FileWarning className="size-5 text-red-500" />
            <p>This resource is not available anymore.</p>
          </div>
        )
      }

      return (
        <div
          key={resourceId}
          className="mb-4 flex flex-col gap-2 rounded-md border border-gray-200 p-4"
        >
          <div className="flex items-center gap-2">
            {getDocumentIcon(resource)}
            <p className="text-sm font-medium">{displayName}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              Pages:{" "}
              {doc.pages.sort((a: number, b: number) => a - b).join(", ")}
            </span>
          </div>
          <TruncatedText
            text={resource.summary || doc.output}
            readMoreText={t("read_more")}
            readLessText={t("read_less")}
            className="text-xs"
          />
        </div>
      )
    },
  )

  return <>{documents}</>
}
