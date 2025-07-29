"use client"

import React, { useMemo } from "react"
import { Database, Copy, Check, Code, Table as TableIcon } from "lucide-react"
import { useTranslation } from "@/components/chat/translations/useTranslation"
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import {
  oneLight,
  dracula,
} from "react-syntax-highlighter/dist/cjs/styles/prism"
import { useTheme } from "next-themes"
import type { ToolResult } from "@/components/chat/types"

interface ExternalDatasourceCardProps {
  toolResult: ToolResult
}

export function ExternalDatasourceCard({
  toolResult,
}: ExternalDatasourceCardProps) {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const { isCopied: isSqlCopied, copyToClipboard: copySql } =
    useCopyToClipboard({ timeout: 2000 })
  const { isCopied: isTableCopied, copyToClipboard: copyTable } =
    useCopyToClipboard({ timeout: 2000 })
  const { isCopied: isJsonCopied, copyToClipboard: copyJson } =
    useCopyToClipboard({ timeout: 2000 })

  function transformDataFrameToTable(dataFrame: any): {
    columns: string[]
    rows: any[][]
  } {
    if (!dataFrame) {
      return { columns: [], rows: [] }
    }

    // Case 1: If it's an array of objects
    if (Array.isArray(dataFrame)) {
      if (dataFrame.length === 0) return { columns: [], rows: [] }

      const columns = Object.keys(dataFrame[0])
      const rows = dataFrame.map((rowObj: any) =>
        columns.map((col) => rowObj[col] ?? ""),
      )
      return { columns, rows }
    }

    // Case 2: If it's an object like {column: {index: value}}
    if (typeof dataFrame === "object" && !Array.isArray(dataFrame)) {
      // Check if it has the expected structure
      const columns = Object.keys(dataFrame)

      // If there are no columns, return empty
      if (columns.length === 0) {
        // console.log("No columns in the DataFrame");
        return { columns: [], rows: [] }
      }

      // Check if at least one column has the expected structure
      const hasExpectedStructure = columns.some(
        (col) =>
          dataFrame[col] &&
          typeof dataFrame[col] === "object" &&
          !Array.isArray(dataFrame[col]),
      )

      if (!hasExpectedStructure) {
        // console.log("The DataFrame doesn't have the expected structure");
        // If it's a simple object, convert it to table format
        const simpleColumns = ["Propiedad", "Valor"]
        const simpleRows = Object.entries(dataFrame).map(([key, value]) => [
          key,
          String(value),
        ])
        return { columns: simpleColumns, rows: simpleRows }
      }

      try {
        // Process normally if it has the expected structure
        // Get all indices from all columns to make sure we don't miss any rows
        const allIndices = new Set<string>()
        columns.forEach((col) => {
          if (dataFrame[col] && typeof dataFrame[col] === "object") {
            Object.keys(dataFrame[col]).forEach((idx) => allIndices.add(idx))
          }
        })

        const rowIndices = Array.from(allIndices)
        // console.log("Columns:", columns);
        // console.log("Total row indices:", rowIndices.length);

        const rows = rowIndices.map((idx: string) => {
          const row = columns.map((col) => {
            let value = dataFrame[col]?.[idx]

            // Truncate long values (especially for the description column)
            if (typeof value === "string" && value.length > 100) {
              value = value.substring(0, 97) + "..."
            }

            return value ?? ""
          })
          return row
        })

        return { columns, rows }
      } catch (error) {
        console.error("Error processing the DataFrame:", error)
        return { columns: ["Error"], rows: [["Error processing the data"]] }
      }
    }

    return { columns: [], rows: [] }
  }

  function renderTable(columns: string[], rows: any[][]): React.ReactNode {
    if (!columns.length || !rows.length) {
      return (
        <div className="p-2 text-sm text-muted-foreground">
          No data to display
        </div>
      )
    }

    return (
      <Table>
        {rows.length > 10 && (
          <TableCaption>{`Showing ${rows.length} results`}</TableCaption>
        )}
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead
                key={`col-${index}`}
                className="p-2 text-xs"
                style={{
                  maxWidth: column === "description" ? "300px" : "150px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={String(column)}
              >
                {String(column)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => {
                const cellContent =
                  cell !== null && cell !== undefined ? String(cell) : "-"
                return (
                  <TableCell
                    key={`cell-${rowIndex}-${cellIndex}`}
                    className="p-2 text-xs"
                    style={{
                      maxWidth:
                        columns[cellIndex] === "description"
                          ? "300px"
                          : "150px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={cellContent}
                  >
                    {cellContent}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  const sqlQuery = toolResult?.sql_query || ""

  // Get and parse json_table if it's a string
  let rawJsonTable: any = {}
  try {
    if (toolResult.json_table) {
      const jsonTableData = toolResult.json_table
      if (typeof jsonTableData === "string") {
        // If it's a JSON string, we try to parse it
        rawJsonTable = JSON.parse(jsonTableData)
      } else {
        rawJsonTable = jsonTableData || {}
      }
    }
  } catch (error) {
    console.error("Error parsing json_table:", error)
    rawJsonTable = {}
  }

  // Debug logs (commented for production)
  // console.log("toolResult:", toolResult);
  // console.log("toolResult.extra_info:", toolResult?.extra_info);
  // console.log("rawJsonTable (after parsing):", rawJsonTable);

  const textMessage =
    typeof toolResult?.output === "string" ? toolResult.output : ""
  const jsonTable = transformDataFrameToTable(rawJsonTable || {})

  // More debug logs (commented for production)
  // console.log("jsonTable:", jsonTable);
  // console.log("columns:", jsonTable?.columns);
  // console.log("rows:", jsonTable?.rows);

  const columns = useMemo(() => {
    return Array.isArray(jsonTable?.columns) ? jsonTable.columns : []
  }, [jsonTable])

  const rows = useMemo(() => {
    return Array.isArray(jsonTable?.rows) ? jsonTable.rows : []
  }, [jsonTable])

  const hasRawData = !!(
    rawJsonTable &&
    typeof rawJsonTable === "object" &&
    Object.keys(rawJsonTable).length > 0
  )
  const hasData = !!(
    sqlQuery ||
    (columns.length > 0 && rows.length > 0) ||
    hasRawData
  )

  const handleCopyTable = () => {
    if (!columns.length || !rows.length) return
    try {
      const headerRow = columns.join("\t")
      const dataRows = rows.map((row) => row.join("\t")).join("\n")
      const tableText = `${headerRow}\n${dataRows}`
      copyTable(tableText)
    } catch (error) {
      console.error("[ExternalDatasourceCard] Error copying table:", error)
    }
  }

  const handleCopyJson = () => {
    const jsonToCopy = rawJsonTable || jsonTable
    if (!jsonToCopy) return
    try {
      copyJson(JSON.stringify(jsonToCopy, null, 2))
    } catch (error) {
      console.error("[ExternalDatasourceCard] Error copying JSON:", error)
    }
  }

  if (!toolResult || !hasData) {
    return (
      <div className="py-4 text-sm text-muted-foreground">
        {t("no_datasource_result")}
      </div>
    )
  }

  return (
    <div id="sql-query-container" className="flex flex-col gap-8 space-y-4">
      {/* SQL Query */}
      {sqlQuery && (
        <div className="mt-8 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="mr-2 size-5 text-blue-500" />
              <h3 className="text-sm font-medium">{t("sql_query")}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => copySql(sqlQuery)}
            >
              {isSqlCopied ? (
                <>
                  <Check className="mr-1 size-4" />
                  {t("copied")}
                </>
              ) : (
                <>
                  <Copy className="mr-1 size-4" />
                  {t("copy") || "Copiar"}
                </>
              )}
            </Button>
          </div>
          <div
            id="sql-query-wrapper"
            className="relative rounded-md border bg-muted"
          >
            <SyntaxHighlighter
              language="sql"
              style={theme === "dark" ? dracula : oneLight}
              customStyle={{
                margin: 0,
                borderRadius: "0.375rem",
                fontSize: "0.675rem",
                backgroundColor: "transparent",
                padding: "1rem 8px",
              }}
            >
              {sqlQuery}
            </SyntaxHighlighter>
          </div>
        </div>
      )}

      {/* Table Results */}
      {columns.length > 0 && rows.length > 0 && (
        <div className="mt-8 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TableIcon className="mr-2 size-5 text-green-500" />
              <h3 className="text-sm font-medium">
                {t("query_results") || "Query results"}
              </h3>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={handleCopyTable}
              >
                {isTableCopied ? (
                  <>
                    <Check className="mr-1 size-4" />
                    {t("table_copied") || "Table copied"}
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 size-4" />
                    {t("copy_table") || "Copy table"}
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={handleCopyJson}
              >
                {isJsonCopied ? (
                  <>
                    <Check className="mr-1 size-4" />
                    {t("json_copied") || "JSON copied"}
                  </>
                ) : (
                  <>
                    <Code className="mr-1 size-4" />
                    {t("copy_json") || "Copy JSON"}
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="rounded-md border">{renderTable(columns, rows)}</div>
        </div>
      )}
    </div>
  )
}
