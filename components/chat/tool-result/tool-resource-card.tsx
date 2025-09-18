import { Search, DatabaseIcon } from "lucide-react"
import { DatasourceToolResult } from "@/components/chat/tool-result/datasource-tool-result"
import { PerplexityCard } from "@/components/chat/tool-result/perplexity-card"
import { ExternalDatasourceCard } from "@/components/chat/external-datasource-card"
import { CustomMarkdown } from "@/components/custom-markdown"
import { ToolResultSheet } from "@/components/chat/tool-result/tool-result-sheet"
import type { ChatMessage } from "@/components/chat/types"
import { useTranslation } from "@/components/chat/translations/useTranslation"

export function ToolResultCard({
  toolResult,
}: {
  toolResult: ChatMessage["tool_result"]
}): React.ReactElement | null {
  const { t } = useTranslation()

  if (toolResult?.type === "datasource") {
    return <DatasourceToolResult toolResult={toolResult} />
  }

  if (toolResult?.type === "perplexity") {
    return (
      <ToolResultSheet
        title={t("tool_result_perplexity")}
        icon={<Search className="size-5" />}
      >
        <PerplexityCard toolResult={toolResult} />
      </ToolResultSheet>
    )
  }

  if (toolResult?.type === "external_datasource") {
    return (
      <ToolResultSheet
        title={t("tool_result_external_datasource")}
        icon={<DatabaseIcon className="size-5" />}
      >
        <ExternalDatasourceCard toolResult={toolResult} />
      </ToolResultSheet>
    )
  }

  if (toolResult?.output) {
    return <CustomMarkdown messageBody={toolResult.output as string} />
  }

  return null
}
