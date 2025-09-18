"use client"

import { DatabaseIcon } from "lucide-react"
import { DatasourceToolResult } from "@/components/chat/tool-result/datasource-tool-result"
import { ToolResultSheet } from "@/components/chat/tool-result/tool-result-sheet"
import { useTranslation } from "@/components/chat/translations/useTranslation"
import type { ChatMessage } from "@/components/chat/types"

interface ShowSourcesButtonProps {
  toolResult: ChatMessage["tool_result"]
}

export function ShowSourcesButton({ toolResult }: ShowSourcesButtonProps) {
  const { t } = useTranslation()

  // Only render if tool result exists and is of type "datasource"
  if (!toolResult || toolResult.type !== "datasource") {
    return null
  }

  return (
    <div className="mt-2">
      <ToolResultSheet
        title={`${t("show_sources")}`}
        contentTitle={`${t("sources")}`}
        icon={<DatabaseIcon className="size-4" />}
      >
        {/* Use DatasourceToolResult with forceSheetView to show all resources */}
        <DatasourceToolResult toolResult={toolResult} forceSheetView={true} />
      </ToolResultSheet>
    </div>
  )
}
